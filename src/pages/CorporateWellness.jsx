import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Users, Plus, LogOut, RefreshCw, ArrowLeft } from "lucide-react";
import TeamSetup from "@/components/corporate/TeamSetup";
import TeamChallengeCard from "@/components/corporate/TeamChallengeCard";
import CreateChallengeDialog from "@/components/corporate/CreateChallengeDialog";
import { toast } from "sonner";

export default function CorporateWellness() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLoad = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        await loadTeam(u);
      } catch (error) {
        console.error("Failed to load user:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    initLoad();
  }, []);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      await loadTeam(u);
    } catch (error) {
      console.error("Failed to load user:", error);
      toast.error("Failed to load user data");
    }
  };

  const loadTeam = async (u) => {
    const teams = await base44.entities.Team.list();
    const myTeam = teams.find(t => (t.members || []).includes(u.email));
    if (myTeam) {
      setTeam(myTeam);
      await loadChallenges(myTeam.id);
    }
  };

  const loadChallenges = async (teamId) => {
    const ch = await base44.entities.TeamChallenge.filter({ team_id: teamId });
    setChallenges(ch);
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    const members = (team.members || []).filter(e => e !== user.email);
    await base44.entities.Team.update(team.id, { members });
    setTeam(null);
    setChallenges([]);
    toast.success("Left team");
  };

  const isAdmin = team?.admin_email === user?.email;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
      {/* Back Navigation Bar */}
      <div className="border-b border-emerald-500/20 bg-emerald-950/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-3 flex items-center">
          <button
            onClick={() => navigate(createPageUrl("Home"))}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Corporate Wellness</h1>
              {team && <p className="text-sm text-white/50">{team.name}</p>}
            </div>
          </div>
          {team && (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setShowCreateChallenge(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-1" /> Challenge
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLeaveTeam}
                className="text-white/40 hover:text-red-400"
                title="Leave team"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* No team: onboarding */}
        {!team ? (
          <TeamSetup user={user} onTeamJoined={(t) => { setTeam(t); loadChallenges(t.id); }} />
        ) : (
          <div className="space-y-4">
            {/* Team info */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{team.name}</p>
                  {team.description && <p className="text-white/50 text-sm mt-0.5">{team.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">{(team.members || []).length}</p>
                  <p className="text-xs text-white/40">members</p>
                </div>
              </div>
              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                  <span className="text-xs text-white/40">Invite code:</span>
                  <span className="font-mono font-bold text-emerald-400 tracking-widest text-sm">{team.invite_code}</span>
                </div>
              )}
            </div>

            {/* Challenges */}
            <div>
              <h2 className="text-white/70 text-sm font-medium uppercase tracking-wider mb-3">
                Active Challenges
              </h2>
              {challenges.length === 0 ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                  <p className="text-white/40 text-sm">
                    {isAdmin
                      ? 'No challenges yet. Create one to get your team moving!'
                      : 'No challenges yet. Ask your team admin to create one!'}
                  </p>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => setShowCreateChallenge(true)}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Create First Challenge
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {challenges.map(ch => (
                    <TeamChallengeCard
                      key={ch.id}
                      challenge={ch}
                      user={user}
                      isAdmin={isAdmin}
                      onUpdate={() => loadChallenges(team.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {team && (
        <CreateChallengeDialog
          open={showCreateChallenge}
          onClose={() => setShowCreateChallenge(false)}
          teamId={team.id}
          onCreated={() => loadChallenges(team.id)}
        />
      )}
      </div>
      </div>
      );
      }