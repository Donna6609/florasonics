import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This can be called as a scheduled job or manually by admin
    const users = await base44.asServiceRole.entities.User.list();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let sent = 0;
    for (const user of users) {
      if (!user.email) continue;

      // Gather their week's activity
      const completions = await base44.asServiceRole.entities.ActivityCompletion.filter(
        { created_by: user.email },
        "-completion_date",
        50
      );

      const weekCompletions = completions.filter(c => {
        const d = new Date(c.completion_date || c.created_date);
        return d >= oneWeekAgo;
      });

      const totalPoints = weekCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0);
      const moodLogs = await base44.asServiceRole.entities.MoodLog.filter(
        { created_by: user.email },
        "-created_date",
        7
      );

      const weekMoods = moodLogs.filter(m => new Date(m.created_date) >= oneWeekAgo);
      const moodSummary = weekMoods.length > 0
        ? `You logged ${weekMoods.length} mood check-ins this week.`
        : "Try logging your mood daily for better insights.";

      const presets = await base44.asServiceRole.entities.Preset.filter(
        { created_by: user.email },
        "-created_date",
        5
      );

      const name = user.full_name?.split(" ")[0] || "there";

      const body = `
Hi ${name},

Here's your FloraSonics weekly wellness recap 🌿

📊 This Week's Highlights:
• Activities completed: ${weekCompletions.length}
• Points earned: ${totalPoints}
• ${moodSummary}
• Presets saved: ${presets.length}

${totalPoints > 50 ? "🌟 Great week! You're building a solid wellness habit." : "🌱 Every little bit counts — keep showing up for yourself."}

Keep growing your garden,
The FloraSonics Team 🌸
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `Your FloraSonics Weekly Wellness Recap 🌿`,
        body,
        from_name: "FloraSonics",
      });

      sent++;
    }

    return Response.json({ success: true, sent });
  } catch (error) {
    console.error("Weekly report error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});