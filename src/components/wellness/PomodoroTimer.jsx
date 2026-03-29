import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

export default function PomodoroTimer({ onTimerEnd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer completed
          if (isBreak) {
            // Break ended, start work session
            setIsBreak(false);
            setIsActive(false);
            return WORK_DURATION;
          } else {
            // Work session ended
            setCompletedPomodoros((p) => p + 1);
            setIsBreak(true);
            setIsActive(false);
            if (onTimerEnd) onTimerEnd();
            return BREAK_DURATION;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isBreak, onTimerEnd]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? BREAK_DURATION : WORK_DURATION);
  };

  const handleSkip = () => {
    setIsActive(false);
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(WORK_DURATION);
    } else {
      setIsBreak(true);
      setTimeLeft(BREAK_DURATION);
    }
  };

  const progress = isBreak
    ? ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100
    : ((WORK_DURATION - timeLeft) / WORK_DURATION) * 100;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium",
          isActive
            ? isBreak
              ? "bg-green-500/20 border-green-500/30 text-green-300"
              : "bg-orange-500/20 border-orange-500/30 text-orange-300"
            : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
        )}
      >
        <Timer className="w-4 h-4" />
        {isActive ? (
          <>
            <span>{formatTime(timeLeft)}</span>
            {isBreak && <Coffee className="w-3 h-3" />}
          </>
        ) : (
          <span>Pomodoro</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute bottom-full mb-3 right-0 w-80 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl z-50 p-6"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                  {isBreak ? (
                    <>
                      <Coffee className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-medium text-white/90">Break Time</h3>
                    </>
                  ) : (
                    <>
                      <Timer className="w-5 h-5 text-orange-400" />
                      <h3 className="text-lg font-medium text-white/90">Focus Time</h3>
                    </>
                  )}
                </div>

                {/* Circular Progress */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                      className={cn(
                        "transition-all duration-300",
                        isBreak ? "text-green-400" : "text-orange-400"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-light text-white/90 mb-1">
                      {formatTime(timeLeft)}
                    </p>
                    <p className="text-xs text-white/40 uppercase tracking-wide">
                      {isBreak ? "Break" : "Focus"}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-6 text-center">
                  <div>
                    <p className="text-2xl font-light text-white/90">{completedPomodoros}</p>
                    <p className="text-xs text-white/40">Completed</p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <p className="text-2xl font-light text-white/90">
                      {Math.round((completedPomodoros * 25) / 60)}h
                    </p>
                    <p className="text-xs text-white/40">Total</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setIsActive(!isActive)}
                    aria-label={isActive ? "Pause timer" : "Start timer"}
                    className={cn(
                      "min-w-[44px] min-h-[44px] p-3 rounded-full transition-all",
                      isBreak
                        ? "bg-green-500/20 hover:bg-green-500/30 text-green-300"
                        : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300"
                    )}
                  >
                    {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleReset}
                    aria-label="Reset timer"
                    className="min-w-[44px] min-h-[44px] p-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white/70 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSkip}
                    aria-label="Skip to next phase"
                    className="min-w-[44px] min-h-[44px] px-4 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-sm transition-all"
                  >
                    Skip
                  </button>
                </div>

                <p className="text-xs text-white/30 mt-4">
                  {isBreak ? "Take a break, you earned it!" : "Stay focused, you got this!"}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}