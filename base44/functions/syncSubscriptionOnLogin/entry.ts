import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Try to find customer by email
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    let syncedData = {
      subscription_tier: 'free',
      subscription_status: 'active',
      subscription_end_date: null,
      stripe_customer_id: customerId,
    };

    // Fetch subscriptions if customer exists
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const priceId = sub.items.data[0]?.price.id;

        // Map Stripe price IDs to tiers
        const tierMap = {
          [Deno.env.get('STRIPE_BASIC_PRICE_ID')]: 'basic',
          [Deno.env.get('STRIPE_PREMIUM_PRICE_ID')]: 'premium',
          [Deno.env.get('STRIPE_PRO_PRICE_ID')]: 'pro',
          [Deno.env.get('STRIPE_TEAMS_PRICE_ID')]: 'teams',
        };

        syncedData.subscription_tier = tierMap[priceId] || 'free';
        syncedData.subscription_status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'cancelled';
        syncedData.subscription_end_date = new Date(sub.current_period_end * 1000).toISOString();
      }
    }

    // Update user with synced subscription data
    await base44.auth.updateMe(syncedData);

    return Response.json({ 
      success: true, 
      subscription: syncedData 
    });
  } catch (error) {
    console.error('Sync error:', error);
    // Return 429 as a non-fatal response so frontend doesn't treat it as an auth error
    const status = error.status === 429 ? 429 : 500;
    return Response.json({ error: error.message, retryable: status === 429 }, { status });
  }
});