import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Smile, Meh, Frown, Zap, Battery, X, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOODS = [
  { id: "excellent", label: "Excellent", icon: Smile, color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
  { id: "good", label: "Good", icon: Smile, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  { id: "okay", label: "Okay", icon: Meh, color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  { id: "stressed", label: "Stressed", icon: Zap, color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  { id: "tired", label: "Tired", icon: Battery, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
];

export default function MoodTracker({ activeSounds }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const { data: moodLogs = [] } = useQuery({
    queryKey: ["moodLogs"],
    queryFn: () => base44.entities.MoodLog.list("-created_date", 30),
    initialData: [],
  });

  const logMoodMutation = useMutation({
    mutationFn: (data) => base44.entities.MoodLog.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["moodLogs"] });
      const previous = queryClient.getQueryData(["moodLogs"]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        ...data,
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(["moodLogs"], (old) => [optimistic, ...(old || [])]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(["moodLogs"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["moodLogs"] });
      toast.success("Mood logged successfully");
      setIsOpen(false);
      setSelectedMood(null);
      setNotes("");
      setEnergyLevel(3);
    },
  });

  const handleLogMood = () => {
    if (!selectedMood) return;
    
    logMoodMutation.mutate({
      mood: selectedMood,
      energy_level: energyLevel,
      notes: notes || undefined,
      active_sounds: activeSounds.map(s => s.id),
    });
  };

  const getMoodStats = () => {
    if (moodLogs.length === 0) return null;
    
    const moodCounts = moodLogs.reduce((acc, log) => {
      acc[log.mood] = (acc[log.mood] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const avgEnergy = moodLogs.reduce((sum, log) => sum + (log.energy_level || 0), 0) / moodLogs.length;
    
    return { mostCommon: mostCommon?.[0], avgEnergy: avgEnergy.toFixed(1) };
  };

  const stats = getMoodStats();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-pink-600/10 to-rose-600/10 border-pink-500/20 text-pink-300 hover:bg-pink-600/20"
      >
        <Heart className="w-4 h-4" />
        <span>Mood</span>
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
              className="relative w-full max-w-lg bg-slate-900/95 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-all"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              {!showHistory ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-pink-500/10">
                      <Heart className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-light text-white/90">How are you feeling?</h2>
                      <p className="text-sm text-white/50">Track your wellness journey</p>
                    </div>
                  </div>

                  {/* Mood Selection */}
                  <div className="space-y-3 mb-6">
                    {MOODS.map((mood) => {
                      const Icon = mood.icon;
                      return (
                        <button
                          key={mood.id}
                          onClick={() => setSelectedMood(mood.id)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
                            selectedMood === mood.id
                              ? `${mood.bg} ${mood.border}`
                              : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]"
                          )}
                        >
                          <Icon className={cn("w-6 h-6", selectedMood === mood.id ? mood.color : "text-white/40")} />
                          <span className={cn("font-medium", selectedMood === mood.id ? "text-white/90" : "text-white/60")}>
                            {mood.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Energy Level */}
                  {selectedMood && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-6"
                    >
                      <label className="text-sm text-white/70 mb-2 block">Energy Level</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            onClick={() => setEnergyLevel(level)}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                              energyLevel === level
                                ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                                : "bg-white/[0.06] text-white/50 border border-white/[0.08] hover:bg-white/[0.1]"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Notes */}
                  {selectedMood && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-6"
                    >
                      <label className="text-sm text-white/70 mb-2 block">Notes (optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How are you feeling today?"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                        rows={3}
                      />
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex-1 px-4 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 transition-all flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      History
                    </button>
                    <button
                      onClick={handleLogMood}
                      disabled={!selectedMood || logMoodMutation.isPending}
                      className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {logMoodMutation.isPending ? "Logging..." : "Log Mood"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-all"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-light text-white/90">Mood History</h2>
                      <p className="text-sm text-white/50">Your wellness journey</p>
                    </div>
                  </div>

                  {/* Stats */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                        <p className="text-xs text-white/50 mb-1">Most Common</p>
                        <p className="text-lg text-white/90 capitalize">{stats.mostCommon}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                        <p className="text-xs text-white/50 mb-1">Avg Energy</p>
                        <p className="text-lg text-white/90">{stats.avgEnergy}/5</p>
                      </div>
                    </div>
                  )}

                  {/* History List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {moodLogs.length === 0 ? (
                      <p className="text-center text-white/40 py-8">No mood logs yet</p>
                    ) : (
                      moodLogs.map((log) => {
                        const mood = MOODS.find(m => m.id === log.mood);
                        const Icon = mood?.icon || Heart;
                        return (
                          <div
                            key={log.id}
                            className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("w-5 h-5", mood?.color)} />
                                <span className="text-white/90 capitalize">{log.mood}</span>
                              </div>
                              <span className="text-xs text-white/40">
                                {new Date(log.created_date).toLocaleDateString()}
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-sm text-white/60 mb-2">{log.notes}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-white/40">
                              <span>Energy: {log.energy_level}/5</span>
                              {log.active_sounds?.length > 0 && (
                                <span>• {log.active_sounds.length} sounds active</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}