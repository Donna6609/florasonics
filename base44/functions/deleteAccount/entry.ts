import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ENTITIES = [
  'Preset', 'Favorite', 'MoodLog', 'Subscription', 'PlaybackHistory',
  'ActivityCompletion', 'UserProgress', 'WellnessGoal', 'WellnessJourney',
  'DownloadedSound', 'DownloadedWellnessContent', 'BiometricData',
  'WearableConnection', 'ActivityTracking', 'NatureJournal',
  'DownloadPurchase', 'Review', 'ChatMessage'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    for (const entity of ENTITIES) {
      try {
        const records = await base44.entities[entity].filter({ created_by: user.email });
        for (const record of records) {
          await base44.entities[entity].delete(record.id);
        }
      } catch (_e) {
        // Continue deleting other entities even if one fails
      }
    }

    // Handle teams - remove from members or delete if admin
    try {
      const teams = await base44.entities.Team.list();
      for (const team of teams) {
        if (team.admin_email === user.email) {
          await base44.entities.Team.delete(team.id);
        } else if ((team.members || []).includes(user.email)) {
          await base44.entities.Team.update(team.id, {
            members: team.members.filter(e => e !== user.email)
          });
        }
      }
    } catch (_e) {}

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});