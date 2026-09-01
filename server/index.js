const app = require('./app');
const http = require('http');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('./db');
const { decrypt, isEncrypted } = require('./utils/crypto');
const { generateInvoiceHTML, recalculateTotals } = require('./routes/invoices');
const { setupWebSocket, getWss } = require('./websocket');
const { TIER_LIMITS: CRON_TIER_LIMITS, resetIfNewDay: cronResetIfNewDay, getEffectiveDate } = require('./middleware/actionLimit');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const wss = setupWebSocket(server);

// Leader election: only the first instance runs cron jobs
const isLeader = process.env.CRON_ENABLED === 'true' || process.env.INSTANCE_ROLE === 'leader' || !process.env.INSTANCE_ROLE;

if (isLeader) {
  // Cron job: Run daily at midnight to generate recurring invoices
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Checking recurring invoices...');
    try {
      const users = db.prepare('SELECT id, tier FROM users').all();
      const intervals = { weekly: 7, monthly: 30, quarterly: 90 };

      for (const user of users) {
        const limit = CRON_TIER_LIMITS[user.tier] || CRON_TIER_LIMITS.free;
        const freshUser = cronResetIfNewDay(user.id);
        const currentCount = freshUser ? freshUser.daily_action_count : 0;

        if (limit !== Infinity && currentCount >= limit) {
          console.log(`[Cron] Skipping user ${user.id}: action limit reached`);
          continue;
        }

        const invoices = db.prepare(
          'SELECT id, data, status, custom_fields FROM invoices WHERE user_id = ?'
        ).all(user.id);

        let createdCount = 0;
        for (const inv of invoices) {
          if (limit !== Infinity && currentCount + createdCount >= limit) break;

          try {
            const data = JSON.parse(inv.data);
            if (!data.recurring || data.recurring === 'none') continue;

            const days = intervals[data.recurring] || 30;
            const lastDate = new Date(data.invoiceDate || data.createdAt || Date.now());
            const nextDue = new Date(lastDate);
            nextDue.setDate(nextDue.getDate() + days);

            if (nextDue <= new Date()) {
              // Idempotency check: skip if a draft with the same number already exists
              const numMatch = data.invoiceNumber ? data.invoiceNumber.match(/(\d+)$/) : null;
              const newNum = numMatch
                ? data.invoiceNumber.replace(/\d+$/, m => String(parseInt(m) + 1).padStart(m.length, '0'))
                : (data.invoiceNumber || 'INV-001') + '-R';

              const existing = db.prepare(
                "SELECT id FROM invoices WHERE user_id = ? AND json_extract(data, '$.invoiceNumber') = ?"
              ).get(user.id, newNum);
              if (existing) {
                console.log(`[Cron] Skipping duplicate recurring invoice ${newNum} for user ${user.id}`);
                continue;
              }

              const newData = {
                ...data,
                invoiceNumber: newNum,
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + days * 86400000).toISOString().split('T')[0],
                status: 'draft',
                id: undefined
              };

              db.prepare('INSERT INTO invoices (id, user_id, data, status, custom_fields) VALUES (?, ?, ?, ?, ?)').run(
                uuidv4(), user.id, JSON.stringify(newData), 'draft', inv.custom_fields || '[]'
              );
              createdCount++;
              console.log(`[Cron] Generated recurring invoice ${newNum} for user ${user.id}`);
            }
          } catch (parseErr) {
            console.error(`[Cron] Skipping corrupt invoice ${inv.id} for user ${user.id}:`, parseErr.message);
          }
        }

        // Increment action count for created invoices
        if (createdCount > 0) {
          const today = getEffectiveDate(user.id);
          db.prepare(`
            UPDATE users
            SET daily_action_count = CASE
              WHEN daily_action_date = ? THEN daily_action_count + ?
              ELSE ?
            END,
            daily_action_date = ?
            WHERE id = ?
          `).run(today, createdCount, createdCount, today, user.id);
        }

        // Yield to event loop between users
        await new Promise(resolve => setImmediate(resolve));
      }
    } catch (err) {
      console.error('[Cron] Error generating recurring invoices:', err.message);
    }
  });

  // Cron job: Run every hour to mark overdue invoices
  cron.schedule('0 * * * *', async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const overdueInvs = db.prepare(
        "SELECT id, user_id, status, data, json_extract(data, '$.dueDate') as due_date FROM invoices WHERE status NOT IN ('paid', 'overdue')"
      ).all();
      for (const inv of overdueInvs) {
        if (inv.due_date && inv.due_date < today) {
          db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run('overdue', inv.id);
          db.prepare('INSERT INTO status_history (id, invoice_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?, ?)').run(
            uuidv4(), inv.id, inv.status, 'overdue', inv.user_id
          );
        }
      }

      // Overdue Reminders (send at 1, 7, 14 days overdue)
      const remindersToSend = db.prepare(
        "SELECT id, user_id, data FROM invoices WHERE status = 'overdue'"
      ).all();

      for (const inv of remindersToSend) {
        try {
          const data = JSON.parse(inv.data);
          if (!data.clientEmail || !data.dueDate) continue;

          const due = new Date(data.dueDate);
          const now = new Date();
          const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));

          if (daysOverdue < 1) continue;

          // Decide if a reminder is needed
          const reminderStops = [1, 7, 14];
          let shouldSend = false;
          let newMax = data.lastReminderDays || 0;

          for (const stop of reminderStops) {
            if (daysOverdue >= stop && (data.lastReminderDays || 0) < stop) {
              shouldSend = true;
              newMax = stop;
            }
          }

          if (shouldSend) {
            // Check if user has Email configuration
            const emailConfig = db.prepare('SELECT * FROM email_configs WHERE user_id = ?').get(inv.user_id);
            let decryptedPass = null;
            try {
              if (emailConfig && isEncrypted(emailConfig.pass)) {
                decryptedPass = decrypt(emailConfig.pass);

                const transporter = nodemailer.createTransport({
                  host: emailConfig.host,
                  port: emailConfig.port,
                  secure: emailConfig.secure === 1,
                  auth: { user: emailConfig.user, pass: decryptedPass }
                });

                // Prep HTML
                let paymentLinkUrl = data.paymentLink || '';
                if (!paymentLinkUrl && process.env.CLIENT_URL) {
                  paymentLinkUrl = `${process.env.CLIENT_URL}/api/invoices/${inv.id}/pay`;
                }
                data.paymentLinkUrl = paymentLinkUrl;

                recalculateTotals(data);
                const htmlContent = generateInvoiceHTML(data);
                const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
                const accentColor = hexColorRegex.test(emailConfig.email_accent_color) ? emailConfig.email_accent_color : '#5e6ad2';
                const bodyBg = hexColorRegex.test(emailConfig.email_body_bg) ? emailConfig.email_body_bg : '#ffffff';

                const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
                  <style>
                    body { background: ${bodyBg}; font-family: Arial, sans-serif; }
                    .email-header h1 { color: ${accentColor}; }
                    table thead tr { background: ${accentColor} !important; color: #fff !important; }
                  </style>
                </head><body>
                <div style="max-width:700px;margin:0 auto;padding:20px;background:#fff0f0;border-left:4px solid red;margin-bottom:20px;">
                  <h3 style="color:red;margin-top:0;">Payment Reminder: Invoice Overdue</h3>
                  <p>Hi ${data.clientName},<br>This is a reminder that Invoice <b>#${data.invoiceNumber}</b> is now ${daysOverdue} days overdue. Please arrange payment as soon as possible.</p>
                </div>
                ${htmlContent}</body></html>`;

                await transporter.sendMail({
                  from: `"${emailConfig.from_name || data.companyName || 'Invoice Generator'}" <${emailConfig.from_email || emailConfig.user}>`,
                  to: data.clientEmail,
                  subject: `Reminder: Invoice #${data.invoiceNumber} is Overdue`,
                  html: styledHtml
                });
              }
            } finally {
              // Zero out decrypted password from memory after use
              if (decryptedPass) {
                // Overwrite the string in memory (best effort in JS)
                decryptedPass = '';
              }
            }

            // Update JSON data to reflect reminder sent
            data.lastReminderDays = newMax;
            data.lastReminderSentAt = new Date().toISOString();
            db.prepare('UPDATE invoices SET data = ? WHERE id = ?').run(JSON.stringify(data), inv.id);
            console.log(`[Cron] Sent ${newMax}-day overdue reminder for invoice ${data.invoiceNumber}`);
          }

        } catch (innerErr) {
          console.error(`[Cron] Error processing reminder for invoice ${inv.id}:`, innerErr);
        }
      }

    } catch (err) {
      console.error('[Cron] Overdue check error:', err.message);
    }
  });

  console.log('[Cron] Cron jobs enabled (leader instance)');
} else {
  console.log('[Cron] Cron jobs disabled (non-leader instance)');
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n[${signal}] Received. Shutting down gracefully...`);

  server.close(() => {
    console.log('[Shutdown] HTTP server closed');

    const wssInstance = getWss();
    if (wssInstance) {
      wssInstance.close(() => {
        console.log('[Shutdown] WebSocket server closed');
        try {
          db.close();
          console.log('[Shutdown] Database closed');
        } catch (e) {
          console.error('[Shutdown] Error closing database:', e.message);
        }
        process.exit(0);
      });
    } else {
      try {
        db.close();
        console.log('[Shutdown] Database closed');
      } catch (e) {
        console.error('[Shutdown] Error closing database:', e.message);
      }
      process.exit(0);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[Shutdown] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
