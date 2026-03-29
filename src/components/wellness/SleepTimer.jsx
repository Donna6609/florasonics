import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [15, 30, 45, 60, 90];

export default function SleepTimer({ onTimerEnd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startTimer = (minutes) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTotalMinutes(minutes);
    setMinutesLeft(minutes * 60); // store seconds
    setIsOpen(false);

    intervalRef.current = setInterval(() => {
      setMinutesLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (onTimerEnd) onTimerEnd();
          setMinutesLeft(null);
          setTotalMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMinutesLeft(null);
    setTotalMinutes(null);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = minutesLeft !== null && totalMinutes
    ? ((totalMinutes * 60 - minutesLeft) / (totalMinutes * 60)) * 100
    : 0;

  return (
    <div className="relative">
      <button
        onClick={() => minutesLeft !== null ? cancelTimer() : setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium",
          minutesLeft !== null
            ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
            : "bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
        )}
      >
        <Moon className="w-4 h-4" />
        {minutesLeft !== null ? (
          <span>{formatTime(minutesLeft)}</span>
        ) : (
          <span>Sleep Timer</span>
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
              className="absolute bottom-full mb-3 left-0 w-64 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl z-50 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white/90">Sleep Timer</h3>
              </div>
              <p className="text-xs text-white/40 mb-4">Sounds fade out after your chosen time</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((min) => (
                  <button
                    key={min}
                    onClick={() => startTimer(min)}
                    className="py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-all"
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}