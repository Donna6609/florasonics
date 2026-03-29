import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, X, Play, Pause, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const EXERCISES = [
  {
    id: "box",
    name: "Box Breathing",
    description: "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s",
    phases: [
      { name: "Inhale", duration: 4000 },
      { name: "Hold", duration: 4000 },
      { name: "Exhale", duration: 4000 },
      { name: "Hold", duration: 4000 },
    ],
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    description: "Inhale 4s, Hold 7s, Exhale 8s",
    phases: [
      { name: "Inhale", duration: 4000 },
      { name: "Hold", duration: 7000 },
      { name: "Exhale", duration: 8000 },
    ],
  },
  {
    id: "calm",
    name: "Calm Breathing",
    description: "Inhale 5s, Exhale 5s",
    phases: [
      { name: "Inhale", duration: 5000 },
      { name: "Exhale", duration: 5000 },
    ],
  },
];

export default function BreathingExercise() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  const { data: downloadedWellness = [] } = useQuery({
    queryKey: ["downloadedWellness"],
    queryFn: () => base44.entities.DownloadedWellnessContent.list("-created_date"),
    initialData: [],
  });

  useEffect(() => {
    if (!isActive || !selectedExercise) return;

    const phase = selectedExercise.phases[currentPhase];
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / phase.duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= phase.duration) {
        setCurrentPhase((prev) => (prev + 1) % selectedExercise.phases.length);
        setProgress(0);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, currentPhase, selectedExercise]);

  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
    setIsActive(true);
    setCurrentPhase(0);
    setProgress(0);
  };

  const handleStop = () => {
    setIsActive(false);
    setSelectedExercise(null);
    setCurrentPhase(0);
    setProgress(0);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-teal-600/10 to-cyan-600/10 border-teal-500/20 text-teal-300 hover:bg-teal-600/20"
      >
        <Wind className="w-4 h-4" />
        <span>Breathe</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => !isActive && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-slate-900/95 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl"
            >
              <button
                onClick={() => {
                  handleStop();
                  setIsOpen(false);
                }}
                aria-label="Close"
                className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-all"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              {!selectedExercise ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-teal-500/10">
                      <Wind className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-light text-white/90">Breathing Exercises</h2>
                      <p className="text-sm text-white/50">Find your calm</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {EXERCISES.map((exercise) => {
                      const isDownloaded = downloadedWellness.some(
                        w => w.content_type === "breathing" && w.content_id === exercise.id
                      );
                      return (
                        <button
                          key={exercise.id}
                          onClick={() => handleStartExercise(exercise)}
                          className="w-full text-left p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-white/90 font-medium">{exercise.name}</p>
                                {isDownloaded && (
                                  <Download className="w-3 h-3 text-green-400" />
                                )}
                              </div>
                              <p className="text-xs text-white/50">{exercise.description}</p>
                            </div>
                            <Play className="w-4 h-4 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-light text-white/90 mb-8">{selectedExercise.name}</h2>

                  {/* Breathing Circle */}
                  <div className="relative w-64 h-64 mx-auto mb-8">
                    <motion.div
                      animate={{
                        scale: selectedExercise.phases[currentPhase].name === "Inhale" ? [1, 1.5] :
                               selectedExercise.phases[currentPhase].name === "Exhale" ? [1.5, 1] : 1.5,
                      }}
                      transition={{
                        duration: selectedExercise.phases[currentPhase].duration / 1000,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 blur-xl"
                    />
                    <div className="absolute inset-0 rounded-full border-4 border-teal-400/30 flex items-center justify-center">
                      <div>
                        <p className="text-3xl font-light text-white/90 mb-2">
                          {selectedExercise.phases[currentPhase].name}
                        </p>
                        <p className="text-sm text-white/50">
                          {Math.ceil((selectedExercise.phases[currentPhase].duration * (100 - progress)) / 100000)}s
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsActive(!isActive)}
                      className="min-h-[44px] px-6 py-3 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 transition-all flex items-center gap-2"
                    >
                      {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isActive ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={handleStop}
                      className="min-h-[44px] px-6 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 transition-all"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}