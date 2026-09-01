const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const authenticate = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { validateClient } = require('../middleware/validate');
const { logAudit } = require('../utils/auditLog');

const router = express.Router();

// GET /api/clients - Get all clients for the logged-in user
router.get('/', authenticate, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 5000);
    const offset = parseInt(req.query.offset) || 0;

    const countRow = db.prepare(
      'SELECT COUNT(*) as total FROM clients WHERE user_id = ?'
    ).get(req.user.id);

    const clients = db.prepare(
      'SELECT id, name, email, phone, address, created_at FROM clients WHERE user_id = ? ORDER BY name ASC LIMIT ? OFFSET ?'
    ).all(req.user.id, limit, offset);
    res.json({ clients, total: countRow.total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// POST /api/clients - Create or update a client
// Fix 3: Lookup by ID first if provided, so renaming works.
router.post('/', authenticate, csrfProtection, validateClient, (req, res) => {
  try {
    const { name, email, phone, address, id: reqId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    let existing = null;
    if (reqId) {
      existing = db.prepare('SELECT id FROM clients WHERE id = ? AND user_id = ?').get(reqId, req.user.id);
    }

    // Fallback: check by exact name if no ID matched/provided
    if (!existing) {
      existing = db.prepare('SELECT id FROM clients WHERE user_id = ? AND name = ?').get(req.user.id, name.trim());
    }

    if (existing) {
      const oldClient = db.prepare('SELECT name, email, phone, address FROM clients WHERE id = ? AND user_id = ?').get(existing.id, req.user.id);
      
      db.prepare(
        'UPDATE clients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND user_id = ?'
      ).run(name.trim(), email || null, phone || null, address || null, existing.id, req.user.id);

      const newClient = { name: name.trim(), email: email || null, phone: phone || null, address: address || null };
      logAudit(req.user.id, 'client_update', 'client', existing.id, oldClient, newClient, req);

      return res.json({ id: existing.id, success: true, updated: true });
    }

    const id = reqId || uuidv4();
    db.prepare(
      'INSERT INTO clients (id, user_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      req.user.id,
      name.trim(),
      email || null,
      phone || null,
      address || null
    );

    logAudit(req.user.id, 'client_create', 'client', id, null, { name: name.trim(), email: email || null, phone: phone || null, address: address || null }, req);

    res.status(201).json({ id, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save client' });
  }
});

// POST /api/clients/import - Bulk import clients
// Fix 4: Pre-enforce action limit
router.post('/import', authenticate, csrfProtection, (req, res) => {
  try {
    const { clients } = req.body;

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: 'No clients provided' });
    }

    // Re-fetch the freshest count so the date-reset can run if needed
    const { TIER_LIMITS: limits, resetIfNewDay } = require('../middleware/actionLimit');
    const freshUser = resetIfNewDay(req.user.id);
    const limit = limits[freshUser.tier] || limits.free;
    const currentCount = freshUser.daily_action_count;

    if (limit !== Infinity && currentCount >= limit) {
      return res.status(429).json({
        error: 'Daily action limit reached',
        limit,
        used: currentCount
      });
    }

    const remaining = limit === Infinity ? clients.length : Math.min(clients.length, limit - currentCount);

    const insert = db.prepare(
      'INSERT INTO clients (id, user_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const checkClient = db.prepare(
      'SELECT id FROM clients WHERE user_id = ? AND name = ?'
    );

    let imported = 0;
    let skipped = 0;

    const importAll = db.transaction(() => {
      for (const client of clients) {
        if (!client.name || !client.name.trim()) {
          skipped++;
          continue;
        }

        // Stop when hit the remaining budget
        if (limit !== Infinity && imported >= remaining) {
          skipped += (clients.length - imported - skipped);
          break;
        }

        const existing = checkClient.get(req.user.id, client.name.trim());
        if (existing) {
          skipped++;
          continue;
        }

        const id = client.id || uuidv4();
        insert.run(
          id,
          req.user.id,
          client.name.trim(),
          client.email || null,
          client.phone || null,
          client.address || null
        );
        imported++;
      }
    });

    importAll();

    // Batch-increment the count
    if (imported > 0) {
      const today = new Date().toISOString().split('T')[0];
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

    res.json({ imported, skipped, total: clients.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import clients' });
  }
});

// DELETE /api/clients/:id - Delete a client
router.delete('/:id', authenticate, csrfProtection, (req, res) => {
  try {
    const { id } = req.params;

    const client = db.prepare('SELECT id, name, email, phone, address FROM clients WHERE id = ? AND user_id = ?').get(
      id, req.user.id
    );

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const oldClient = { name: client.name, email: client.email, phone: client.phone, address: client.address };

    db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(id, req.user.id);

    logAudit(req.user.id, 'client_delete', 'client', id, oldClient, null, req);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
