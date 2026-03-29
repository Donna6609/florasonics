import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CreateChallengeDialog({ open, onClose, teamId, onCreated }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("meditation");
  const [goalMinutes, setGoalMinutes] = useState("60");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !goalMinutes) return;
    setLoading(true);
    await base44.entities.TeamChallenge.create({
      team_id: teamId,
      title: title.trim(),
      type,
      goal_minutes: parseInt(goalMinutes),
      end_date: endDate || undefined,
      entries: [],
    });
    toast.success("Challenge created!");
    setTitle(""); setType("meditation"); setGoalMinutes("60"); setEndDate("");
    setLoading(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">New Team Challenge</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Input
            placeholder="Challenge title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="meditation">Meditation</SelectItem>
              <SelectItem value="breathing">Breathing</SelectItem>
              <SelectItem value="listening">Listening</SelectItem>
              <SelectItem value="pomodoro">Pomodoro</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Goal (minutes)"
            value={goalMinutes}
            onChange={(e) => setGoalMinutes(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            min={1}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
          <Button onClick={handleCreate} disabled={loading || !title.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Creating..." : "Create Challenge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}