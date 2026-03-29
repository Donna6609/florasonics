import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Trophy, Calendar, Users, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Challenges() {
  const [isOpen, setIsOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: challenges = [] } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => base44.entities.Challenge.list("-created_date"),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challenge) => {
      await base44.entities.Challenge.update(challenge.id, {
        ...challenge,
        participants: [...(challenge.participants || []), user.email],
      });
    },
    onMutate: async (challenge) => {
      await queryClient.cancelQueries({ queryKey: ["challenges"] });
      const previous = queryClient.getQueryData(["challenges"]);
      queryClient.setQueryData(["challenges"], (old) =>
        (old || []).map((c) =>
          c.id === challenge.id
            ? { ...c, participants: [...(c.participants || []), user.email] }
            : c
        )
      );
      return { previous };
    },
    onError: (_err, _challenge, context) => {
      queryClient.setQueryData(["challenges"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Challenge joined!");
    },
  });

  const activeChallenges = challenges.filter(c => {
    const endDate = new Date(c.end_date);
    return endDate > new Date();
  });

  const myChallenges = activeChallenges.filter(c => 
    c.participants?.includes(user?.email)
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-amber-600/10 to-yellow-600/10 border-amber-500/20 text-amber-300 hover:bg-amber-600/20"
      >
        <Zap className="w-4 h-4" />
        <span>Challenges</span>
        {myChallenges.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-xs">
            {myChallenges.length}
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
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white/90">Challenges</h2>
                  <p className="text-sm text-white/50">Join and compete with others</p>
                </div>
              </div>

              {/* My Challenges */}
              {myChallenges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm text-white/50 mb-3">My Active Challenges</h3>
                  <div className="space-y-3">
                    {myChallenges.map((challenge) => {
                      const isCompleted = challenge.completions?.some(c => c.user_email === user?.email);
                      return (
                        <div
                          key={challenge.id}
                          className={cn(
                            "p-4 rounded-2xl border",
                            isCompleted 
                              ? "bg-green-500/10 border-green-500/20"
                              : "bg-white/[0.04] border-white/[0.08]"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-white/90 font-medium">{challenge.title}</p>
                                {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                              </div>
                              <p className="text-xs text-white/50">{challenge.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-amber-400">
                              <Trophy className="w-3 h-3" />
                              {challenge.points_reward}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-2">
                            <span className="capitalize">{challenge.type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {challenge.participants?.length || 0}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Ends {new Date(challenge.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Challenges */}
              <div>
                <h3 className="text-sm text-white/50 mb-3">Available Challenges</h3>
                <div className="space-y-3">
                  {activeChallenges
                    .filter(c => !c.participants?.includes(user?.email))
                    .map((challenge) => (
                      <div
                        key={challenge.id}
                        className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white/90 font-medium mb-1">{challenge.title}</p>
                            <p className="text-xs text-white/50">{challenge.description}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-amber-400">
                            <Trophy className="w-3 h-3" />
                            {challenge.points_reward}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span className="capitalize">{challenge.type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {challenge.participants?.length || 0}
                            </span>
                          </div>
                          <button
                            onClick={() => joinChallengeMutation.mutate(challenge)}
                            disabled={joinChallengeMutation.isPending}
                            className="px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs transition-all"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    ))}
                  {activeChallenges.filter(c => !c.participants?.includes(user?.email)).length === 0 && (
                    <p className="text-center text-white/40 py-8">No new challenges available</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}