import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "florasonics_notifications";

function getStoredPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function NotificationSetup({ userStreak = 0 }) {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState("default");
  const [prefs, setPrefs] = useState(getStoredPrefs);
  const [reminderTime, setReminderTime] = useState(prefs.reminderTime || "08:00");
  const [streakAlerts, setStreakAlerts] = useState(prefs.streakAlerts ?? true);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check if it's time for a reminder
  useEffect(() => {
    if (permission !== "granted" || !prefs.reminderEnabled) return;

    const check = () => {
      const now = new Date();
      const [h, m] = (prefs.reminderTime || "08:00").split(":").map(Number);
      const lastShown = prefs.lastReminderDate;
      const today = now.toDateString();

      if (now.getHours() === h && now.getMinutes() === m && lastShown !== today) {
        new Notification("🌿 FloraSonics", {
          body: "Time for your daily wellness session. Your garden is waiting!",
          icon: "/favicon.ico",
        });
        const updated = { ...prefs, lastReminderDate: today };
        setPrefs(updated);
        savePrefs(updated);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [permission, prefs]);

  // Streak alert
  useEffect(() => {
    if (permission !== "granted" || !prefs.streakAlerts) return;
    if (userStreak > 0) {
      const lastAlert = prefs.lastStreakAlert;
      const today = new Date().toDateString();
      if (lastAlert !== today) {
        const hour = new Date().getHours();
        if (hour >= 20) {
          new Notification("🔥 Keep your streak alive!", {
            body: `You have a ${userStreak}-day streak. Don't break it — open FloraSonics now!`,
            icon: "/favicon.ico",
          });
          const updated = { ...prefs, lastStreakAlert: today };
          setPrefs(updated);
          savePrefs(updated);
        }
      }
    }
  }, [permission, prefs, userStreak]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported in this browser");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notifications enabled!");
    }
  };

  const handleSave = () => {
    const updated = { ...prefs, reminderTime, streakAlerts, reminderEnabled: true };
    setPrefs(updated);
    savePrefs(updated);
    setOpen(false);
    toast.success("Notification preferences saved!");
  };

  const handleDisable = () => {
    const updated = { ...prefs, reminderEnabled: false };
    setPrefs(updated);
    savePrefs(updated);
    setOpen(false);
    toast.success("Notifications disabled");
  };

  const isEnabled = permission === "granted" && prefs.reminderEnabled;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium ${
          isEnabled
            ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
            : "bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
        }`}
      >
        {isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        <span>Alerts</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-slate-900/95 border border-white/10 rounded-2xl p-5 z-50 shadow-2xl backdrop-blur-xl"
          >
            <p className="text-sm font-semibold text-white/90 mb-4">🔔 Notification Settings</p>

            {permission !== "granted" ? (
              <div className="text-center">
                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                  Enable notifications to get daily wellness reminders and streak alerts.
                </p>
                <button
                  onClick={requestPermission}
                  className="w-full py-2.5 rounded-xl bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-300 text-sm font-medium transition-all border border-emerald-500/30"
                >
                  Enable Notifications
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Daily Reminder */}
                <div>
                  <p className="text-xs text-white/50 mb-2">⏰ Daily Reminder Time</p>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/80 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Streak Alerts */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">🔥 Streak Alerts</p>
                    <p className="text-[10px] text-white/30">Remind me at 8pm to keep my streak</p>
                  </div>
                  <button
                    onClick={() => setStreakAlerts(!streakAlerts)}
                    className={`w-10 h-5 rounded-full transition-all relative ${streakAlerts ? "bg-emerald-600" : "bg-white/20"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${streakAlerts ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleDisable}
                    className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white/50 text-xs border border-white/[0.08] hover:bg-white/[0.08] transition-all"
                  >
                    Disable
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 rounded-xl bg-emerald-600/40 text-emerald-300 text-xs border border-emerald-500/30 hover:bg-emerald-600/60 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}