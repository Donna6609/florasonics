import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIMER_OPTIONS = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "45m", minutes: 45 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
];

export default function TimerControl({ onTimerEnd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [selectedMinutes, setSelectedMinutes] = useState(null);

  const startTimer = useCallback((minutes) => {
    setSelectedMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsOpen(false);
  }, []);

  const cancelTimer = useCallback(() => {
    setSelectedMinutes(null);
    setRemainingSeconds(null);
  }, []);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSelectedMinutes(null);
          onTimerEnd?.();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, onTimerEnd]);

  const formatTime = (seconds) => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => (remainingSeconds ? cancelTimer() : setIsOpen(!isOpen))}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300",
          "border backdrop-blur-xl text-sm font-medium",
          remainingSeconds
            ? "bg-violet-500/20 border-violet-400/30 text-violet-300"
            : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
        )}
      >
        {remainingSeconds ? (
          <>
            <Timer className="w-4 h-4" />
            <span className="tabular-nums">{formatTime(remainingSeconds)}</span>
            <X className="w-3.5 h-3.5 ml-1 opacity-60" />
          </>
        ) : (
          <>
            <Timer className="w-4 h-4" />
            <span>Sleep Timer</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl"
          >
            {TIMER_OPTIONS.map((opt) => (
              <Button
                key={opt.minutes}
                variant="ghost"
                size="sm"
                onClick={() => startTimer(opt.minutes)}
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl px-3 text-xs font-medium"
              >
                {opt.label}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}