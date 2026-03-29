import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log("Generating daily activity summary...");

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();

    // Get activity from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const activities = await base44.asServiceRole.entities.ActivityCompletion.filter({
      completion_date: { $gte: yesterday.toISOString() }
    });

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      created_date: { $gte: yesterday.toISOString() }
    });

    // Send summary to admin
    const adminEmail = "admin@yourdomain.com"; // Replace with your email
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: "Drift Analytics",
      subject: `Drift Daily Summary - ${new Date().toLocaleDateString()}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Daily Activity Summary</h1>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Overview</h2>
            <p><strong>Total Users:</strong> ${users.length}</p>
            <p><strong>Activities (24h):</strong> ${activities.length}</p>
            <p><strong>New Subscriptions (24h):</strong> ${subscriptions.length}</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Activity Breakdown</h2>
            <p><strong>Meditation:</strong> ${activities.filter(a => a.activity_type === 'meditation').length}</p>
            <p><strong>Breathing:</strong> ${activities.filter(a => a.activity_type === 'breathing').length}</p>
            <p><strong>Pomodoro:</strong> ${activities.filter(a => a.activity_type === 'pomodoro').length}</p>
            <p><strong>Mood Logs:</strong> ${activities.filter(a => a.activity_type === 'mood_log').length}</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Subscription Breakdown</h2>
            <p><strong>Free:</strong> ${subscriptions.filter(s => s.tier === 'free').length}</p>
            <p><strong>Basic:</strong> ${subscriptions.filter(s => s.tier === 'basic').length}</p>
            <p><strong>Premium:</strong> ${subscriptions.filter(s => s.tier === 'premium').length}</p>
          </div>

          <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log("Daily summary sent successfully");
    return Response.json({ success: true, summary: { users: users.length, activities: activities.length, subscriptions: subscriptions.length } });
  } catch (error) {
    console.error("Summary error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});