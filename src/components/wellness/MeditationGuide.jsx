import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Play, Pause, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const MEDITATIONS = [
  {
    id: "body_scan",
    name: "Body Scan",
    duration: 10,
    description: "Progressive relaxation through body awareness",
    steps: [
      "Close your eyes and take three deep breaths",
      "Focus on your feet. Notice any sensations",
      "Move attention to your legs. Release any tension",
      "Notice your torso and chest. Breathe naturally",
      "Relax your shoulders and arms",
      "Release tension in your neck and jaw",
      "Soften your face and forehead",
      "Scan your entire body one last time",
      "Take three deep breaths and slowly open your eyes",
    ],
  },
  {
    id: "mindfulness",
    name: "Mindfulness Meditation",
    duration: 15,
    description: "Present moment awareness",
    steps: [
      "Sit comfortably with your spine straight",
      "Close your eyes and breathe naturally",
      "Notice the sensation of your breath",
      "When thoughts arise, acknowledge them",
      "Gently return focus to your breath",
      "Observe sensations without judgment",
      "Rest in this present awareness",
      "Slowly bring movement back to your body",
      "Open your eyes when ready",
    ],
  },
  {
    id: "loving_kindness",
    name: "Loving Kindness",
    duration: 12,
    description: "Cultivate compassion and goodwill",
    steps: [
      "Sit comfortably and close your eyes",
      "Think of yourself. Say: 'May I be happy'",
      "'May I be healthy and strong'",
      "'May I be safe and protected'",
      "Now think of a loved one",
      "Extend these wishes to them",
      "Extend to someone neutral",
      "Finally, extend to all beings",
      "Rest in this feeling of warmth",
    ],
  },
];

export default function MeditationGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const { data: downloadedWellness = [] } = useQuery({
    queryKey: ["downloadedWellness"],
    queryFn: () => base44.entities.DownloadedWellnessContent.list("-created_date"),
    initialData: [],
  });

  useEffect(() => {
    if (!isActive || !selectedMeditation) return;

    const totalSteps = selectedMeditation.steps.length;
    const stepDuration = (selectedMeditation.duration * 60 * 1000) / totalSteps;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentStepCalc = Math.floor(elapsed / stepDuration);
      const progress = ((elapsed % stepDuration) / stepDuration) * 100;

      if (currentStepCalc >= totalSteps) {
        setIsActive(false);
        setCurrentStep(0);
        setStepProgress(0);
      } else {
        setCurrentStep(currentStepCalc);
        setStepProgress(progress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, selectedMeditation]);

  const handleStart = (meditation) => {
    setSelectedMeditation(meditation);
    setIsActive(true);
    setCurrentStep(0);
    setStepProgress(0);
  };

  const handleStop = () => {
    setIsActive(false);
    setSelectedMeditation(null);
    setCurrentStep(0);
    setStepProgress(0);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/20 text-purple-300 hover:bg-purple-600/20"
      >
        <Sparkles className="w-4 h-4" />
        <span>Meditate</span>
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
              className="relative w-full max-w-lg bg-slate-900/95 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl"
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

              {!selectedMeditation ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-purple-500/10">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-light text-white/90">Guided Meditation</h2>
                      <p className="text-sm text-white/50">Find inner peace</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {MEDITATIONS.map((meditation) => {
                      const isDownloaded = downloadedWellness.some(
                        w => w.content_type === "meditation" && w.content_id === meditation.id
                      );
                      return (
                        <button
                          key={meditation.id}
                          onClick={() => handleStart(meditation)}
                          className="w-full text-left p-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-white/90 font-medium">{meditation.name}</p>
                                {isDownloaded && (
                                  <Download className="w-3 h-3 text-green-400" />
                                )}
                              </div>
                              <p className="text-xs text-white/50 mb-2">{meditation.description}</p>
                              <span className="text-xs text-purple-400">{meditation.duration} min</span>
                            </div>
                            <Play className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-light text-white/90 mb-2">{selectedMeditation.name}</h2>
                  <p className="text-sm text-white/50 mb-8">{selectedMeditation.duration} minutes</p>

                  {/* Progress */}
                  <div className="mb-8">
                    <div className="flex justify-between text-xs text-white/40 mb-2">
                      <span>Step {currentStep + 1} of {selectedMeditation.steps.length}</span>
                      <span>{Math.round((currentStep / selectedMeditation.steps.length) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + stepProgress / 100) / selectedMeditation.steps.length) * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Current Step */}
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="min-h-32 flex items-center justify-center mb-8"
                  >
                    <p className="text-lg text-white/80 leading-relaxed">
                      {selectedMeditation.steps[currentStep]}
                    </p>
                  </motion.div>

                  {/* Controls */}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsActive(!isActive)}
                      className="min-h-[44px] px-6 py-3 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 transition-all flex items-center gap-2"
                    >
                      {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isActive ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={handleStop}
                      className="min-h-[44px] px-6 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 transition-all"
                    >
                      End Session
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