const express = require('express');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const path = require('path');
const db = require('../db');
const authenticate = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { actionLimit, TIER_LIMITS, resetIfNewDay, getEffectiveDate } = require('../middleware/actionLimit');
const { validateInvoice } = require('../middleware/validate');
const { broadcast } = require('../websocket');
const { decrypt, isEncrypted } = require('../utils/crypto');
const { logAudit } = require('../utils/auditLog');
let puppeteer;
let browserInstance = null;

async function getBrowser() {
  if (browserInstance && browserInstance.connected) return browserInstance;
  if (!puppeteer) puppeteer = require('puppeteer');
  
  // SECURITY NOTE: --disable-setuid-sandbox reduces sandbox isolation.
  // This is required in some containerized environments (Docker, CI) where
  // the setuid sandbox binary is not available. In production environments
  // with proper sandboxing support, this flag should be removed.
  // Control via PUPPETEER_DISABLE_SETUID_SANDBOX env var.
  const disableSetuidSandbox = process.env.PUPPETEER_DISABLE_SETUID_SANDBOX !== 'false';
  const args = ['--disable-dev-shm-usage', '--disable-gpu'];
  if (disableSetuidSandbox) {
    args.push('--disable-setuid-sandbox');
  }
  
  browserInstance = await puppeteer.launch({
    headless: true,
    args
  });
  browserInstance.on('disconnected', () => { browserInstance = null; });
  return browserInstance;
}

