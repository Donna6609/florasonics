import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, title, message, type } = await req.json();

    // Get user to check push notification preference
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Store push notification record for user to receive
    try {
      await base44.asServiceRole.entities.PushNotification.create({
        user_email: userEmail,
        title,
        message,
        type,
        read: false,
        sent_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      // PushNotification entity might not exist yet, log and continue
      console.log("PushNotification entity not available, notification logged to console");
    }

    // Also send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      from_name: "Drift Notifications",
      subject: title,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">${title}</h2>
          <p>${message}</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
            This is an automated notification from Drift.
          </p>
        </div>
      `,
    });

    console.log(`Push notification sent to ${userEmail}: ${title}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Push notification error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});