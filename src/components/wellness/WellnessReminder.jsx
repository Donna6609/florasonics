import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REMINDER_OPTIONS = [
  { id: "morning", label: "Morning meditation", time: "08:00", emoji: "🌅" },
  { id: "afternoon", label: "Afternoon focus session", time: "14:00", emoji: "☀️" },
  { id: "evening", label: "Evening wind-down", time: "21:00", emoji: "🌙" },
];

export default function WellnessReminder() {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState("default");
  const [reminders, setReminders] = useState({});
  const [customTime, setCustomTime] = useState("");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    const stored = localStorage.getItem("flora_reminders");
    if (stored) setReminders(JSON.parse(stored));
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser doesn't support notifications");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification permission denied");
    }
  };

  const toggleReminder = (id, time, label) => {
    const updated = { ...reminders };
    if (updated[id]) {
      delete updated[id];
      toast.success(`Removed "${label}" reminder`);
    } else {
      updated[id] = { time, label };
      toast.success(`Reminder set for ${time} — "${label}"`);
      // Show a test notification
      if (permission === "granted") {
        new Notification("FloraSonics Reminder Set 🌿", {
          body: `You'll be reminded for: ${label} at ${time}`,
          icon: "/favicon.ico",
        });
      }
    }
    setReminders(updated);
    localStorage.setItem("flora_reminders", JSON.stringify(updated));
  };

  const addCustomReminder = () => {
    if (!customTime) return;
    const id = `custom_${customTime}`;
    toggleReminder(id, customTime, `Custom reminder at ${customTime}`);
    setCustomTime("");
  };

  const activeCount = Object.keys(reminders).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium",
          activeCount > 0
            ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
            : "bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
        )}
      >
        <Bell className="w-4 h-4" />
        <span>Reminders</span>
        {activeCount > 0 && (
          <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">
            {activeCount}
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
                  <h3 className="text-base font-semibold text-white/90">Wellness Reminders</h3>
                  <p className="text-xs text-white/40">Browser notifications</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {permission !== "granted" ? (
                <button
                  onClick={requestPermission}
                  className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-600/30 transition-all"
                >
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </button>
              ) : (
                <div className="space-y-2 mb-4">
                  {REMINDER_OPTIONS.map((opt) => {
                    const active = !!reminders[opt.id];
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleReminder(opt.id, opt.time, opt.label)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                          active
                            ? "bg-blue-500/10 border border-blue-500/20"
                            : "bg-white/[0.04] border border-transparent hover:bg-white/[0.07]"
                        )}
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        <div className="flex-1">
                          <p className={cn("text-sm", active ? "text-white/80" : "text-white/60")}>{opt.label}</p>
                          <p className="text-xs text-white/30">{opt.time}</p>
                        </div>
                        {active
                          ? <Bell className="w-4 h-4 text-blue-400" />
                          : <BellOff className="w-4 h-4 text-white/20" />
                        }
                      </button>
                    );
                  })}
                </div>
              )}

              {permission === "granted" && (
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-xs text-white/40 mb-2">Custom time</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-blue-500/40"
                    />
                    <button
                      onClick={addCustomReminder}
                      disabled={!customTime}
                      className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-600/30 transition-all disabled:opacity-40"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}