function generateInvoiceNumber(userId, currentNum) {
  const user = db.prepare('SELECT inv_prefix, inv_start_number, inv_format FROM users WHERE id = ?').get(userId);
  if (!user) {
    const fallbackNum = db.prepare("SELECT json_extract(data, '$.invoiceNumber') as num FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId);
    let num = 1;
    if (fallbackNum && fallbackNum.num) {
      const match = fallbackNum.num.replace(/[^0-9]/g, '');
      if (match) num = parseInt(match) + 1;
    }
    return 'INV-' + String(num).padStart(3, '0');
  }
  const prefix = user.inv_prefix || 'INV-';
  const format = user.inv_format || 'PREFIX-XXXX';
  if (currentNum && /^PREFIX/.test(format)) {
    if (currentNum.startsWith(prefix)) return currentNum;
    const numPart = currentNum.replace(/[^0-9]/g, '');
    return prefix + numPart.padStart(3, '0');
  }
  const nextNum = db.prepare("SELECT json_extract(data, '$.invoiceNumber') as num FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId);
  let num = 1;
  if (nextNum && nextNum.num) {
    const match = nextNum.num.replace(prefix, '').match(/(\d+)/);
    if (match) num = parseInt(match[1]) + 1;
  }
  return prefix + String(num).padStart(3, '0');
}

const router = express.Router();

// Helper: escape HTML to prevent injection in email output
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: generate invoice HTML for email (Fix 6: all user fields are now escaped)
function recalculateTotals(inv) {
  // Discount is subtracted before tax so the tax applies to the
  // post-discount subtotal — matching the frontend (js/invoice.js getTaxAmount).
  let subtotal = 0;
  (inv.items || []).forEach(item => {
    subtotal += (item.quantity || 0) * (item.unitPrice || 0);
  });
  let discountAmount = 0;
  if (inv.discountType === 'percentage') {
      discountAmount = subtotal * ((inv.discountValue || 0) / 100);
  } else if (inv.discountType === 'fixed') {
      discountAmount = inv.discountValue || 0;
  }
  const taxable = subtotal - discountAmount;
  let taxAmount = 0;
  if (inv.taxType === 'percentage') {
      taxAmount = taxable * ((inv.taxRate || 0) / 100);
  } else if (inv.taxType === 'fixed') {
      taxAmount = inv.taxRate || 0;
  }
  inv.taxAmount = taxAmount;
  inv.discountAmount = discountAmount;
  inv.total = taxable + taxAmount;
}

function generateInvoiceHTML(invoiceData) {
  const inv = invoiceData;
  const symbol = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$',
    'AUD': 'A$', 'INR': '₹', 'JPY': '¥'
  }[inv.currency] || '$';
  const decimals = inv.currency === 'JPY' ? 0 : 2;
  const fmt = n => symbol + n.toFixed(decimals);

  let subtotal = 0;
  const itemsHTML = (inv.items || []).map(item => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    const amount = qty * price;
    subtotal += amount;
    return `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">${escapeHtml(item.description)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${qty.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${fmt(price)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${fmt(amount)}</td>
    </tr>
  `;
  }).join('');

  let discountAmount = 0;
  if (inv.discountType === 'percentage') {
      discountAmount = subtotal * ((inv.discountValue || 0) / 100);
  } else if (inv.discountType === 'fixed') {
      discountAmount = inv.discountValue || 0;
  }

  const taxable = subtotal - discountAmount;
  let taxAmount = 0;
  if (inv.taxType === 'percentage') {
      taxAmount = taxable * ((inv.taxRate || 0) / 100);
  } else if (inv.taxType === 'fixed') {
      taxAmount = inv.taxRate || 0;
  }

  const total = taxable + taxAmount;

  return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#333;margin:0;">${escapeHtml(inv.documentType || 'Invoice')}</h1>
        <p style="color:#666;font-size:18px;">#${escapeHtml(inv.invoiceNumber)}</p>
      </div>
      <div style="margin-bottom:20px;">
        <h3 style="color:#555;">From</h3>
        <p style="margin:0;">${escapeHtml(inv.companyName)}<br>${escapeHtml(inv.companyAddress)}<br>${escapeHtml(inv.companyEmail)}</p>
      </div>
      <div style="margin-bottom:20px;">
        <h3 style="color:#555;">To</h3>
        <p style="margin:0;">${escapeHtml(inv.clientName)}<br>${escapeHtml(inv.clientAddress)}<br>${escapeHtml(inv.clientEmail)}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:10px;text-align:left;">Description</th>
            <th style="padding:10px;text-align:right;">Qty</th>
            <th style="padding:10px;text-align:right;">Rate</th>
            <th style="padding:10px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div style="text-align:right;font-size:16px;">
        <p>Subtotal: ${fmt(subtotal)}</p>
        ${inv.taxType !== 'none' ? `<p>Tax: ${fmt(taxAmount)}</p>` : ''}
        ${inv.discountType !== 'none' ? `<p>Discount: -${fmt(discountAmount)}</p>` : ''}
        <p style="font-size:20px;font-weight:bold;">Total: ${fmt(total)}</p>
      </div>
      ${inv.paymentLinkUrl && inv.documentType !== 'Receipt' && inv.documentType !== 'Estimate' && inv.documentType !== 'Quote'
        ? `<div style="text-align:center;margin-top:20px;"><a href="${escapeHtml(inv.paymentLinkUrl)}" style="background:#5e6ad2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;">Pay Now</a></div>`
        : ''}
      ${inv.notes ? `<div style="margin-top:20px;padding:15px;background:#f9f9f9;border-radius:5px;"><p style="margin:0;">${escapeHtml(inv.notes)}</p></div>` : ''}
      <div style="margin-top:30px;text-align:center;color:#999;font-size:12px;">
        <p>Generated by Invoice Generator</p>
      </div>
    </div>
  `;
}

// GET all invoices
router.get('/', authenticate, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 5000);
    const offset = parseInt(req.query.offset) || 0;

    const countRow = db.prepare(
      'SELECT COUNT(*) as total FROM invoices WHERE user_id = ?'
    ).get(req.user.id);

    const invoices = db.prepare(
      'SELECT id, data, status, custom_fields, created_at, paid_at FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(req.user.id, limit, offset);

    const parsed = [];
    for (const inv of invoices) {
      try {
        parsed.push({ ...inv, data: JSON.parse(inv.data), custom_fields: JSON.parse(inv.custom_fields || '[]') });
      } catch (parseErr) {
        console.error(`[Invoices] Skipping corrupt invoice ${inv.id}:`, parseErr.message);
      }
    }

    res.json({ invoices: parsed, total: countRow.total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET invoice count / limits
router.get('/count', authenticate, (req, res) => {
  const freshUser = resetIfNewDay(req.user.id) || req.user;
  const { tier } = freshUser;
  const limit = TIER_LIMITS[tier] || TIER_LIMITS.free;

  res.json({
    used: freshUser.daily_action_count,
    limit,
    tier
  });
});

// GET recurring invoices due for generation
router.get('/recurring/due', authenticate, (req, res) => {
  try {
    const invoices = db.prepare(
      'SELECT id, data, status, created_at FROM invoices WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);

    const now = new Date();
    const dueRecurring = invoices.filter(inv => {
      const data = JSON.parse(inv.data);
      if (!data.recurring || data.recurring === 'none') return false;
      const intervals = { weekly: 7, monthly: 30, quarterly: 90 };
      const days = intervals[data.recurring] || 30;
      const lastDate = new Date(data.invoiceDate || data.createdAt || now);
      const nextDue = new Date(lastDate);
      nextDue.setDate(nextDue.getDate() + days);
      return nextDue <= now;
    }).map(inv => ({ ...inv, data: JSON.parse(inv.data) }));

    res.json({ invoices: dueRecurring });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check recurring invoices' });
  }
});

// POST create invoice (Fix 1: creation only — updating uses PUT /:id)
router.post('/', authenticate, csrfProtection, validateInvoice, actionLimit, (req, res) => {
  try {
    const { data, custom_fields } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Invoice data required' });
    }

    const id = uuidv4();
    if (!data.invoiceNumber || data.invoiceNumber === '') {
      // Use transaction to prevent race condition in invoice number generation
      const generateAndInsert = db.transaction(() => {
        data.invoiceNumber = generateInvoiceNumber(req.user.id);
        db.prepare('INSERT INTO invoices (id, user_id, data, status, custom_fields) VALUES (?, ?, ?, ?, ?)').run(
          id, req.user.id, JSON.stringify(data), data.status || 'draft', JSON.stringify(custom_fields || [])
        );
      });
      generateAndInsert();
    } else {
      db.prepare('INSERT INTO invoices (id, user_id, data, status, custom_fields) VALUES (?, ?, ?, ?, ?)').run(
        id, req.user.id, JSON.stringify(data), data.status || 'draft', JSON.stringify(custom_fields || [])
      );
    }

    logAudit(req.user.id, 'invoice_create', 'invoice', id, null, { data, custom_fields: custom_fields || [] }, req);

    broadcast(req.user.id, 'invoice:created', { id, data, custom_fields: custom_fields || [] });

    res.status(201).json({ id, data, custom_fields: custom_fields || [], created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save invoice' });
  }
});

// PUT update existing invoice (Fix 1: proper update route — no more duplicates on save)
router.put('/:id', authenticate, csrfProtection, validateInvoice, actionLimit, (req, res) => {
  try {
    const { id } = req.params;
    const { data, custom_fields } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Invoice data required' });
    }

    const existing = db.prepare('SELECT id, data, custom_fields FROM invoices WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const oldData = JSON.parse(existing.data);
    const oldCustomFields = JSON.parse(existing.custom_fields || '[]');

    db.prepare(
      'UPDATE invoices SET data = ?, status = ?, custom_fields = ? WHERE id = ? AND user_id = ?'
    ).run(
      JSON.stringify(data),
      data.status || 'draft',
      JSON.stringify(custom_fields || []),
      id,
      req.user.id
    );

    logAudit(req.user.id, 'invoice_update', 'invoice', id, { data: oldData, custom_fields: oldCustomFields }, { data, custom_fields: custom_fields || [] }, req);

    broadcast(req.user.id, 'invoice:updated', { id, data, custom_fields: custom_fields || [] });

    res.json({ id, data, custom_fields: custom_fields || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// POST duplicate invoice (Fix 4: actionLimit middleware added)
router.post('/:id/duplicate', authenticate, csrfProtection, actionLimit, (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare('SELECT id, data, custom_fields FROM invoices WHERE id = ? AND user_id = ?').get(
      id, req.user.id
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    const data = JSON.parse(invoice.data);
    const customFields = JSON.parse(invoice.custom_fields || '[]');

    // Generate new invoice number
    const numMatch = data.invoiceNumber ? data.invoiceNumber.match(/(\d+)$/) : null;
    const newNum = numMatch ? data.invoiceNumber.replace(/\d+$/, m => String(parseInt(m) + 1).padStart(m.length, '0')) : (data.invoiceNumber || 'INV-001') + '-copy';

    const newData = {
      ...data,
      invoiceNumber: newNum,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'draft',
      id: undefined
    };

    const newId = uuidv4();
    db.prepare('INSERT INTO invoices (id, user_id, data, status, custom_fields) VALUES (?, ?, ?, ?, ?)').run(
      newId, req.user.id, JSON.stringify(newData), 'draft', JSON.stringify(customFields)
    );

    res.status(201).json({ id: newId, data: newData, custom_fields: customFields, created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to duplicate invoice' });
  }
});

// POST send invoice via email
router.post('/:id/send', authenticate, csrfProtection, actionLimit, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare('SELECT id, data, status FROM invoices WHERE id = ? AND user_id = ?').get(
      id, req.user.id
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const data = JSON.parse(invoice.data);
    if (!data.clientEmail) {
      return res.status(400).json({ error: 'Client email is required' });
    }

    // Validate email format to prevent abuse as spam relay
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.clientEmail)) {
      return res.status(400).json({ error: 'Invalid client email format' });
    }

    // Get email config
    const emailConfig = db.prepare('SELECT * FROM email_configs WHERE user_id = ?').get(req.user.id);
    if (!emailConfig) {
      return res.status(400).json({ error: 'Email configuration not found. Please configure SMTP settings first.' });
    }

    // Create transporter
    const smtpPass = isEncrypted(emailConfig.pass) ? decrypt(emailConfig.pass) : emailConfig.pass;
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure === 1,
      auth: {
        user: emailConfig.user,
        pass: smtpPass
      }
    });

    // Build subject from template (sanitize against header injection)
    const subjectTemplate = emailConfig.email_subject_template || '{{documentType}} #{{invoiceNumber}} from {{companyName}}';
    const subject = subjectTemplate
      .replace(/\{\{documentType\}\}/g, (data.documentType || 'Invoice').replace(/[\r\n]/g, ''))
      .replace(/\{\{invoiceNumber\}\}/g, (data.invoiceNumber || '').replace(/[\r\n]/g, ''))
      .replace(/\{\{companyName\}\}/g, (data.companyName || 'Your Company').replace(/[\r\n]/g, ''))
      .replace(/\{\{clientName\}\}/g, (data.clientName || 'Client').replace(/[\r\n]/g, ''))
      .replace(/\{\{total\}\}/g, (data.total || 0).toFixed(2))
      .replace(/\{\{currency\}\}/g, (data.currency || 'USD').replace(/[\r\n]/g, ''))
      .replace(/[\r\n]/g, '');

    // Validate colors to prevent CSS injection
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    const accentColor = hexColorRegex.test(emailConfig.email_accent_color) ? emailConfig.email_accent_color : '#5e6ad2';
    const bodyBg = hexColorRegex.test(emailConfig.email_body_bg) ? emailConfig.email_body_bg : '#ffffff';
    const showLogo = emailConfig.email_show_logo !== 0;

    let paymentLinkUrl = data.paymentLink || '';
    if (!paymentLinkUrl && id && process.env.CLIENT_URL) {
      paymentLinkUrl = `${process.env.CLIENT_URL}/api/invoices/${id}/pay`;
    }
    data.paymentLinkUrl = paymentLinkUrl;

    recalculateTotals(data);
    const html = generateInvoiceHTML(data);

    const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { background: ${bodyBg}; font-family: Arial, sans-serif; }
        .email-header h1 { color: ${accentColor}; }
        table thead tr { background: ${accentColor} !important; color: #fff !important; }
      </style>
    </head><body>${html}</body></html>`;

    // Send mail
    await transporter.sendMail({
      from: `"${emailConfig.from_name || data.companyName || 'Invoice Generator'}" <${emailConfig.from_email || emailConfig.user}>`,
      to: data.clientEmail,
      subject: subject,
      html: styledHtml,
      attachments: []
    });

    // Update status to sent (preserve 'paid' status)
    const oldStatus = invoice.status || 'draft';
    const newStatus = oldStatus === 'paid' ? 'paid' : 'sent';
    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(newStatus, id);
    if (newStatus !== oldStatus) {
      db.prepare('INSERT INTO status_history (id, invoice_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?, ?)').run(
        uuidv4(), id, oldStatus, newStatus, req.user.id
      );
    }

    res.json({ success: true, message: `Invoice sent to ${data.clientEmail}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email. Please check your email configuration.' });
  }
});

// PUT update invoice status
router.put('/:id/status', authenticate, csrfProtection, actionLimit, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'accepted', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const invoice = db.prepare('SELECT id, status FROM invoices WHERE id = ? AND user_id = ?').get(
      id, req.user.id
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const oldStatus = invoice.status || 'draft';
    const now = new Date().toISOString();
    let paidAt = null;
    if (status === 'paid') {
      paidAt = now;
      db.prepare('UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?').run(status, paidAt, id);
    } else {
      db.prepare('UPDATE invoices SET status = ?, paid_at = NULL WHERE id = ?').run(status, id);
    }
    db.prepare('INSERT INTO status_history (id, invoice_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), id, oldStatus, status, req.user.id
    );

    logAudit(req.user.id, 'invoice_status_change', 'invoice', id, { status: oldStatus }, { status, paid_at: paidAt }, req);

    broadcast(req.user.id, 'invoice:status', { id, status, paid_at: paidAt });

    res.json({ success: true, status, paid_at: paidAt, previous_status: oldStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/invoices/:id/convert - Convert Estimate/Quote to Invoice
router.post('/:id/convert', authenticate, csrfProtection, actionLimit, (req, res) => {
  try {
    const { id } = req.params;
    const { v4: uuidv4 } = require('uuid');

    const invoice = db.prepare('SELECT id, data, status, custom_fields FROM invoices WHERE id = ? AND user_id = ?').get(
      id, req.user.id
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = JSON.parse(invoice.data);
    const validFromTypes = ['Estimate', 'Quote'];
    if (!validFromTypes.includes(data.documentType)) {
      return res.status(400).json({ error: 'Only Estimates and Quotes can be converted to Invoices' });
    }

    // Generate new invoice number
    const numMatch = data.invoiceNumber ? data.invoiceNumber.match(/(\d+)$/) : null;
    const newNum = numMatch
      ? data.invoiceNumber.replace(/\d+$/, m => String(parseInt(m) + 1).padStart(m.length, '0'))
      : (data.invoiceNumber || 'INV-001') + '-CONV';

    // Check for duplicate - validate invoice number format to prevent SQL injection
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(newNum)) {
      return res.status(400).json({ error: 'Invalid invoice number format' });
    }
    const existing = db.prepare(
      "SELECT id FROM invoices WHERE user_id = ? AND json_extract(data, '$.invoiceNumber') = ?"
    ).get(req.user.id, newNum);
    if (existing) {
      return res.status(409).json({ error: 'Invoice number already exists' });
    }

    // Create new invoice from the estimate/quote
    const newData = {
      ...data,
      documentType: 'Invoice',
      invoiceNumber: newNum,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      id: undefined
    };

    const newId = uuidv4();
    db.prepare('INSERT INTO invoices (id, user_id, data, status, custom_fields) VALUES (?, ?, ?, ?, ?)').run(
      newId, req.user.id, JSON.stringify(newData), 'draft', invoice.custom_fields || '[]'
    );

    logAudit(req.user.id, 'invoice_convert', 'invoice', newId, { original_id: id, original_type: data.documentType }, { data: newData }, req);

    // Optionally mark the original as accepted
    if (data.documentType === 'Estimate' || data.documentType === 'Quote') {
      db.prepare('UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?').run('accepted', id, req.user.id);
      db.prepare('INSERT INTO status_history (id, invoice_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?, ?)').run(
        uuidv4(), id, invoice.status, 'accepted', req.user.id
      );
      logAudit(req.user.id, 'invoice_status_change', 'invoice', id, { status: invoice.status }, { status: 'accepted' }, req);
    }

    res.status(201).json({
      success: true,
      id: newId,
      invoiceNumber: newNum,
      message: 'Converted to Invoice successfully'
    });
  } catch (err) {
    console.error('Convert to invoice error:', err);
    res.status(500).json({ error: 'Failed to convert to invoice' });
  }
});

// POST /api/invoices/:id/payment-link - Generate a Stripe Checkout link to pay an invoice
router.post('/:id/payment-link', authenticate, csrfProtection, async (req, res) => {
  const stripe = require('../stripe');
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured on this server' });
  }

  try {
    const { id } = req.params;
    const invoice = db.prepare('SELECT id, data, status FROM invoices WHERE id = ? AND user_id = ?').get(id, req.user.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    const data = JSON.parse(invoice.data);
    const amount = Math.round((data.total || 0) * 100); // Stripe expects integer cents
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invoice total must be greater than zero' });
    }

    const currency = (data.currency || 'USD').toLowerCase();
    const itemName = `${data.documentType || 'Invoice'} ${data.invoiceNumber || id}`;
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: {
            name: itemName,
            description: `Payment for ${data.clientName || 'Client'}`
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${frontendUrl}/review.html?id=${id}&paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/review.html?id=${id}&canceled=true`,
      metadata: { invoiceId: id, userId: req.user.id }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Payment link generation error:', err);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

// GET /api/invoices/:id/pay - dynamically generates and redirects to a Stripe Checkout Session
router.get('/:id/pay', async (req, res) => {
  const stripe = require('../stripe');
  if (!stripe) {
    return res.status(503).send('Stripe is not configured on this server');
  }

  try {
    const { id } = req.params;
    // Note: No authentication check here. This allows the end customer to click the link and pay!
    const invoice = db.prepare('SELECT id, user_id, data, status FROM invoices WHERE id = ?').get(id);

    if (!invoice) {
      return res.status(404).send('Invoice not found');
    }

    if (invoice.status === 'paid') {
      return res.status(400).send('Invoice is already paid');
    }

    const data = JSON.parse(invoice.data);
    const amount = Math.round((data.total || 0) * 100);
    if (amount <= 0) {
      return res.status(400).send('Invoice total must be greater than zero');
    }

    const currency = (data.currency || 'USD').toLowerCase();
    const itemName = `${data.documentType || 'Invoice'} ${data.invoiceNumber || id}`;
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: {
            name: itemName,
            description: `Payment for ${data.clientName || 'Client'}`
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${frontendUrl}/review.html?id=${id}&paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/review.html?id=${id}&canceled=true`,
      metadata: { invoiceId: id, userId: invoice.user_id }
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error('Dynamic payment link error:', err);
    res.status(500).send('Failed to initiate payment');
  }
});

// POST import invoices (Fix 4: pre-check total against remaining daily budget)
router.post('/import', authenticate, csrfProtection, (req, res) => {
  try {
    const { invoices } = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ error: 'No invoices provided' });
    }

    // Re-fetch the freshest count so the date-reset can run if needed
    const freshUser = resetIfNewDay(req.user.id);
    const limit = TIER_LIMITS[freshUser.tier] || TIER_LIMITS.free;
    const currentCount = freshUser.daily_action_count;

    if (limit !== Infinity && currentCount >= limit) {
      return res.status(429).json({
        error: 'Daily action limit reached',
        limit,
        used: currentCount
      });
    }

    // How many can we still import?
    const remaining = limit === Infinity ? invoices.length : Math.min(invoices.length, limit - currentCount);

    const insert = db.prepare('INSERT INTO invoices (id, user_id, data, status, custom_fields) VALUES (?, ?, ?, ?, ?)');
    const checkNumber = db.prepare('SELECT id FROM invoices WHERE user_id = ? AND json_extract(data, \'$.invoiceNumber\') = ?');
    const safeInvoiceNumberRegex = /^[A-Za-z0-9_-]{1,50}$/;

    let imported = 0;
    let skipped = 0;

    const importAll = db.transaction(() => {
      for (const inv of invoices) {
        // Stop when we've hit the remaining budget
        if (limit !== Infinity && imported >= remaining) {
          skipped += (invoices.length - imported - skipped);
          break;
        }

        if (!safeInvoiceNumberRegex.test(inv.invoiceNumber)) {
          skipped++;
          continue;
        }

        const existing = checkNumber.get(req.user.id, inv.invoiceNumber);
        if (existing) {
          skipped++;
          continue;
        }

        const id = inv.id || uuidv4();
        insert.run(id, req.user.id, JSON.stringify(inv), inv.status || 'draft', JSON.stringify(inv.customFields || []));
        imported++;
      }
    });

    importAll();

    // Batch-increment the count by how many were actually imported
    if (imported > 0) {
      const today = getEffectiveDate(req.user.id);
      db.prepare(`
        UPDATE users
        SET daily_action_count = CASE
          WHEN daily_action_date = ? THEN daily_action_count + ?
          ELSE ?
        END,
        daily_action_date = ?
        WHERE id = ?
      `).run(today, imported, imported, today, req.user.id);
    }

    res.json({ imported, skipped, total: invoices.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import invoices' });
  }
});

// POST generate PDF for an invoice
router.post('/pdf', authenticate, actionLimit, async (req, res) => {
  try {
    const { data, id } = req.body;
    if (!data) return res.status(400).json({ error: 'Invoice data required' });

    let paymentLinkUrl = data.paymentLink || '';
    if (!paymentLinkUrl && id && process.env.CLIENT_URL) {
      paymentLinkUrl = `${process.env.CLIENT_URL}/api/invoices/${id}/pay`;
    }
    data.paymentLinkUrl = paymentLinkUrl;

    recalculateTotals(data);
    const html = generateInvoiceHTML(data);
    const fullHtml = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <style>
        @page { margin: 20mm; size: A4; }
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .totals { margin-top: 20px; text-align: right; font-size: 16px; }
        .grand-total { font-size: 20px; font-weight: bold; }
        .header { margin-bottom: 30px; text-align: center; }
        .section { margin-bottom: 20px; }
      </style>
    </head><body>${html}</body></html>`;

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }, printBackground: true });

      const safeFilename = (data.invoiceNumber || 'invoice').replace(/[^a-zA-Z0-9._-]/g, '_');
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Content-Length': pdf.length
      });
      res.send(pdf);
    } finally {
      await page.close().catch(() => {});
    }
  } catch (err) {
    console.error('[PDF] Generation failed');
    res.status(500).json({ error: 'Failed to generate PDF. Please try again.' });
  }
});

