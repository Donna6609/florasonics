import React from "react";
import { Trophy, Medal, Award } from "lucide-react";

const RANK_STYLES = [
  { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: Medal, color: "text-slate-300", bg: "bg-slate-300/10" },
  { icon: Award, color: "text-amber-600", bg: "bg-amber-600/10" },
];

export default function TeamLeaderboard({ challenge, currentUserEmail }) {
  const sorted = [...(challenge.entries || [])].sort((a, b) => (b.minutes || 0) - (a.minutes || 0));
  const goal = challenge.goal_minutes;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">{challenge.title}</h3>
        <p className="text-sm text-white/50 capitalize">{challenge.type} · Goal: {goal} min</p>
      </div>
      <div className="divide-y divide-white/5">
        {sorted.length === 0 && (
          <p className="text-white/40 text-sm text-center py-6">No entries yet. Be the first!</p>
        )}
        {sorted.map((entry, idx) => {
          const pct = Math.min(100, Math.round(((entry.minutes || 0) / goal) * 100));
          const rankStyle = RANK_STYLES[idx] || { icon: null, color: "text-white/40", bg: "bg-white/5" };
          const RankIcon = rankStyle.icon;
          const isMe = entry.user_email === currentUserEmail;

          return (
            <div key={entry.user_email} className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-emerald-500/10" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${rankStyle.bg}`}>
                {RankIcon ? <RankIcon className={`w-4 h-4 ${rankStyle.color}`} /> : <span className="text-white/40">{idx + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium truncate ${isMe ? "text-emerald-400" : "text-white"}`}>
                    {entry.user_name || entry.user_email}{isMe ? " (you)" : ""}
                  </span>
                  <span className="text-xs text-white/50 ml-2 shrink-0">{entry.minutes || 0}/{goal} min</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}