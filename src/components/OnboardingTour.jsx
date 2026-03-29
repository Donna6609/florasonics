import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS = [
  { id: "better_sleep", label: "Better Sleep", emoji: "🌙", preset: ["rain", "night", "fan"], description: "Drift off with rain, night ambience & fan" },
  { id: "focus", label: "Deep Focus", emoji: "🎯", preset: ["cafe", "fan", "library"], description: "Café noise, fan & library for peak flow" },
  { id: "reduce_stress", label: "Reduce Stress", emoji: "🌿", preset: ["ocean", "birds", "forest"], description: "Ocean waves, birds & forest calm" },
  { id: "meditation", label: "Meditation", emoji: "🧘", preset: ["bowl", "stream", "wind"], description: "Singing bowl, stream & gentle wind" },
  { id: "energy", label: "Boost Energy", emoji: "⚡", preset: ["thunder", "rain", "birds"], description: "Energising storm & morning birds" },
  { id: "just_explore", label: "Just Explore", emoji: "✨", preset: [], description: "I'll find my own perfect mix" },
];

const TOUR_STEPS = [
  { id: "welcome", position: "center" },
  { id: "goal", position: "center" },
  { id: "sounds", target: "[data-tour='sound-mixer']", position: "bottom" },
  { id: "presets", target: "[data-tour='presets']", position: "top" },
  { id: "complete", position: "center" },
];

export default function OnboardingTour({ onComplete, onSkip, onApplyGoalPreset }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [targetRect, setTargetRect] = useState(null);

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (step.target) {
      const updatePosition = () => {
        const element = document.querySelector(step.target);
        if (element) setTargetRect(element.getBoundingClientRect());
      };
      updatePosition();
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    } else {
      setTargetRect(null);
    }
  }, [step]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (selectedGoal && selectedGoal.preset.length > 0 && onApplyGoalPreset) {
        onApplyGoalPreset(selectedGoal.preset);
      }
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const getTooltipStyle = () => {
    if (!targetRect || step.position === "center") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const offset = 20;
    if (step.position === "bottom") {
      return {
        top: `${targetRect.bottom + offset}px`,
        left: `${Math.min(Math.max(targetRect.left + targetRect.width / 2, 200), window.innerWidth - 200)}px`,
        transform: "translateX(-50%)",
      };
    }
    return {
      bottom: `${window.innerHeight - targetRect.top + offset}px`,
      left: `${Math.min(Math.max(targetRect.left + targetRect.width / 2, 200), window.innerWidth - 200)}px`,
      transform: "translateX(-50%)",
    };
  };

  const renderStepContent = () => {
    switch (step.id) {
      case "welcome":
        return (
          <>
            <div className="text-4xl mb-4 text-center">🌿</div>
            <h3 className="text-xl font-semibold text-white/90 mb-2 text-center">Welcome to FloraSonics</h3>
            <p className="text-white/60 text-sm leading-relaxed text-center">
              Your personal nature sound garden. Let's personalise your experience in just a few steps.
            </p>
          </>
        );
      case "goal":
        return (
          <>
            <h3 className="text-xl font-semibold text-white/90 mb-1">What's your main goal?</h3>
            <p className="text-white/50 text-sm mb-4">We'll load the perfect starting soundscape for you.</p>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoal(g)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                    selectedGoal?.id === g.id
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                      : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/80"
                  )}
                >
                  <span className="text-lg">{g.emoji}</span>
                  <span className="text-xs font-semibold">{g.label}</span>
                  <span className="text-[10px] text-white/40 leading-tight">{g.description}</span>
                </button>
              ))}
            </div>
          </>
        );
      case "sounds":
        return (
          <>
            <h3 className="text-xl font-semibold text-white/90 mb-2">Mix Your Sounds</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Tap any plant to activate its sound. Use the volume slider to blend multiple sounds into your perfect mix.
            </p>
          </>
        );
      case "presets":
        return (
          <>
            <h3 className="text-xl font-semibold text-white/90 mb-2">Save & Load Presets</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Save your favourite combinations as presets. Share them with the community or load curated mixes from others.
            </p>
          </>
        );
      case "complete":
        return (
          <>
            <div className="text-4xl mb-4 text-center">
              {selectedGoal ? selectedGoal.emoji : "✨"}
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-2 text-center">You're all set!</h3>
            <p className="text-white/60 text-sm leading-relaxed text-center">
              {selectedGoal?.preset.length > 0
                ? `We'll load your ${selectedGoal.label} soundscape now. You can always change it anytime.`
                : "Your garden is ready. Start exploring and create your perfect soundscape."}
            </p>
          </>
        );
      default:
        return null;
    }
  };

  const canProceed = step.id !== "goal" || selectedGoal !== null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
        onClick={onSkip}
      />

      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[101] pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 4px rgba(52, 211, 153, 0.3), 0 0 0 9999px rgba(0,0,0,0.5)",
            borderRadius: "1rem",
          }}
        />
      )}

      <motion.div
        key={step.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed z-[102] w-full max-w-sm px-4"
        style={getTooltipStyle()}
      >
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-2xl">
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-5">{renderStepContent()}</div>

          <div className="flex items-center gap-1.5 mb-5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === currentStep ? "w-8 bg-emerald-500" : idx < currentStep ? "w-1.5 bg-emerald-500/50" : "w-1.5 bg-white/20"
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button onClick={onSkip} variant="ghost" className="text-white/40 hover:text-white/60 hover:bg-white/5 text-sm">
              Skip
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button onClick={handlePrev} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white disabled:opacity-40"
              >
                {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : (
                  <><span>Next</span><ChevronRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}