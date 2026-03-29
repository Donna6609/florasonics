import React, { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Clock, Brain, Zap, Moon, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const JOURNEY_PRESETS = [
  {
    id: "sunrise_calm",
    name: "Sunrise Calm",
    icon: Leaf,
    goal: "reduce_stress",
    time: "morning",
    duration: 15,
    description: "Start your day with gentle nature sounds and breathing",
    sounds: ["birds", "forest", "calm"],
  },
  {
    id: "afternoon_focus",
    name: "Focus Flow",
    icon: Brain,
    goal: "increase_focus",
    time: "afternoon",
    duration: 20,
    description: "Stay sharp with energizing soundscapes and nature",
    sounds: ["wind", "leaves", "forest"],
  },
  {
    id: "evening_wind_down",
    name: "Evening Unwind",
    icon: Moon,
    goal: "reduce_stress",
    time: "evening",
    duration: 25,
    description: "Transition to night with calming soundscapes",
    sounds: ["ocean", "rain", "calm"],
  },
  {
    id: "adhd_focus",
    name: "ADHD Flow",
    icon: Zap,
    goal: "adhd_support",
    time: "anytime",
    duration: 10,
    description: "Short, structured sessions to help maintain focus",
    sounds: ["rain", "coffee", "fan"],
  },
  {
    id: "sleep_prep",
    name: "Sleep Deep",
    icon: Moon,
    goal: "better_sleep",
    time: "night",
    duration: 30,
    description: "Wind down for restful sleep with soothing sounds",
    sounds: ["rain", "night", "calm"],
  },
  {
    id: "energy_boost",
    name: "Energy Surge",
    icon: Zap,
    goal: "boost_energy",
    time: "morning",
    duration: 15,
    description: "Wake up refreshed with uplifting nature and rhythms",
    sounds: ["birds", "wind", "stream"],
  },
];

export default function JourneySelector({ onSelectJourney, userGoal }) {
  const [selectedGoal, setSelectedGoal] = useState(userGoal || null);

  const filtered = selectedGoal
    ? JOURNEY_PRESETS.filter(j => j.goal === selectedGoal || !selectedGoal)
    : JOURNEY_PRESETS;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setSelectedGoal(null)}
          variant={!selectedGoal ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          All Journeys
        </Button>
        {["reduce_stress", "increase_focus", "better_sleep", "boost_energy", "adhd_support"].map(goal => (
          <Button
            key={goal}
            onClick={() => setSelectedGoal(goal)}
            variant={selectedGoal === goal ? "default" : "outline"}
            size="sm"
            className="text-xs"
          >
            {goal.replace(/_/g, " ").replace("adhd", "ADHD")}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((journey, idx) => {
          const Icon = journey.icon;
          return (
            <motion.button
              key={journey.id}
              onClick={() => onSelectJourney && onSelectJourney(journey)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="text-left p-4 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.2] transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                  {journey.duration}m
                </span>
              </div>
              <h4 className="font-semibold text-white/90 mb-1">{journey.name}</h4>
              <p className="text-xs text-white/50 mb-3">{journey.description}</p>
              <div className="flex gap-1 flex-wrap">
                {journey.sounds.slice(0, 2).map(sound => (
                  <span key={sound} className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded">
                    {sound}
                  </span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}