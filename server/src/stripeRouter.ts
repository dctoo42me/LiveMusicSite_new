// server/src/stripeRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Stripe } from 'stripe';
import { Pool } from 'pg';
import { verifyToken } from './auth.js';
import { getVenueById, updateVenueTier } from './venueRepository.js';
import { logAction } from './utils/audit.js';
import { sendSubscriptionUpgradeEmail } from './utils/email.js';
import logger from './utils/logger.js';

const apiKey = process.env.STRIPE_SECRET_KEY;
const isDevMode = !apiKey || apiKey === 'sk_test_dev_placeholder';

const stripe = new Stripe(apiKey || 'sk_test_dev_placeholder', {
  apiVersion: '2025-01-27' as any,
});

export function createStripeRouter(pool: Pool) {
  const router = Router();

  // Middleware to check for Stripe key
  const checkStripeConfig = (req: Request, res: Response, next: any) => {
    if (isDevMode) {
      logger.warn(`Stripe operation attempted in Dev Mode: ${req.method} ${req.path}`);
      return res.status(503).json({ 
        error: 'Stripe is not configured in this environment.',
        details: 'Missing STRIPE_SECRET_KEY in server/.env'
      });
    }
    next();
  };

  // POST /create-checkout-session
  router.post('/create-checkout-session', verifyToken, checkStripeConfig, async (req: Request, res: Response) => {
    const { venueId } = req.body;
    const userId = (req as any).user.userId;

    if (!venueId) return res.status(400).json({ error: 'venueId is required.' });

    try {
      const venue = await getVenueById(pool, parseInt(venueId, 10));
      if (!venue) return res.status(404).json({ error: 'Venue not found.' });
      if (venue.ownerId !== userId) return res.status(403).json({ error: 'Access denied.' });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Pro Subscription - ${venue.name}`,
                description: 'Unlimited events, 15 gallery images, and featured ranking.',
              },
              unit_amount: 2900, // $29.00
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/manage?success=true&venueId=${venueId}`,
        cancel_url: `${process.env.FRONTEND_URL}/manage?canceled=true`,
        metadata: {
          venueId: venueId.toString(),
          userId: userId.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      logger.error('Stripe session error:', error);
      res.status(500).json({ error: 'Failed to create checkout session.' });
    }
  });

  // POST /create-portal-session (Manage existing subscription)
  router.post('/create-portal-session', verifyToken, checkStripeConfig, async (req: Request, res: Response) => {
    const { venueId } = req.body;
    const userId = (req as any).user.userId;

    try {
      const venue = await getVenueById(pool, parseInt(venueId, 10));
      if (!venue) return res.status(404).json({ error: 'Venue not found.' });
      if (venue.ownerId !== userId) return res.status(403).json({ error: 'Access denied.' });
      if (!venue.stripeCustomerId) return res.status(400).json({ error: 'No active subscription found for this venue.' });

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: venue.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/manage`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      logger.error('Stripe portal error:', error);
      res.status(500).json({ error: 'Failed to create portal session.' });
    }
  });

  // POST /webhook (Secure Stripe Listener)
  // Note: This requires the raw body, handled in index.ts
  router.post('/webhook', async (req: Request, res: Response) => {
    if (isDevMode) {
      return res.status(200).json({ message: 'Webhook received but ignored in Dev Mode (no Stripe key).' });
    }
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const venueId = session.metadata?.venueId;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;

      if (venueId) {
        try {
          const venueIdInt = parseInt(venueId, 10);
          await updateVenueTier(pool, venueIdInt, 'pro');
          // Store customer ID for future portal access/cancellation
          await pool.query('UPDATE venues SET stripe_customer_id = $1 WHERE id = $2', [customerId, venueIdInt]);
          
          await logAction(pool, userId ? parseInt(userId, 10) : null, 'SUBSCRIPTION_UPGRADED', 'venues', venueIdInt, { tier: 'pro', sessionId: session.id, customerId });
          
          // Send upgrade email
          const venue = await getVenueById(pool, venueIdInt);
          const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
          if (venue && userRes.rows[0]?.email) {
            await sendSubscriptionUpgradeEmail(userRes.rows[0].email, venue.name);
          }

          logger.info(`Venue ${venueId} successfully upgraded to PRO tier.`);
        } catch (error) {
          logger.error('Failed to update venue tier from webhook:', error);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      try {
        // Find venue by customer ID and downgrade
        const venueRes = await pool.query('SELECT id, name FROM venues WHERE stripe_customer_id = $1', [customerId]);
        if (venueRes.rows.length > 0) {
          const venue = venueRes.rows[0];
          await updateVenueTier(pool, venue.id, 'free');
          await logAction(pool, null, 'SUBSCRIPTION_CANCELED', 'venues', venue.id, { tier: 'free', customerId });
          logger.info(`Venue ${venue.id} (${venue.name}) downgraded to FREE tier due to subscription cancellation.`);
        }
      } catch (error) {
        logger.error('Failed to downgrade venue on subscription delete:', error);
      }
    }

    res.json({ received: true });
  });

  return router;
}
