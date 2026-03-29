import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, MapPin, Clock, Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NATURE_WALKS = [
  {
    id: "forest_morning",
    name: "Forest Dawn",
    time_of_day: "morning",
    duration: 20,
    goal: "reduce_stress",
    sounds: ["birds", "forest", "wind"],
    waypoints: [
      { name: "Enter forest", description: "Listen to birds greeting the day", time: 0 },
      { name: "Birch grove", description: "Rustling leaves in the breeze", time: 7 },
      { name: "Forest heart", description: "Deep woodland ambience", time: 14 },
      { name: "Return", description: "Gradual return to calm", time: 18 }
    ]
  },
  {
    id: "ocean_evening",
    name: "Coastal Sunset",
    time_of_day: "evening",
    duration: 25,
    goal: "reduce_stress",
    sounds: ["ocean", "birds", "wind"],
    waypoints: [
      { name: "Beach arrival", description: "Gentle waves and seagulls", time: 0 },
      { name: "Shoreline", description: "Waves against sand", time: 8 },
      { name: "Ocean breeze", description: "Deep ocean sounds", time: 16 },
      { name: "Sunset meditation", description: "Peaceful ocean finale", time: 22 }
    ]
  },
  {
    id: "mountain_day",
    name: "Mountain Trail",
    time_of_day: "afternoon",
    duration: 18,
    goal: "increase_focus",
    sounds: ["wind", "birds", "leaves"],
    waypoints: [
      { name: "Trail start", description: "Mountain air and birdsong", time: 0 },
      { name: "Ascent", description: "Wind through trees", time: 6 },
      { name: "Peak view", description: "Expansive sounds of nature", time: 12 },
      { name: "Descent", description: "Grounded and refreshed", time: 16 }
    ]
  },
  {
    id: "garden_focus",
    name: "Zen Garden Walk",
    time_of_day: "anytime",
    duration: 12,
    goal: "adhd_support",
    sounds: ["leaves", "birds", "calm"],
    waypoints: [
      { name: "Garden gate", description: "Enter peaceful space", time: 0 },
      { name: "Stone path", description: "Crunching leaves underfoot", time: 4 },
      { name: "Water feature", description: "Gentle stream sounds", time: 8 },
      { name: "Rest spot", description: "Complete calm", time: 10 }
    ]
  }
];

export default function GuidedNatureWalk({ onSelectWalk, userGoal }) {
  const [selectedWalk, setSelectedWalk] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Filter walks by user goal if provided
  const availableWalks = userGoal 
    ? NATURE_WALKS.filter(w => w.goal === userGoal || w.goal === "anytime")
    : NATURE_WALKS;

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);

      if (selectedWalk) {
        const nextWaypoint = selectedWalk.waypoints.findIndex(
          wp => wp.time > elapsed
        );
        if (nextWaypoint !== -1) {
          setCurrentWaypoint(nextWaypoint);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, selectedWalk, elapsed]);

  const handleStartWalk = (walk) => {
    setSelectedWalk(walk);
    setIsPlaying(true);
    setElapsed(0);
    setCurrentWaypoint(0);
    if (onSelectWalk) {
      onSelectWalk(walk);
    }
  };

  const handleClose = () => {
    setSelectedWalk(null);
    setIsPlaying(false);
    setElapsed(0);
  };

  if (selectedWalk && isPlaying) {
    const progress = (elapsed / (selectedWalk.duration * 60)) * 100;
    const currentPoint = selectedWalk.waypoints[currentWaypoint];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-32 left-4 right-4 bg-gradient-to-br from-emerald-900/90 to-teal-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 z-40"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-emerald-100 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {selectedWalk.name}
              </h3>
              <p className="text-sm text-emerald-300/70 mt-1">{currentPoint?.name}</p>
              <p className="text-xs text-emerald-400/60 mt-1">{currentPoint?.description}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-emerald-300/60 hover:text-emerald-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-emerald-200">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} / {selectedWalk.duration}:00
              </span>
            </div>

            <div className="w-full bg-emerald-950/50 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                className="text-emerald-300 hover:bg-emerald-800/30"
              >
                End
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="space-y-3">
      {availableWalks.map(walk => (
        <motion.button
          key={walk.id}
          onClick={() => handleStartWalk(walk)}
          className="w-full text-left p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-900/50 transition-all group"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-emerald-100 flex items-center gap-2 group-hover:text-emerald-50">
                <Leaf className="w-4 h-4" />
                {walk.name}
              </h4>
              <p className="text-xs text-emerald-400/60 mt-1">
                {walk.time_of_day.charAt(0).toUpperCase() + walk.time_of_day.slice(1)} • {walk.duration} min
              </p>
            </div>
            <Play className="w-4 h-4 text-emerald-500/60 group-hover:text-emerald-400" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}