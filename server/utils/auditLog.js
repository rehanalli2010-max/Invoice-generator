const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function logAudit(userId, action, resourceType, resourceId, oldValues, newValues, req) {
  const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';
  const userAgent = req?.headers?.['user-agent'] || 'unknown';
  
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, old_values, new_values, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    userId,
    action,
    resourceType,
    resourceId,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    ip,
    userAgent
  );
}

module.exports = { logAudit };