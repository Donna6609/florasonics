import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, X, Trophy, Medal, Award } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("all_time");

  const { data: allProgress = [] } = useQuery({
    queryKey: ["allUserProgress"],
    queryFn: () => base44.entities.UserProgress.list("-total_points", 50),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const leaderboardData = allProgress.map(progress => {
    const user = users.find(u => u.email === progress.created_by);
    return {
      ...progress,
      name: user?.full_name || user?.email || "Anonymous",
      email: progress.created_by,
    };
  });

  const currentUserRank = leaderboardData.findIndex(p => p.email === currentUser?.email) + 1;

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-white/50">#{rank}</span>;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-600/20"
      >
        <TrendingUp className="w-4 h-4" />
        <span>Leaderboard</span>
        {currentUserRank > 0 && currentUserRank <= 10 && (
          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-xs">
            #{currentUserRank}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-slate-900/95 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-all"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white/90">Leaderboard</h2>
                  <p className="text-sm text-white/50">Top performers</p>
                </div>
              </div>

              {/* Current User Rank */}
              {currentUserRank > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50 mb-1">Your Rank</p>
                      <p className="text-2xl font-light text-white/90">#{currentUserRank}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/50 mb-1">Your Points</p>
                      <p className="text-2xl font-light text-white/90">
                        {leaderboardData.find(p => p.email === currentUser?.email)?.total_points || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard List */}
              <div className="space-y-2">
                {leaderboardData.slice(0, 20).map((player, index) => {
                  const rank = index + 1;
                  const isCurrentUser = player.email === currentUser?.email;
                  
                  return (
                    <motion.div
                      key={player.email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between",
                        isCurrentUser 
                          ? "bg-blue-500/10 border-blue-500/30"
                          : rank <= 3
                          ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
                          : "bg-white/[0.04] border-white/[0.08]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 flex justify-center">
                          {getRankIcon(rank)}
                        </div>
                        <div>
                          <p className="text-white/90 font-medium">{player.name}</p>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                            <span>Level {player.level}</span>
                            <span>•</span>
                            <span>{player.activities_completed} activities</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-light text-white/90">{player.total_points}</p>
                        <p className="text-xs text-white/40">points</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}