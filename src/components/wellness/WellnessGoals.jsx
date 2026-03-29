import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Moon, Zap, Brain, Battery, Sparkles, X, Plus, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GOAL_TYPES = [
  { 
    id: "better_sleep", 
    label: "Better Sleep", 
    icon: Moon, 
    color: "text-indigo-400", 
    bg: "bg-indigo-500/20", 
    border: "border-indigo-500/30",
    description: "Improve sleep quality and establish healthy sleep patterns"
  },
  { 
    id: "reduce_stress", 
    label: "Reduce Stress", 
    icon: Sparkles, 
    color: "text-purple-400", 
    bg: "bg-purple-500/20", 
    border: "border-purple-500/30",
    description: "Lower stress levels and find inner calm"
  },
  { 
    id: "increase_focus", 
    label: "Increase Focus", 
    icon: Brain, 
    color: "text-cyan-400", 
    bg: "bg-cyan-500/20", 
    border: "border-cyan-500/30",
    description: "Enhance concentration and productivity"
  },
  { 
    id: "boost_energy", 
    label: "Boost Energy", 
    icon: Zap, 
    color: "text-yellow-400", 
    bg: "bg-yellow-500/20", 
    border: "border-yellow-500/30",
    description: "Increase vitality and daily energy levels"
  },
  { 
    id: "mindfulness", 
    label: "Mindfulness", 
    icon: Battery, 
    color: "text-teal-400", 
    bg: "bg-teal-500/20", 
    border: "border-teal-500/30",
    description: "Cultivate present moment awareness"
  },
];

export default function WellnessGoals() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedGoalType, setSelectedGoalType] = useState(null);
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ["wellnessGoals"],
    queryFn: () => base44.entities.WellnessGoal.list("-created_date"),
    initialData: [],
  });

  const addGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.WellnessGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellnessGoals"] });
      toast.success("Goal added successfully");
      setShowAddGoal(false);
      setSelectedGoalType(null);
      setTargetDate("");
      setNotes("");
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WellnessGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellnessGoals"] });
      toast.success("Goal updated");
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.WellnessGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellnessGoals"] });
      toast.success("Goal removed");
    },
  });

  const handleAddGoal = () => {
    if (!selectedGoalType) return;

    addGoalMutation.mutate({
      goal_type: selectedGoalType,
      status: "active",
      target_date: targetDate || undefined,
      notes: notes || undefined,
      progress: 0,
    });
  };

  const toggleGoalStatus = (goal) => {
    const newStatus = goal.status === "active" ? "completed" : "active";
    updateGoalMutation.mutate({
      id: goal.id,
      data: { ...goal, status: newStatus, progress: newStatus === "completed" ? 100 : goal.progress },
    });
  };

  const activeGoals = goals.filter(g => g.status === "active");

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-violet-600/10 to-purple-600/10 border-violet-500/20 text-violet-300 hover:bg-violet-600/20"
      >
        <Target className="w-4 h-4" />
        <span>Goals</span>
        {activeGoals.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-xs">{activeGoals.length}</span>
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
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Target className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white/90">Wellness Goals</h2>
                  <p className="text-sm text-white/50">Set and track your wellness journey</p>
                </div>
              </div>

              {!showAddGoal ? (
                <>
                  {/* Active Goals */}
                  {activeGoals.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm text-white/50 mb-3">Active Goals</h3>
                      <div className="space-y-3">
                        {activeGoals.map((goal) => {
                          const goalType = GOAL_TYPES.find(t => t.id === goal.goal_type);
                          const Icon = goalType?.icon || Target;
                          return (
                            <div
                              key={goal.id}
                              className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3">
                                  <Icon className={cn("w-5 h-5 mt-0.5", goalType?.color)} />
                                  <div>
                                    <p className="text-white/90 font-medium">{goalType?.label}</p>
                                    <p className="text-xs text-white/50">{goalType?.description}</p>
                                    {goal.notes && (
                                      <p className="text-sm text-white/60 mt-1">{goal.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleGoalStatus(goal)}
                                    className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteGoalMutation.mutate(goal.id)}
                                    className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/70 transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {goal.target_date && (
                                <p className="text-xs text-white/40">
                                  Target: {new Date(goal.target_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed Goals */}
                  {goals.filter(g => g.status === "completed").length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm text-white/50 mb-3">Completed Goals</h3>
                      <div className="space-y-2">
                        {goals.filter(g => g.status === "completed").map((goal) => {
                          const goalType = GOAL_TYPES.find(t => t.id === goal.goal_type);
                          const Icon = goalType?.icon || Target;
                          return (
                            <div
                              key={goal.id}
                              className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn("w-4 h-4", goalType?.color)} />
                                <span className="text-white/60 text-sm">{goalType?.label}</span>
                              </div>
                              <button
                                onClick={() => deleteGoalMutation.mutate(goal.id)}
                                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/70 transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowAddGoal(true)}
                    className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Goal
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm text-white/70 mb-3">Choose a goal</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {GOAL_TYPES.map((goalType) => {
                        const Icon = goalType.icon;
                        return (
                          <button
                            key={goalType.id}
                            onClick={() => setSelectedGoalType(goalType.id)}
                            className={cn(
                              "text-left p-4 rounded-2xl border transition-all",
                              selectedGoalType === goalType.id
                                ? `${goalType.bg} ${goalType.border}`
                                : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className={cn("w-5 h-5 mt-0.5", selectedGoalType === goalType.id ? goalType.color : "text-white/40")} />
                              <div>
                                <p className={cn("font-medium mb-1", selectedGoalType === goalType.id ? "text-white/90" : "text-white/60")}>
                                  {goalType.label}
                                </p>
                                <p className="text-xs text-white/40">{goalType.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedGoalType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 mb-6"
                    >
                      <div>
                        <label className="text-sm text-white/70 mb-2 block">Target Date (optional)</label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/90 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/70 mb-2 block">Notes (optional)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="What motivates you to achieve this goal?"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                          rows={3}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddGoal(false);
                        setSelectedGoalType(null);
                        setTargetDate("");
                        setNotes("");
                      }}
                      className="flex-1 px-4 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGoal}
                      disabled={!selectedGoalType || addGoalMutation.isPending}
                      className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addGoalMutation.isPending ? "Adding..." : "Add Goal"}
                    </button>
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