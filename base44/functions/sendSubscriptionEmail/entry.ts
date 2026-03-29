import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, full_name, tier, type } = await req.json();

    // Get actual user full_name from database
    let userName = full_name || email;
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users.length > 0 && users[0].full_name) {
        userName = users[0].full_name;
      }
    } catch (err) {
      console.log("Could not fetch user name, using email");
    }

    console.log(`Sending ${type} email for ${tier} to ${email}`);

    let subject, body;

    if (type === "subscription_created") {
      subject = `Welcome to FloraSonics ${tier.charAt(0).toUpperCase() + tier.slice(1)}! 🌿`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
          <h1 style="color: #34d399;">Welcome to FloraSonics ${tier.charAt(0).toUpperCase() + tier.slice(1)}, ${userName}! 🎉</h1>
          
          <p>Thank you for subscribing to FloraSonics ${tier.charAt(0).toUpperCase() + tier.slice(1)}. Your subscription is now active and you have access to:</p>
          
          ${tier === "basic" ? `
            <ul>
              <li>All free sounds</li>
              <li>Forest ambience</li>
              <li>Fireplace crackling</li>
              <li>Bird songs</li>
              <li>Train sounds</li>
              <li>Stream water</li>
              <li>Save unlimited presets</li>
            </ul>
          ` : `
            <ul>
              <li>All Basic sounds</li>
              <li>Thunder storms</li>
              <li>Coffee shop ambience</li>
              <li>Night crickets</li>
              <li>AI soundscape generator</li>
              <li>Download soundscapes</li>
              <li>Priority support</li>
            </ul>
          `}
          
          <p style="margin-top: 30px; color: #34d399; font-weight: bold;">Start creating your perfect soundscape now!</p>
          <a href="https://florasonics.com" style="display: inline-block; margin-top: 20px; padding: 12px 28px; background: #059669; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Open FloraSonics</a>
          
          <p style="color: #94a3b8; font-size: 14px; margin-top: 40px;">
            If you have any questions, reply to this email or visit your Settings page to manage your subscription.
          </p>
        </div>
      `;
    } else if (type === "subscription_cancelled") {
      subject = "Your FloraSonics subscription has been cancelled";
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
          <h1 style="color: #f87171;">Subscription Cancelled</h1>
          
          <p>Hi ${userName},</p>
          
          <p>Your FloraSonics ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription has been cancelled. You'll continue to have access until the end of your current billing period.</p>
          
          <p>We're sorry to see you go! If you have feedback on how we can improve, we'd love to hear it.</p>
          
          <p style="margin-top: 30px;">You can resubscribe anytime from the app.</p>
          
          <p style="color: #94a3b8; font-size: 14px; margin-top: 40px;">
            Thank you for using FloraSonics. 🌿
          </p>
        </div>
      `;
    }

    // Send email to user
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: "FloraSonics",
      subject: subject,
      body: body,
    });

    // Send admin notification
    const adminEmail = "admin@yourdomain.com"; // Replace with your email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: "FloraSonics System",
      subject: `New ${type}: ${email}`,
      body: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Subscription Event</h2>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>User:</strong> ${full_name} (${email})</p>
          <p><strong>Tier:</strong> ${tier}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log(`Emails sent successfully`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});