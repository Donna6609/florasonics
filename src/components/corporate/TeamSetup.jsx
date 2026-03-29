import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, LogIn, Copy, Check } from "lucide-react";
import { toast } from "sonner";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeamSetup({ user, onTeamJoined }) {
  const [mode, setMode] = useState(null); // "create" | "join"
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setLoading(true);
    const code = generateCode();
    const team = await base44.entities.Team.create({
      name: teamName.trim(),
      description: description.trim(),
      invite_code: code,
      admin_email: user.email,
      members: [user.email],
    });
    setCreatedCode(code);
    setLoading(false);
    onTeamJoined(team);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    const teams = await base44.entities.Team.filter({ invite_code: joinCode.trim().toUpperCase() });
    if (!teams.length) {
      toast.error("Invalid invite code");
      setLoading(false);
      return;
    }
    const team = teams[0];
    const members = team.members || [];
    if (!members.includes(user.email)) {
      await base44.entities.Team.update(team.id, { members: [...members, user.email] });
    }
    setLoading(false);
    onTeamJoined({ ...team, members: [...members, user.email] });
    toast.success(`Joined ${team.name}!`);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Corporate Wellness</h2>
      <p className="text-white/60 text-center mb-8 max-w-sm">
        Create a team or join one with an invite code to access team challenges and leaderboards.
      </p>

      {!mode && (
        <div className="flex gap-3">
          <Button onClick={() => setMode("create")} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Create Team
          </Button>
          <Button onClick={() => setMode("join")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <LogIn className="w-4 h-4 mr-2" /> Join Team
          </Button>
        </div>
      )}

      {mode === "create" && (
        <div className="w-full max-w-sm space-y-3">
          <Input
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={loading || !teamName.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button variant="ghost" onClick={() => setMode(null)} className="text-white/60">Cancel</Button>
          </div>
          {createdCode && (
            <div className="mt-4 p-4 rounded-xl bg-white/10 border border-white/20 text-center">
              <p className="text-white/60 text-sm mb-1">Share this invite code:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-emerald-400 tracking-widest">{createdCode}</span>
                <button onClick={copyCode} className="text-white/60 hover:text-white">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "join" && (
        <div className="w-full max-w-sm space-y-3">
          <Input
            placeholder="Enter invite code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-center text-xl tracking-widest font-mono uppercase"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button onClick={handleJoin} disabled={loading || !joinCode.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Joining..." : "Join"}
            </Button>
            <Button variant="ghost" onClick={() => setMode(null)} className="text-white/60">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}