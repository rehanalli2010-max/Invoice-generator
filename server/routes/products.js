const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const authenticate = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { logAudit } = require('../utils/auditLog');

const router = express.Router();

// GET /api/products - List the logged-in user's catalog items
router.get('/', authenticate, (req, res) => {
  try {
    const products = db.prepare(
      'SELECT id, name, description, unit_price, tax_rate, currency FROM products WHERE user_id = ? ORDER BY name ASC'
    ).all(req.user.id);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products - Create or update a catalog item
router.post('/', authenticate, csrfProtection, (req, res) => {
  try {
    const { name, description, unitPrice, taxRate, currency, id: reqId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const cleanName = name.trim();
    const unit_price = Math.max(0, parseFloat(unitPrice) || 0);
    const tax_rate = Math.max(0, parseFloat(taxRate) || 0);
    const cur = (typeof currency === 'string' && currency) ? currency : 'USD';

    let existing = null;
    if (reqId) {
      existing = db.prepare('SELECT id FROM products WHERE id = ? AND user_id = ?').get(reqId, req.user.id);
    }
    if (!existing) {
      existing = db.prepare('SELECT id FROM products WHERE user_id = ? AND name = ?').get(req.user.id, cleanName);
    }

    if (existing) {
      const oldProduct = db.prepare('SELECT name, description, unit_price, tax_rate, currency FROM products WHERE id = ? AND user_id = ?').get(existing.id, req.user.id);
      
      db.prepare(
        'UPDATE products SET name = ?, description = ?, unit_price = ?, tax_rate = ?, currency = ? WHERE id = ? AND user_id = ?'
      ).run(cleanName, description || null, unit_price, tax_rate, cur, existing.id, req.user.id);

      const newProduct = { name: cleanName, description: description || null, unit_price, tax_rate, currency: cur };
      logAudit(req.user.id, 'product_update', 'product', existing.id, oldProduct, newProduct, req);

      return res.json({ id: existing.id, success: true, updated: true });
    }

    const id = reqId || uuidv4();
    db.prepare(
      'INSERT INTO products (id, user_id, name, description, unit_price, tax_rate, currency) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.user.id, cleanName, description || null, unit_price, tax_rate, cur);

    logAudit(req.user.id, 'product_create', 'product', id, null, { name: cleanName, description: description || null, unit_price, tax_rate, currency: cur }, req);

    res.status(201).json({ id, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// DELETE /api/products/:id - Delete a catalog item
router.delete('/:id', authenticate, csrfProtection, (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT id, name, description, unit_price, tax_rate, currency FROM products WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const oldProduct = { name: product.name, description: product.description, unit_price: product.unit_price, tax_rate: product.tax_rate, currency: product.currency };
    
    db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(id, req.user.id);
    logAudit(req.user.id, 'product_delete', 'product', id, oldProduct, null, req);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
