const path = require('path');
const fs = require('fs');

// Ensure test DB directory exists before anything imports db.js
const testDbDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

const db = require('../db');
const { handleWebhook, _stripe } = require('../stripe-webhook');

describe('Webhook Handler', () => {
  let originalRetrieve;

  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM invoices').run();
    originalRetrieve = _stripe.subscriptions.retrieve;
  });

  afterEach(() => {
    _stripe.subscriptions.retrieve = originalRetrieve;
  });

  function insertUser(id, overrides = {}) {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, tier, stripe_subscription_id, daily_action_count, daily_action_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      overrides.email || `${id}@test.com`,
      'hash',
      overrides.tier || 'free',
      overrides.stripe_subscription_id || null,
      overrides.daily_action_count || 0,
      overrides.daily_action_date || null
    );
  }

  describe('checkout.session.completed', () => {
    it('upgrades user tier and sets subscription id', async () => {
      _stripe.subscriptions.retrieve = vi.fn().mockResolvedValue({
        id: 'sub_test_123',
        items: { data: [{ price: { id: 'price_pro_monthly_test' } }] },
      });
      insertUser('user-1');

      await handleWebhook({
        id: 'evt_checkout_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-1', tier: 'pro' },
            subscription: 'sub_test_123',
          },
        },
      });

      const user = db.prepare('SELECT tier, stripe_subscription_id, daily_action_count FROM users WHERE id = ?').get('user-1');
      expect(user.tier).toBe('pro');
      expect(user.stripe_subscription_id).toBe('sub_test_123');
      expect(user.daily_action_count).toBe(0);
    });
  });

  describe('customer.subscription.updated', () => {
    it('updates tier on active subscription', async () => {
      insertUser('user-2', { stripe_subscription_id: 'sub_test_123' });

      await handleWebhook({
        id: 'evt_sub_updated_active',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'active',
            items: { data: [{ price: { id: 'price_pro_monthly_test' } }] },
          },
        },
      });

      const user = db.prepare('SELECT tier FROM users WHERE id = ?').get('user-2');
      expect(user.tier).toBe('pro');
    });

    it('keeps current tier on past_due', async () => {
      insertUser('user-3', { tier: 'pro', stripe_subscription_id: 'sub_test_123' });

      await handleWebhook({
        id: 'evt_sub_updated_past_due',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'past_due',
            items: { data: [{ price: { id: 'price_pro_monthly_test' } }] },
          },
        },
      });

      const user = db.prepare('SELECT tier FROM users WHERE id = ?').get('user-3');
      expect(user.tier).toBe('pro');
    });

    it('downgrades to free on canceled', async () => {
      insertUser('user-4', { tier: 'business', stripe_subscription_id: 'sub_test_123' });

      await handleWebhook({
        id: 'evt_sub_updated_canceled',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'canceled',
            items: { data: [{ price: { id: 'price_business_monthly_test' } }] },
          },
        },
      });

      const user = db.prepare('SELECT tier FROM users WHERE id = ?').get('user-4');
      expect(user.tier).toBe('free');
    });
  });

  describe('customer.subscription.deleted', () => {
    it('resets user to free and clears subscription id', async () => {
      insertUser('user-5', { tier: 'pro', stripe_subscription_id: 'sub_test_123' });

      await handleWebhook({
        id: 'evt_sub_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub_test_123' },
        },
      });

      const user = db.prepare('SELECT tier, stripe_subscription_id FROM users WHERE id = ?').get('user-5');
      expect(user.tier).toBe('free');
      expect(user.stripe_subscription_id).toBeNull();
    });
  });

  describe('invoice.payment_failed', () => {
    it('downgrades user on repeated payment failures', async () => {
      insertUser('user-6', { tier: 'pro', stripe_subscription_id: 'sub_test_123' });

      await handleWebhook({
        id: 'evt_payment_failed_1',
        type: 'invoice.payment_failed',
        data: {
          object: { subscription: 'sub_test_123', attempt_count: 3 },
        },
      });

      const user = db.prepare('SELECT tier FROM users WHERE id = ?').get('user-6');
      expect(user.tier).toBe('free');
    });

    it('keeps tier on first payment failure', async () => {
      insertUser('user-6b', { tier: 'pro', stripe_subscription_id: 'sub_test_123' });

      await handleWebhook({
        id: 'evt_payment_failed_2',
        type: 'invoice.payment_failed',
        data: {
          object: { subscription: 'sub_test_123', attempt_count: 1 },
        },
      });

      const user = db.prepare('SELECT tier FROM users WHERE id = ?').get('user-6b');
      expect(user.tier).toBe('pro');
    });

    it('ignores payment failure without subscription', async () => {
      insertUser('user-7', { tier: 'pro' });

      await handleWebhook({
        id: 'evt_payment_failed_3',
        type: 'invoice.payment_failed',
        data: {
          object: { subscription: null },
        },
      });

      const user = db.prepare('SELECT tier FROM users WHERE id = ?').get('user-7');
      expect(user.tier).toBe('pro');
    });
  });
});
