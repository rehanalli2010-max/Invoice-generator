require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http = require('http');
const path = require('path');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

const app = require('./app');
const db = require('./db');
const { setupWebSocket, getWss } = require('./websocket');
const { TIER_LIMITS: CRON_TIER_LIMITS, resetIfNewDay: cronResetIfNewDay, getEffectiveDate } = require('./middleware/actionLimit');

// Load Next.js from next-app's own node_modules
const nextAppDir = path.join(__dirname, '..', 'next-app');
const next = require(path.join(nextAppDir, 'node_modules', 'next'));

const PORT = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';

const nextApp = next({ dev, dir: nextAppDir });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  // Catch-all: let Next.js handle everything that isn't an API route
  app.all('*', (req, res) => nextHandler(req, res));

  const server = http.createServer(app);
  setupWebSocket(server);

  const isLeader = process.env.CRON_ENABLED === 'true' || process.env.INSTANCE_ROLE === 'leader' || !process.env.INSTANCE_ROLE;

  if (isLeader) {
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
                const numMatch = data.invoiceNumber ? data.invoiceNumber.match(/(\d+)$/) : null;
                const newNum = numMatch
                  ? data.invoiceNumber.replace(/\d+$/, m => String(parseInt(m) + 1).padStart(m.length, '0'))
                  : (data.invoiceNumber || 'INV-001') + '-R';

                const existing = db.prepare(
                  "SELECT id FROM invoices WHERE user_id = ? AND json_extract(data, '$.invoiceNumber') = ?"
                ).get(user.id, newNum);
                if (existing) continue;

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
              }
            } catch (parseErr) {
              console.error(`[Cron] Skipping corrupt invoice ${inv.id}:`, parseErr.message);
            }
          }

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

          await new Promise(resolve => setImmediate(resolve));
        }
      } catch (err) {
        console.error('[Cron] Error generating recurring invoices:', err.message);
      }
    });

    cron.schedule('0 * * * *', () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const overdueInvs = db.prepare(
          "SELECT id, user_id, status, json_extract(data, '$.dueDate') as due_date FROM invoices WHERE status NOT IN ('paid', 'overdue')"
        ).all();
        for (const inv of overdueInvs) {
          if (inv.due_date && inv.due_date < today) {
            db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run('overdue', inv.id);
            db.prepare('INSERT INTO status_history (id, invoice_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?, ?)').run(
              uuidv4(), inv.id, inv.status, 'overdue', inv.user_id
            );
          }
        }
      } catch (err) {
        console.error('[Cron] Overdue check error:', err.message);
      }
    });

    console.log('[Cron] Cron jobs enabled (leader instance)');
  }

  function shutdown(signal) {
    console.log(`\n[${signal}] Shutting down gracefully...`);
    server.close(() => {
      const wssInstance = getWss();
      if (wssInstance) {
        wssInstance.close(() => {
          try { db.close(); } catch (e) {}
          process.exit(0);
        });
      } else {
        try { db.close(); } catch (e) {}
        process.exit(0);
      }
    });
    setTimeout(() => process.exit(1), 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  server.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT} (${dev ? 'dev' : 'production'})`);
  });
}).catch(err => {
  console.error('[Server] Failed to prepare Next.js:', err);
  process.exit(1);
});
