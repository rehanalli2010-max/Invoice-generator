const path = require('path');
const fs = require('fs');

// Ensure test DB directory exists
const testDbDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

// Each test file gets its own database to avoid SQLite locking conflicts
const testId = process.env.VITEST_POOL_ID || '0';
process.env.DATABASE_URL = path.join(testDbDir, `test-${testId}.db`);

process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-32-bytes!!';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_PRO_MONTHLY_PRICE = 'price_pro_monthly_test';
process.env.STRIPE_PRO_ANNUAL_PRICE = 'price_pro_annual_test';
process.env.STRIPE_BUSINESS_MONTHLY_PRICE = 'price_business_monthly_test';
process.env.STRIPE_BUSINESS_ANNUAL_PRICE = 'price_business_annual_test';
process.env.CLIENT_URL = 'http://localhost:8080';
