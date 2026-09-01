const express = require('express');
const stripe = require('../stripe');
const db = require('../db');
const authenticate = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');

const router = express.Router();

if (!stripe) {
  router.all('*', (req, res) => res.status(503).json({ error: 'Stripe not configured' }));
  module.exports = router;
  return;
}

const PRICE_MAP = {
  startup: {
    monthly: process.env.STRIPE_STARTUP_MONTHLY_PRICE,
    annual: process.env.STRIPE_STARTUP_ANNUAL_PRICE
  },
  business: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE,
    annual: process.env.STRIPE_BUSINESS_ANNUAL_PRICE
  }
};

router.post('/checkout', authenticate, csrfProtection, async (req, res) => {
  try {
    const { tier, interval } = req.body;

    if (!tier || !PRICE_MAP[tier]) {
      return res.status(400).json({ error: 'Invalid tier. Must be "startup" or "business".' });
    }

    const intervalKey = interval === 'annual' ? 'annual' : 'monthly';
    const priceId = PRICE_MAP[tier][intervalKey];

    if (!priceId) {
      return res.status(400).json({ error: 'Price not configured for this plan.' });
    }

    const { id: userId, email, stripe_customer_id } = req.user;

    let customerId = stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, userId);
    }

    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${frontendUrl}/pricing.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pricing.html`,
      metadata: { userId, tier }
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/portal', authenticate, csrfProtection, async (req, res) => {
  try {
    const { stripe_customer_id } = req.user;

    if (!stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${frontendUrl}/pricing.html`
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

module.exports = router;
