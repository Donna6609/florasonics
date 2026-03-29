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

    // Get user's subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      created_by: user.email,
      status: "active"
    });

    if (subs.length === 0 || !subs[0].stripe_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Get the subscription from Stripe to find the customer ID
    const stripeSub = await stripe.subscriptions.retrieve(subs[0].stripe_subscription_id);
    const customerId = stripeSub.customer;

    const appUrl = req.headers.get('origin') || 'https://app.base44.com';

    // Create Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: appUrl,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Manage subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});