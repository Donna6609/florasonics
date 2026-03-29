import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function BiometricInsights({ onRecommendation }) {
  const { data: biometricData = [] } = useQuery({
    queryKey: ["biometricData"],
    queryFn: () => base44.entities.BiometricData.list("-created_date", 100),
    initialData: [],
  });

  const { data: moodLogs = [] } = useQuery({
    queryKey: ["moodLogs"],
    queryFn: () => base44.entities.MoodLog.list("-created_date", 30),
    initialData: [],
  });

  const getAverageHeartRate = () => {
    const hrData = biometricData.filter(d => d.data_type === "heart_rate");
    if (hrData.length === 0) return null;
    const avg = hrData.reduce((sum, d) => sum + d.value, 0) / hrData.length;
    return Math.round(avg);
  };

  const getAverageSleep = () => {
    const sleepData = biometricData.filter(d => d.data_type === "sleep");
    if (sleepData.length === 0) return null;
    const avg = sleepData.reduce((sum, d) => sum + d.value, 0) / sleepData.length;
    return avg.toFixed(1);
  };

  const getStressLevel = () => {
    const stressData = biometricData.filter(d => d.data_type === "stress");
    if (stressData.length > 0) {
      return stressData[0].value;
    }
    
    // Infer from HRV and mood
    const hrvData = biometricData.filter(d => d.data_type === "hrv");
    const recentMoods = moodLogs.slice(0, 7);
    const stressedMoods = recentMoods.filter(m => m.mood === "stressed").length;
    
    if (stressedMoods > 3 || (hrvData.length > 0 && hrvData[0].value < 50)) {
      return "high";
    } else if (stressedMoods > 1) {
      return "medium";
    }
    return "low";
  };

  const generateRecommendations = () => {
    const avgHR = getAverageHeartRate();
    const avgSleep = getAverageSleep();
    const stressLevel = getStressLevel();
    const recommendations = [];

    if (avgSleep && parseFloat(avgSleep) < 7) {
      recommendations.push({
        type: "sleep",
        title: "Improve Sleep Quality",
        description: `You're averaging ${avgSleep}h of sleep. Try our sleep meditation before bed.`,
        action: "sleep_meditation",
      });
    }

    if (stressLevel === "high") {
      recommendations.push({
        type: "stress",
        title: "Reduce Stress",
        description: "Your stress levels are elevated. Try breathing exercises.",
        action: "breathing_exercise",
      });
    }

    if (avgHR && avgHR > 80) {
      recommendations.push({
        type: "calm",
        title: "Lower Heart Rate",
        description: "Elevated heart rate detected. Consider a calming soundscape.",
        action: "calm_soundscape",
      });
    }

    return recommendations;
  };

  const avgHR = getAverageHeartRate();
  const avgSleep = getAverageSleep();
  const stressLevel = getStressLevel();
  const recommendations = generateRecommendations();

  if (!avgHR && !avgSleep && !stressLevel) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-light text-white/90">Health Insights</h3>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {avgHR && (
          <div className="p-3 rounded-xl bg-white/[0.04]">
            <p className="text-xs text-white/50 mb-1">Avg Heart Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-light text-white/90">{avgHR}</p>
              <span className="text-xs text-white/40">bpm</span>
            </div>
          </div>
        )}
        {avgSleep && (
          <div className="p-3 rounded-xl bg-white/[0.04]">
            <p className="text-xs text-white/50 mb-1">Avg Sleep</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-light text-white/90">{avgSleep}</p>
              <span className="text-xs text-white/40">hrs</span>
            </div>
          </div>
        )}
        {stressLevel && (
          <div className="p-3 rounded-xl bg-white/[0.04]">
            <p className="text-xs text-white/50 mb-1">Stress Level</p>
            <p className={cn(
              "text-lg font-light capitalize",
              stressLevel === "high" ? "text-red-400" :
              stressLevel === "medium" ? "text-yellow-400" :
              "text-green-400"
            )}>
              {stressLevel}
            </p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Personalized Recommendations</p>
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]"
            >
              <p className="text-white/90 text-sm font-medium mb-1">{rec.title}</p>
              <p className="text-xs text-white/60">{rec.description}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}