import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      const tier = session.metadata?.tier;

      if (!userEmail || !tier) {
        console.error('Missing metadata:', session.metadata);
        return Response.json({ received: true });
      }

      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ created_by: userEmail });

      if (existingSubs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          tier,
          stripe_subscription_id: session.subscription,
          status: 'active',
        });
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          created_by: userEmail,
          tier,
          stripe_subscription_id: session.subscription,
          status: 'active',
        });
      }
      console.log(`Subscription created for ${userEmail} - tier: ${tier}`);
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: subscription.id,
      });

      if (existingSubs.length > 0) {
        const newStatus = subscription.status === 'active' ? 'active'
          : subscription.cancel_at_period_end ? 'cancelled' : 'expired';

        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          status: newStatus,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined,
        });
        console.log(`Subscription ${subscription.id} updated to ${newStatus}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});