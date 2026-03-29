import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tier, email } = await req.json();

    const priceIds = {
      basic: Deno.env.get("STRIPE_BASIC_PRICE_ID"),
      premium: Deno.env.get("STRIPE_PREMIUM_PRICE_ID"),
      pro: Deno.env.get("STRIPE_PRO_PRICE_ID"),
      teams: Deno.env.get("STRIPE_TEAMS_PRICE_ID"),
    };

    const priceId = priceIds[tier];
    if (!priceId) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const appUrl = req.headers.get('origin') || 'https://app.base44.com';

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}?subscription=success`,
      cancel_url: `${appUrl}?subscription=cancelled`,
      metadata: {
        tier: tier,
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
      },
    };

    // Try to get authenticated user, but don't require it
    let userEmail = email;
    try {
      const user = await base44.auth.me();
      if (user?.email) {
        userEmail = user.email;
        sessionParams.metadata.user_email = user.email;

        // Check for existing active subscription
        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
          created_by: user.email,
          status: "active"
        });
        if (existingSubs.length > 0) {
          return Response.json({ error: 'You already have an active subscription.' }, { status: 400 });
        }
      }
    } catch (_) {
      // Not authenticated, proceed without user context
    }

    if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});