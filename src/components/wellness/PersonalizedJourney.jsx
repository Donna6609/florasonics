import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, X, Sparkles, Loader2, Play, Wind, Brain, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PersonalizedJourney({ onStartActivity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [journey, setJourney] = useState(null);

  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ["wellnessGoals"],
    queryFn: () => base44.entities.WellnessGoal.list("-created_date"),
    initialData: [],
  });

  const { data: moodLogs = [] } = useQuery({
    queryKey: ["moodLogs"],
    queryFn: () => base44.entities.MoodLog.list("-created_date", 30),
    initialData: [],
  });

  const { data: journeys = [] } = useQuery({
    queryKey: ["wellnessJourneys"],
    queryFn: () => base44.entities.WellnessJourney.list("-created_date", 1),
    initialData: [],
  });

  const createJourneyMutation = useMutation({
    mutationFn: (data) => base44.entities.WellnessJourney.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellnessJourneys"] });
      toast.success("Journey created!");
    },
  });

  const generatePersonalizedJourney = async () => {
    if (goals.filter(g => g.status === "active").length === 0) {
      toast.error("Please set at least one wellness goal first");
      return;
    }

    setIsGenerating(true);

    try {
      const activeGoals = goals.filter(g => g.status === "active");
      const recentMoods = moodLogs.slice(0, 7);

      const moodSummary = recentMoods.length > 0
        ? `Recent mood pattern: ${recentMoods.map(m => m.mood).join(", ")}`
        : "No mood data available";

      const goalsList = activeGoals.map(g => g.goal_type).join(", ");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a personalized wellness journey for someone with these goals: ${goalsList}.
        
${moodSummary}

Create a daily routine with 3-5 activities from these types:
- meditation (specify which: body_scan, mindfulness, or loving_kindness)
- breathing (specify which: box, 478, or calm)
- soundscape (suggest sound combinations like rain+forest for sleep, cafe+stream for focus)
- pomodoro (for focus goals)

For each activity, specify:
- type (meditation, breathing, soundscape, pomodoro)
- duration in minutes
- time_of_day (morning, afternoon, evening, or night)
- details object with specifics (meditation_type, breathing_type, or sound_ids array)

Also provide a personalized message (ai_recommendations) explaining why this journey will help them.

Return JSON matching this schema exactly.`,
        response_json_schema: {
          type: "object",
          properties: {
            journey_name: { type: "string" },
            daily_activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["meditation", "breathing", "soundscape", "pomodoro"] },
                  duration: { type: "number" },
                  time_of_day: { type: "string", enum: ["morning", "afternoon", "evening", "night"] },
                  details: { type: "object" },
                },
              },
            },
            ai_recommendations: { type: "string" },
          },
        },
      });

      const journeyData = {
        journey_name: result.journey_name,
        goal_type: activeGoals[0].goal_type,
        daily_activities: result.daily_activities,
        ai_recommendations: result.ai_recommendations,
        completed_days: [],
      };

      await createJourneyMutation.mutateAsync(journeyData);
      setJourney(journeyData);
    } catch (error) {
      toast.error("Failed to generate journey");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentJourney = journeys[0] || journey;

  const getActivityIcon = (type) => {
    switch (type) {
      case "meditation": return Sparkles;
      case "breathing": return Wind;
      case "soundscape": return Brain;
      case "pomodoro": return Clock;
      default: return Play;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-600/20"
      >
        <Compass className="w-4 h-4" />
        <span>My Journey</span>
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
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Compass className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white/90">Your Wellness Journey</h2>
                  <p className="text-sm text-white/50">Personalized for your goals</p>
                </div>
              </div>

              {!currentJourney ? (
                <div className="text-center py-12">
                  <Compass className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
                  <h3 className="text-xl text-white/80 mb-2">Start Your Journey</h3>
                  <p className="text-white/50 mb-6 max-w-md mx-auto">
                    Get a personalized wellness program based on your goals and mood patterns
                  </p>
                  <button
                    onClick={generatePersonalizedJourney}
                    disabled={isGenerating}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate My Journey
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl text-white/90 mb-2">{currentJourney.journey_name}</h3>
                    <p className="text-sm text-white/60">{currentJourney.ai_recommendations}</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm text-white/50">Daily Activities</h4>
                    {["morning", "afternoon", "evening", "night"].map((timeOfDay) => {
                      const activities = currentJourney.daily_activities.filter(
                        a => a.time_of_day === timeOfDay
                      );
                      if (activities.length === 0) return null;

                      return (
                        <div key={timeOfDay}>
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{timeOfDay}</p>
                          <div className="space-y-2">
                            {activities.map((activity, idx) => {
                              const Icon = getActivityIcon(activity.type);
                              return (
                                <div
                                  key={idx}
                                  className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5 text-emerald-400" />
                                    <div>
                                      <p className="text-white/90 capitalize">{activity.type}</p>
                                      <p className="text-xs text-white/50">
                                        {activity.duration} minutes
                                        {activity.details?.meditation_type && ` • ${activity.details.meditation_type}`}
                                        {activity.details?.breathing_type && ` • ${activity.details.breathing_type}`}
                                        {activity.details?.sound_ids && ` • ${activity.details.sound_ids.join(", ")}`}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (onStartActivity) {
                                        onStartActivity(activity);
                                      }
                                      toast.success(`Starting ${activity.type} session`);
                                    }}
                                    className="p-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-all"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={generatePersonalizedJourney}
                    disabled={isGenerating}
                    className="w-full px-4 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Regenerate Journey
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}