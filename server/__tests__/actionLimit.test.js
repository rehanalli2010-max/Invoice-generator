const path = require('path');
const fs = require('fs');

// Ensure test DB directory exists before anything imports db.js
const testDbDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

const db = require('../db');
const { actionLimit, incrementActionCount, TIER_LIMITS } = require('../middleware/actionLimit');

describe('actionLimit middleware', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM invoices').run();
  });

  function insertUser(id, tier = 'free', actionCount = 0) {
    const today = new Date().toISOString().split('T')[0];
    db.prepare(
      `INSERT INTO users (id, email, password_hash, tier, daily_action_count, daily_action_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, `${id}@test.com`, 'hash', tier, actionCount, today);
  }

  function mockReqRes(userId) {
    const user = db.prepare(
      'SELECT id, email, tier, daily_action_count, stripe_customer_id, stripe_subscription_id FROM users WHERE id = ?'
    ).get(userId);

    const req = { user };
    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };
    const next = { called: false, call() { this.called = true; } };

    return { req, res, next: () => { next.called = true; }, nextObj: next };
  }

  describe('TIER_LIMITS', () => {
    it('defines limits for all tiers', () => {
      expect(TIER_LIMITS.free).toBe(20);
      expect(TIER_LIMITS.pro).toBe(500);
      expect(TIER_LIMITS.business).toBe(Infinity);
    });
  });

  describe('actionLimit()', () => {
    it('allows action when under limit', () => {
      insertUser('u1', 'free', 5);
      const { req, res, next } = mockReqRes('u1');
      actionLimit(req, res, next);
      expect(res.statusCode).toBeNull();
    });

    it('blocks action when at limit', () => {
      insertUser('u2', 'free', 20);
      const { req, res, next } = mockReqRes('u2');
      actionLimit(req, res, next);
      expect(res.statusCode).toBe(429);
      expect(res.body.error).toBe('Daily action limit reached');
    });

    it('allows unlimited actions for business tier', () => {
      insertUser('u3', 'business', 9999);
      const { req, res, next } = mockReqRes('u3');
      actionLimit(req, res, next);
      expect(res.statusCode).toBeNull();
    });

    it('resets counter when date changes', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      db.prepare(
        `INSERT INTO users (id, email, password_hash, tier, daily_action_count, daily_action_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('u4', 'u4@test.com', 'hash', 'free', 20, yesterday);

      const { req, res, next } = mockReqRes('u4');
      actionLimit(req, res, next);
      expect(res.statusCode).toBeNull();

      const user = db.prepare('SELECT daily_action_count FROM users WHERE id = ?').get('u4');
      // actionLimit() atomically counts the triggering request as the day's
      // first action (sets count to 1 on a date change), so 1 — not 0 — is correct.
      expect(user.daily_action_count).toBe(1);
    });
  });

  describe('incrementActionCount()', () => {
    it('increments count for today', () => {
      insertUser('u5', 'free', 0);
      incrementActionCount('u5');
      const user = db.prepare('SELECT daily_action_count FROM users WHERE id = ?').get('u5');
      expect(user.daily_action_count).toBe(1);
    });

    it('increments multiple times', () => {
      insertUser('u6', 'free', 0);
      incrementActionCount('u6');
      incrementActionCount('u6');
      incrementActionCount('u6');
      const user = db.prepare('SELECT daily_action_count FROM users WHERE id = ?').get('u6');
      expect(user.daily_action_count).toBe(3);
    });
  });
});
