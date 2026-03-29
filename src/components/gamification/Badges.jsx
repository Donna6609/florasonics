import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const AVAILABLE_BADGES = [
  { id: "first_meditation", name: "First Steps", description: "Complete your first meditation", icon: "🧘", points: 10 },
  { id: "week_streak", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", points: 50 },
  { id: "early_bird", name: "Early Bird", description: "Complete 5 morning activities", icon: "🌅", points: 25 },
  { id: "night_owl", name: "Night Owl", description: "Complete 5 evening activities", icon: "🦉", points: 25 },
  { id: "meditation_master", name: "Meditation Master", description: "Complete 50 meditations", icon: "🏆", points: 100 },
  { id: "breathing_pro", name: "Breathing Pro", description: "Complete 30 breathing exercises", icon: "💨", points: 75 },
  { id: "goal_achiever", name: "Goal Achiever", description: "Complete your first wellness goal", icon: "🎯", points: 50 },
  { id: "challenge_champion", name: "Challenge Champion", description: "Complete 5 challenges", icon: "👑", points: 150 },
  { id: "centurion", name: "Centurion", description: "Earn 100 total points", icon: "💯", points: 0 },
  { id: "social_butterfly", name: "Social Butterfly", description: "Join 3 challenges", icon: "🦋", points: 30 },
];

export default function Badges() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: progress } = useQuery({
    queryKey: ["userProgress"],
    queryFn: async () => {
      const progs = await base44.entities.UserProgress.list("-created_date", 1);
      return progs.length > 0 ? progs[0] : { badges_earned: [] };
    },
  });

  const earnedBadges = AVAILABLE_BADGES.filter(b => 
    progress?.badges_earned?.includes(b.id)
  );

  const lockedBadges = AVAILABLE_BADGES.filter(b => 
    !progress?.badges_earned?.includes(b.id)
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/20 text-purple-300 hover:bg-purple-600/20"
      >
        <Award className="w-4 h-4" />
        <span>Badges</span>
        {earnedBadges.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-xs">
            {earnedBadges.length}
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
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white/90">Badges</h2>
                  <p className="text-sm text-white/50">
                    {earnedBadges.length} of {AVAILABLE_BADGES.length} earned
                  </p>
                </div>
              </div>

              {/* Earned Badges */}
              {earnedBadges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm text-white/50 mb-3">Earned</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {earnedBadges.map((badge) => (
                      <motion.div
                        key={badge.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-center"
                      >
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <p className="text-white/90 font-medium text-sm mb-1">{badge.name}</p>
                        <p className="text-xs text-white/50">{badge.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Badges */}
              <div>
                <h3 className="text-sm text-white/50 mb-3">Locked</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {lockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                      <div className="relative">
                        <div className="text-4xl mb-2 opacity-30">{badge.icon}</div>
                        <Lock className="w-3 h-3 text-white/30 mx-auto mb-2" />
                        <p className="text-white/50 font-medium text-sm mb-1">{badge.name}</p>
                        <p className="text-xs text-white/30">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}