// POST bulk delete invoices
router.post('/bulk-delete', authenticate, csrfProtection, actionLimit, (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No invoice IDs provided' });
    }
    const deleteStmt = db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?');
    const del = db.transaction((invoiceIds) => {
      let deleted = 0;
      for (const id of invoiceIds) {
        const info = deleteStmt.run(id, req.user.id);
        if (info.changes > 0) {
          logAudit(req.user.id, 'invoice_delete', 'invoice', id, null, null, req);
          deleted++;
        }
      }
      return deleted;
    });
    const deleted = del(ids);
    res.json({ success: true, deleted, total: ids.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoices' });
  }
});

// DELETE invoice (Fix 2 companion: status_history rows are cleaned up by ON DELETE CASCADE in db.js)
router.delete('/:id', authenticate, csrfProtection, actionLimit, (req, res) => {
  try {
    const { id } = req.params;

    const invoice = db.prepare('SELECT id, data, custom_fields FROM invoices WHERE id = ? AND user_id = ?').get(
      id, req.user.id
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const oldData = JSON.parse(invoice.data);
    const oldCustomFields = JSON.parse(invoice.custom_fields || '[]');

    db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(id, req.user.id);

    logAudit(req.user.id, 'invoice_delete', 'invoice', id, { data: oldData, custom_fields: oldCustomFields }, null, req);

    broadcast(req.user.id, 'invoice:deleted', { id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
module.exports.generateInvoiceHTML = generateInvoiceHTML;
module.exports.recalculateTotals = recalculateTotals;
