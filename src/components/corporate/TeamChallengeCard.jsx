import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import TeamLeaderboard from "./TeamLeaderboard";
import { toast } from "sonner";

export default function TeamChallengeCard({ challenge, user, onUpdate, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const [addingMinutes, setAddingMinutes] = useState(false);
  const [minutes, setMinutes] = useState("");

  const myEntry = (challenge.entries || []).find(e => e.user_email === user.email);

  const handleLogMinutes = async () => {
    const mins = parseInt(minutes);
    if (!mins || mins <= 0) return;
    const entries = [...(challenge.entries || [])];
    const idx = entries.findIndex(e => e.user_email === user.email);
    if (idx >= 0) {
      entries[idx] = { ...entries[idx], minutes: (entries[idx].minutes || 0) + mins };
    } else {
      entries.push({ user_email: user.email, user_name: user.full_name || user.email, minutes: mins });
    }
    await base44.entities.TeamChallenge.update(challenge.id, { entries });
    setMinutes("");
    setAddingMinutes(false);
    toast.success(`Logged ${mins} minutes!`);
    onUpdate();
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-left">
          <p className="font-medium text-white">{challenge.title}</p>
          <p className="text-xs text-white/50 capitalize">{challenge.type} · My progress: {myEntry?.minutes || 0}/{challenge.goal_minutes} min</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <TeamLeaderboard challenge={challenge} currentUserEmail={user.email} />

          {!addingMinutes ? (
            <Button size="sm" onClick={() => setAddingMinutes(true)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> Log Minutes
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Minutes"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                min={1}
              />
              <Button size="sm" onClick={handleLogMinutes} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">Log</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingMinutes(false)} className="text-white/60 shrink-0">Cancel</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}