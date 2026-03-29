import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, tier, subscriptionId, customerId, subscriptionStatus, periodEnd } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'Missing userEmail' }, { status: 400 });
    }

    // Update user profile with subscription details
    const updateData = {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    };

    if (tier) {
      updateData.subscription_tier = tier;
    }

    if (subscriptionStatus) {
      updateData.subscription_status = subscriptionStatus;
    }

    if (periodEnd) {
      updateData.subscription_end_date = periodEnd;
    }

    // Find user by email and update using service role
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (users.length > 0) {
      await base44.asServiceRole.entities.User.update(users[0].id, updateData);
      return Response.json({ success: true, userId: users[0].id });
    } else {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Sync to user error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});