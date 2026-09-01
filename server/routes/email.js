const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const authenticate = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { validateEmailConfig } = require('../middleware/validate');
const { encrypt } = require('../utils/crypto');
const { logAudit } = require('../utils/auditLog');

const router = express.Router();

// GET email config
router.get('/', authenticate, (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM email_configs WHERE user_id = ?').get(req.user.id);
    if (!config) {
      return res.json({ config: null });
    }
    // Don't send password back
    const { pass, ...safeConfig } = config;
    res.json({ config: safeConfig });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get email config' });
  }
});

// POST save/update email config
router.post('/', authenticate, csrfProtection, validateEmailConfig, (req, res) => {
  try {
    const { host, port, secure, user, pass, from_name, from_email, email_subject_template, email_accent_color, email_show_logo, email_body_bg } = req.body;

    if (!host || !user || !pass) {
      return res.status(400).json({ error: 'Host, user, and password are required' });
    }

    const existing = db.prepare('SELECT id, host, port, secure, user, from_name, from_email, email_subject_template, email_accent_color, email_show_logo, email_body_bg FROM email_configs WHERE user_id = ?').get(req.user.id);
    const encryptedPass = encrypt(pass);

    const newConfig = {
      host, port: port || 587, secure: secure ? 1 : 0, user,
      from_name: from_name || null, from_email: from_email || null,
      email_subject_template: email_subject_template || null, email_accent_color: email_accent_color || '#5e6ad2',
      email_show_logo: email_show_logo !== undefined ? (email_show_logo ? 1 : 0) : 1, email_body_bg: email_body_bg || '#ffffff'
    };

    if (existing) {
      const oldConfig = { ...existing };
      delete oldConfig.id;
      delete oldConfig.user_id;
      delete oldConfig.pass;
      delete oldConfig.created_at;

      db.prepare(`UPDATE email_configs SET host = ?, port = ?, secure = ?, user = ?, pass = ?, from_name = ?, from_email = ?,
        email_subject_template = ?, email_accent_color = ?, email_show_logo = ?, email_body_bg = ? WHERE user_id = ?`).run(
        host, port || 587, secure ? 1 : 0, user, encryptedPass, from_name || null, from_email || null,
        email_subject_template || null, email_accent_color || '#5e6ad2', email_show_logo !== undefined ? (email_show_logo ? 1 : 0) : 1, email_body_bg || '#ffffff',
        req.user.id
      );

      logAudit(req.user.id, 'email_config_update', 'email_config', req.user.id, oldConfig, newConfig, req);
    } else {
      db.prepare(`INSERT INTO email_configs (id, user_id, host, port, secure, user, pass, from_name, from_email, email_subject_template, email_accent_color, email_show_logo, email_body_bg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        uuidv4(), req.user.id, host, port || 587, secure ? 1 : 0, user, encryptedPass, from_name || null, from_email || null,
        email_subject_template || null, email_accent_color || '#5e6ad2', email_show_logo !== undefined ? (email_show_logo ? 1 : 0) : 1, email_body_bg || '#ffffff'
      );

      logAudit(req.user.id, 'email_config_create', 'email_config', req.user.id, null, newConfig, req);
    }

    res.json({ success: true, message: 'Email configuration saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save email config' });
  }
});

// DELETE email config
router.delete('/', authenticate, csrfProtection, (req, res) => {
  try {
    const existing = db.prepare('SELECT id, host, port, secure, user, from_name, from_email, email_subject_template, email_accent_color, email_show_logo, email_body_bg FROM email_configs WHERE user_id = ?').get(req.user.id);
    
    if (existing) {
      const oldConfig = { ...existing };
      delete oldConfig.id;
      delete oldConfig.user_id;
      delete oldConfig.pass;
      delete oldConfig.created_at;
      
      db.prepare('DELETE FROM email_configs WHERE user_id = ?').run(req.user.id);
      logAudit(req.user.id, 'email_config_delete', 'email_config', req.user.id, oldConfig, null, req);
    }
    
    res.json({ success: true, message: 'Email configuration deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete email config' });
  }
});

module.exports = router;
