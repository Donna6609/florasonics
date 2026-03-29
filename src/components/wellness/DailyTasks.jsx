import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ListTodo, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const DEFAULT_TASKS = [
  { id: "morning_sounds", label: "Play morning soundscape", emoji: "🌅", points: 10 },
  { id: "breathing", label: "5-min breathing exercise", emoji: "🌬️", points: 15 },
  { id: "pomodoro", label: "Complete a Pomodoro session", emoji: "🍅", points: 20 },
  { id: "meditation", label: "5-min guided meditation", emoji: "🧘", points: 15 },
  { id: "mood_log", label: "Log your mood today", emoji: "💭", points: 10 },
  { id: "journal", label: "Write a nature journal entry", emoji: "📓", points: 20 },
];

export default function DailyTasks({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [generating, setGenerating] = useState(false);

  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // Load completed tasks from localStorage
    const stored = localStorage.getItem(`floratasks_${todayKey}`);
    if (stored) {
      setCompletedToday(JSON.parse(stored));
    }
    generateTasks();
  }, [currentUser]);

  const generateTasks = async () => {
    setGenerating(true);
    const vibes = currentUser?.sound_vibes || [];
    const goals = currentUser?.wellness_goals || [];

    let taskList = [...DEFAULT_TASKS];

    if (vibes.includes("focus") || goals.includes("increase_focus")) {
      taskList = taskList.map(t => t.id === "pomodoro" ? { ...t, label: "Complete 2 Pomodoro sessions", points: 30 } : t);
    }
    if (vibes.includes("sleep") || goals.includes("better_sleep")) {
      taskList.push({ id: "evening_sounds", label: "Play evening wind-down sounds", emoji: "🌙", points: 15 });
    }
    if (vibes.includes("meditation") || goals.includes("mindfulness")) {
      taskList = taskList.map(t => t.id === "meditation" ? { ...t, label: "Complete a 10-min AI meditation", points: 25 } : t);
    }

    setTasks(taskList.slice(0, 6));
    setGenerating(false);
  };

  const toggleTask = async (taskId) => {
    const isCompleted = completedToday.includes(taskId);
    let updated;
    if (isCompleted) {
      updated = completedToday.filter(id => id !== taskId);
    } else {
      updated = [...completedToday, taskId];
      const task = tasks.find(t => t.id === taskId);
      if (task) toast.success(`+${task.points} pts — ${task.label}`);
      // Track in ActivityCompletion
      base44.entities.ActivityCompletion.create({
        activity_type: "mood_log",
        activity_id: taskId,
        points_earned: task?.points || 10,
        completion_date: new Date().toISOString(),
      }).catch(() => {});
    }
    setCompletedToday(updated);
    localStorage.setItem(`floratasks_${todayKey}`, JSON.stringify(updated));
  };

  const completedCount = completedToday.length;
  const totalPoints = tasks
    .filter(t => completedToday.includes(t.id))
    .reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium",
          completedCount > 0
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
        )}
      >
        <ListTodo className="w-4 h-4" />
        <span>Daily Tasks</span>
        {completedCount > 0 && (
          <span className="text-xs bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full">
            {completedCount}/{tasks.length}
          </span>
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
              className="absolute bottom-full mb-3 left-0 w-80 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl z-50 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white/90">Today's Tasks</h3>
                  <p className="text-xs text-white/40">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">{totalPoints}</p>
                  <p className="text-xs text-white/40">points</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="space-y-2">
                {tasks.map((task) => {
                  const done = completedToday.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                        done ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.04] border border-transparent hover:bg-white/[0.07]"
                      )}
                    >
                      {done
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        : <Circle className="w-4 h-4 text-white/30 shrink-0" />
                      }
                      <span className="text-sm">{task.emoji}</span>
                      <span className={cn("text-sm flex-1", done ? "text-white/50 line-through" : "text-white/80")}>{task.label}</span>
                      <span className="text-xs text-white/30">+{task.points}</span>
                    </button>
                  );
                })}
              </div>

              {completedCount === tasks.length && tasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center"
                >
                  <p className="text-emerald-400 font-semibold text-sm">🎉 All tasks complete!</p>
                  <p className="text-white/50 text-xs mt-0.5">Amazing work today, keep it up!</p>
                </motion.div>
              )}

              <button
                onClick={generateTasks}
                disabled={generating}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <RefreshCw className={cn("w-3 h-3", generating && "animate-spin")} />
                Refresh tasks
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}