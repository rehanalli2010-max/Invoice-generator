const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'invoices.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create core tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    tier TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    daily_action_count INTEGER DEFAULT 0,
    daily_action_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    data TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    custom_fields TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS email_configs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    host TEXT NOT NULL,
    port INTEGER DEFAULT 587,
    secure INTEGER DEFAULT 0,
    user TEXT NOT NULL,
    pass TEXT NOT NULL,
    from_name TEXT,
    from_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    ip TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Fix 2: Ensure status_history has ON DELETE CASCADE on invoice_id.
// SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we use the
// standard workaround: rename → recreate → copy → drop old.
db.exec(`
  CREATE TABLE IF NOT EXISTS status_history (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT,
    changed_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: if status_history exists but was created without ON DELETE CASCADE,
// recreate it with the correct constraint.
const historyInfo = db.pragma('table_info(status_history)');
if (historyInfo.length > 0) {
  // Check whether the FK already has ON DELETE CASCADE by inspecting FK list
  const fkList = db.pragma('foreign_key_list(status_history)');
  const invoiceFk = fkList.find(fk => fk.table === 'invoices');
  if (invoiceFk && invoiceFk.on_delete !== 'CASCADE') {
    // Temporarily disable FK enforcement to allow DDL restructuring
    db.pragma('foreign_keys = OFF');
    db.exec(`
      BEGIN;
      ALTER TABLE status_history RENAME TO _status_history_old;
      CREATE TABLE status_history (
        id TEXT PRIMARY KEY,
        invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
        from_status TEXT,
        to_status TEXT,
        changed_by TEXT REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO status_history SELECT * FROM _status_history_old;
      DROP TABLE _status_history_old;
      COMMIT;
    `);
    db.pragma('foreign_keys = ON');
  }
}

// Create password_reset_tokens table (migration safe — IF NOT EXISTS)
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create refresh_tokens table for JWT refresh token rotation
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replaced_by_token_hash TEXT
    );
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
  `);

// Create company_templates table (migration safe — IF NOT EXISTS)
db.exec(`
  CREATE TABLE IF NOT EXISTS company_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add email template customization columns (safe migration)
try {
  db.exec(`ALTER TABLE email_configs ADD COLUMN email_subject_template TEXT DEFAULT '{{documentType}} #{{invoiceNumber}} from {{companyName}}'`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}
try {
  db.exec(`ALTER TABLE email_configs ADD COLUMN email_accent_color TEXT DEFAULT '#5e6ad2'`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}
try {
  db.exec(`ALTER TABLE email_configs ADD COLUMN email_show_logo INTEGER DEFAULT 1`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}
try {
  db.exec(`ALTER TABLE email_configs ADD COLUMN email_body_bg TEXT DEFAULT '#ffffff'`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}

// Feature 6: Invoice numbering config columns on users
try {
  db.exec(`ALTER TABLE users ADD COLUMN inv_prefix TEXT DEFAULT 'INV-'`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}
try {
  db.exec(`ALTER TABLE users ADD COLUMN inv_start_number INTEGER DEFAULT 1`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}
try {
  db.exec(`ALTER TABLE users ADD COLUMN inv_format TEXT DEFAULT 'PREFIX-XXXX'`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}

// Feature 7: Payment date tracking on invoices
try {
  db.exec(`ALTER TABLE invoices ADD COLUMN paid_at DATETIME`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}
try {
  db.exec(`ALTER TABLE invoices ADD COLUMN due_at DATETIME`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}

// Feature 8: User timezone preference
try {
  db.exec(`ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC'`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}

// Migration: Add ip column to oauth_states for CSRF protection
try {
  db.exec(`ALTER TABLE oauth_states ADD COLUMN ip TEXT NOT NULL DEFAULT 'unknown'`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}

// JWT revocation: token_version column
try {
  db.exec(`ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}

// Account lockout: failed_login_attempts and locked_until columns
try {
  db.exec(`ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}
try {
  db.exec(`ALTER TABLE users ADD COLUMN locked_until DATETIME`);
} catch (err) {
  if (!err.message.includes('duplicate column')) throw err;
}

// Performance: indexes on foreign keys for faster joins
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
  CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
  CREATE INDEX IF NOT EXISTS idx_email_configs_user_id ON email_configs(user_id);
  CREATE INDEX IF NOT EXISTS idx_status_history_invoice_id ON status_history(invoice_id);
  CREATE INDEX IF NOT EXISTS idx_status_history_changed_by ON status_history(changed_by);
  CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_company_templates_user_id ON company_templates(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
`);

// Feature 9: Product / service catalog
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    unit_price REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
`);

module.exports = db;
