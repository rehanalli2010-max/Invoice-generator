const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');

// Ensure user is authenticated explicitly for all template endpoints
router.use(authenticate);

// Get all templates for the logged-in user
router.get('/', (req, res) => {
    try {
        const templates = db.prepare('SELECT * FROM company_templates WHERE user_id = ? ORDER BY created_at DESC')
            .all(req.user.id);

        // Parse the data JSON String for the frontend
        const parsedTemplates = templates.map(t => {
            return {
                ...t,
                data: JSON.parse(t.data)
            };
        });

        res.json(parsedTemplates);
    } catch (err) {
        console.error('Failed to get company templates:', err);
        res.status(500).json({ error: 'Failed to retrieve templates' });
    }
});

// Save a new template
router.post('/', csrfProtection, (req, res) => {
    try {
        const { name, data } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'Template data is required' });
        }

        // Ensure paid users can have 15, free can only have 1 (or 0, but lets allow 1 for free users as a teaser)
        const isPaid = (req.user.tier === 'startup' || req.user.tier === 'business');
        const limitCount = isPaid ? 15 : 1;

        const currentCountRow = db.prepare('SELECT COUNT(*) as total FROM company_templates WHERE user_id = ?').get(req.user.id);
        const currentCount = currentCountRow.total;

        if (currentCount >= limitCount) {
             const message = isPaid ? 'You have reached the maximum number of templates (15).' : 'Free users can only save 1 template. Please upgrade to save more.';
             return res.status(403).json({ error: message, limitReached: true });
        }

        const templateId = uuidv4();

        db.prepare(`
            INSERT INTO company_templates (id, user_id, name, data)
            VALUES (?, ?, ?, ?)
        `).run(templateId, req.user.id, name, JSON.stringify(data));

        res.status(201).json({
            message: 'Template saved successfully',
            id: templateId
        });
    } catch (err) {
        console.error('Failed to save template:', err);
        res.status(500).json({ error: 'Failed to save template' });
    }
});

// Delete a template
router.delete('/:id', csrfProtection, (req, res) => {
    try {
        const { id } = req.params;

        const result = db.prepare('DELETE FROM company_templates WHERE id = ? AND user_id = ?').run(id, req.user.id);

        if (result.changes === 0) {
             return res.status(404).json({ error: 'Template not found or it does not belong to you' });
        }

        res.json({ message: 'Template deleted' });
    } catch (err) {
        console.error('Failed to delete template:', err);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

module.exports = router;
