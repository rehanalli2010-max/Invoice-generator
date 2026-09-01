const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT inv_prefix, inv_start_number, inv_format FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.json({ prefix: 'INV-', startNumber: 1, format: 'PREFIX-XXXX' });
    }
    res.json({
      prefix: user.inv_prefix || 'INV-',
      startNumber: user.inv_start_number != null ? user.inv_start_number : 1,
      format: user.inv_format || 'PREFIX-XXXX'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get numbering config' });
  }
});

router.put('/', authenticate, csrfProtection, (req, res) => {
  try {
    const { prefix, startNumber, format } = req.body;
    const safePrefix = (typeof prefix === 'string' && prefix.trim()) || 'INV-';
    const safeStartNumber = Number.isInteger(startNumber) && startNumber >= 0 ? startNumber : 1;
    const safeFormat = (typeof format === 'string' && format.trim()) || 'PREFIX-XXXX';
    db.prepare('UPDATE users SET inv_prefix = ?, inv_start_number = ?, inv_format = ? WHERE id = ?').run(
      safePrefix,
      safeStartNumber,
      safeFormat,
      req.user.id
    );
    res.json({ success: true, prefix: safePrefix, startNumber: safeStartNumber, format: safeFormat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update numbering config' });
  }
});

module.exports = router;
