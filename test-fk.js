const db = require('./server/db');
const { v4: uuidv4 } = require('uuid');

const userId = uuidv4();
const invId = uuidv4();

db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(userId, 'test@test.com', 'test');
db.prepare(`INSERT INTO invoices (id, user_id, data) VALUES (?, ?, ?)`).run(invId, userId, '{}');
const historyId = uuidv4();
db.prepare(`INSERT INTO status_history (id, invoice_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?, ?)`).run(historyId, invId, 'draft', 'sent', userId);

// Verify status_history exists before delete
const before = db.prepare('SELECT COUNT(*) as cnt FROM status_history WHERE invoice_id = ?').get(invId);
console.log(`Status history rows before delete: ${before.cnt}`);

// With ON DELETE CASCADE, deleting the invoice should also remove status_history
db.prepare('DELETE FROM invoices WHERE id = ?').run(invId);

const after = db.prepare('SELECT COUNT(*) as cnt FROM status_history WHERE invoice_id = ?').get(invId);
const invoiceGone = db.prepare('SELECT COUNT(*) as cnt FROM invoices WHERE id = ?').get(invId);

console.log(`Invoice rows after delete: ${invoiceGone.cnt}`);
console.log(`Status history rows after delete: ${after.cnt}`);

if (invoiceGone.cnt === 0 && after.cnt === 0) {
  console.log('SUCCESS: ON DELETE CASCADE working correctly');
} else {
  console.log('FAILURE: CASCADE did not work as expected');
}
