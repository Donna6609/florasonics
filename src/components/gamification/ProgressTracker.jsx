import React from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Star, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function ProgressTracker() {
  const { data: progress } = useQuery({
    queryKey: ["userProgress"],
    queryFn: async () => {
      const progs = await base44.entities.UserProgress.list("-created_date", 1);
      return progs.length > 0 ? progs[0] : {
        total_points: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        activities_completed: 0,
        badges_earned: []
      };
    },
  });

  if (!progress) return null;

  const pointsToNextLevel = progress.level * 100;
  const levelProgress = (progress.total_points % pointsToNextLevel) / pointsToNextLevel * 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
      >
        <Trophy className="w-5 h-5 text-yellow-400 mb-2" />
        <p className="text-2xl font-light text-white/90">{progress.total_points}</p>
        <p className="text-xs text-white/50">Points</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
      >
        <Star className="w-5 h-5 text-purple-400 mb-2" />
        <p className="text-2xl font-light text-white/90">Level {progress.level}</p>
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
      >
        <Flame className="w-5 h-5 text-orange-400 mb-2" />
        <p className="text-2xl font-light text-white/90">{progress.current_streak}</p>
        <p className="text-xs text-white/50">Day Streak</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
      >
        <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
        <p className="text-2xl font-light text-white/90">{progress.activities_completed}</p>
        <p className="text-xs text-white/50">Activities</p>
      </motion.div>
    </div>
  );
}