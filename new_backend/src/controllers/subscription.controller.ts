import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { stripe } from '../utils/stripe';

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!stripe) {
      res.status(503).json({ error: 'Stripe is not configured in this environment' });
      return;
    }

    const { tier } = req.body;
    let priceId;

    if (tier === 'pro') priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (tier === 'enterprise') priceId = process.env.STRIPE_ENTERPRISE_PRICE_ID;

    if (!priceId) {
      res.status(400).json({ error: 'Invalid tier or missing price configuration' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/index.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing.html`,
      client_reference_id: userId,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
