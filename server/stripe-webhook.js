const stripe = require('./stripe');
const db = require('./db');

const TIER_BY_PRICE = {};
if (process.env.STRIPE_STARTUP_MONTHLY_PRICE) TIER_BY_PRICE[process.env.STRIPE_STARTUP_MONTHLY_PRICE] = 'startup';
if (process.env.STRIPE_STARTUP_ANNUAL_PRICE) TIER_BY_PRICE[process.env.STRIPE_STARTUP_ANNUAL_PRICE] = 'startup';
if (process.env.STRIPE_BUSINESS_MONTHLY_PRICE) TIER_BY_PRICE[process.env.STRIPE_BUSINESS_MONTHLY_PRICE] = 'business';
if (process.env.STRIPE_BUSINESS_ANNUAL_PRICE) TIER_BY_PRICE[process.env.STRIPE_BUSINESS_ANNUAL_PRICE] = 'business';

function getTierFromPriceId(priceId) {
  return TIER_BY_PRICE[priceId] || null;
}

// Idempotency: track processed event IDs to prevent duplicate processing
const processedEvents = new Map();
const EVENT_TTL = 24 * 60 * 60 * 1000; // 24 hours

function isEventProcessed(eventId) {
  if (processedEvents.has(eventId)) return true;
  return false;
}

function markEventProcessed(eventId) {
  processedEvents.set(eventId, Date.now());
  // Cleanup old entries periodically
  if (processedEvents.size > 10000) {
    const now = Date.now();
    for (const [id, time] of processedEvents) {
      if (now - time > EVENT_TTL) processedEvents.delete(id);
    }
  }
}

async function handleWebhook(event) {
  if (!stripe) return;

  // Idempotency check
  if (isEventProcessed(event.id)) {
    console.log(`[Stripe Webhook] Skipping duplicate event ${event.id}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Check if this is an invoice "Pay Now" checkout
      if (session.mode === 'payment' && session.metadata && session.metadata.invoiceId) {
        const invoiceId = session.metadata.invoiceId;
        const now = new Date().toISOString();
        db.prepare('UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?').run('paid', now, invoiceId);
        break; // Exit the case early so we don't try to process it as a subscription
      }

      // Handle standard SaaS subscription
      const userId = session.metadata.userId;
      const tier = session.metadata.tier || 'startup';

      let subscription;
      try {
        subscription = await stripe.subscriptions.retrieve(session.subscription);
      } catch (err) {
        console.error('[Stripe Webhook] Failed to retrieve subscription:', err.message);
        break;
      }
      const priceId = subscription.items.data[0]?.price?.id;
      const resolvedTier = getTierFromPriceId(priceId) || tier;

      db.prepare(`
        UPDATE users
        SET tier = ?,
            stripe_subscription_id = ?,
            daily_action_count = 0,
            daily_action_date = NULL
        WHERE id = ?
      `).run(resolvedTier, session.subscription, userId);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const status = subscription.status;
      const priceId = subscription.items.data[0]?.price?.id;
      const tier = getTierFromPriceId(priceId);

      if (status === 'active' && tier) {
        db.prepare(`
          UPDATE users SET tier = ? WHERE stripe_subscription_id = ?
        `).run(tier, subscription.id);
      } else if (status === 'past_due') {
        // Don't downgrade immediately on past_due — Stripe will retry payment.
        // Keep the current tier active while payment is being retried.
        console.log(`[Stripe Webhook] Subscription ${subscription.id} is past_due — keeping current tier`);
      } else if (status === 'canceled' || status === 'unpaid') {
        db.prepare(`
          UPDATE users SET tier = 'free' WHERE stripe_subscription_id = ?
        `).run(subscription.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      db.prepare(`
        UPDATE users
        SET tier = 'free',
            stripe_subscription_id = NULL
        WHERE stripe_subscription_id = ?
      `).run(subscription.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        // Only downgrade after multiple failed payments (attempt_count >= 3)
        const attemptCount = invoice.attempt_count || 1;
        if (attemptCount >= 3) {
          db.prepare(`
            UPDATE users SET tier = 'free' WHERE stripe_subscription_id = ?
          `).run(subscriptionId);
        }
      }
      break;
    }
  }

  markEventProcessed(event.id);
}

module.exports = { handleWebhook, _stripe: stripe };
