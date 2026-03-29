import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  const { type, data } = event;
  const object = data.object;

  try {
    // Handle successful checkout → subscription created
    if (type === "checkout.session.completed" || type === "customer.subscription.created") {
      const metadata = object.metadata || {};
      const userEmail = metadata.user_email;
      const tier = metadata.tier;
      const customerId = object.customer || metadata.customer_id;

      if (!userEmail || !tier) {
        console.error("Missing metadata in webhook:", metadata);
        return Response.json({ received: true });
      }

      const subscriptionId = object.subscription || object.id;
      let periodEnd = null;
      if (object.current_period_end) {
        periodEnd = new Date(object.current_period_end * 1000).toISOString();
      }

      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ created_by: userEmail });

      if (existingSubs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          tier,
          stripe_subscription_id: subscriptionId,
          status: "active",
          ...(periodEnd && { current_period_end: periodEnd }),
        });
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          created_by: userEmail,
          tier,
          stripe_subscription_id: subscriptionId,
          status: "active",
          ...(periodEnd && { current_period_end: periodEnd }),
        });
      }

      // Sync subscription to User profile
      try {
        await base44.asServiceRole.functions.invoke('syncSubscriptionToUser', {
          userEmail,
          tier,
          subscriptionId,
          customerId,
          periodEnd,
        });
      } catch (syncErr) {
        console.error("User sync error:", syncErr);
      }

      // Send welcome email
      try {
        await base44.asServiceRole.functions.invoke('sendSubscriptionEmail', {
          email: userEmail,
          full_name: userEmail,
          tier,
          type: 'subscription_created',
        });
      } catch (emailErr) {
        console.error("Welcome email error:", emailErr);
      }
    }

    // Handle subscription cancelled/deleted/updated
    if (type === "customer.subscription.deleted" || type === "customer.subscription.updated") {
      const subscription = object;
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: subscription.id,
      });

      if (existingSubs.length > 0) {
        const newStatus = subscription.status === "active"
          ? "active"
          : subscription.cancel_at_period_end
            ? "cancelled"
            : subscription.status === "past_due"
            ? "past_due"
            : "expired";

        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          status: newStatus,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        // Sync status change to User profile
        try {
          await base44.asServiceRole.functions.invoke('syncSubscriptionToUser', {
            userEmail: existingSubs[0].created_by,
            tier: existingSubs[0].tier,
            subscriptionStatus: newStatus,
            periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        } catch (syncErr) {
          console.error("User sync error:", syncErr);
        }

        if (newStatus === "cancelled") {
          try {
            const userEmail = existingSubs[0].created_by;
            await base44.asServiceRole.functions.invoke('sendSubscriptionEmail', {
              email: userEmail,
              full_name: userEmail,
              tier: existingSubs[0].tier,
              type: 'subscription_cancelled',
            });
          } catch (emailErr) {
            console.error("Cancellation email error:", emailErr);
          }
        }
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});