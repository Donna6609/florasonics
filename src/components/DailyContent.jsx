import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Play, Lightbulb } from "lucide-react";
import { SOUNDS } from "@/components/noise/SoundMixer";

const WELLNESS_TIPS = [
  "Close your eyes for 60 seconds and focus only on what you hear.",
  "Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s.",
  "A 10-minute nature soundscape can lower cortisol by up to 25%.",
  "Morning sounds like birds signal your brain to wake naturally.",
  "White noise masks distractions — great for deep focus sessions.",
  "Rain sounds sync your brainwaves to a calm, meditative state.",
  "Fire crackling triggers ancient feelings of safety and warmth.",
  "Pair ocean waves with slow breathing for instant stress relief.",
  "Forest sounds increase NK (natural killer) cell activity.",
  "Silence between sounds is where real relaxation happens.",
  "Try the same soundscape every night to train a sleep response.",
  "Mix 2–3 complementary sounds rather than layering too many.",
  "Lower volumes (40–60%) are more effective for sleep than loud.",
  "Binaural beats at 10Hz promote relaxed alertness.",
  "Nature sounds reduce the fight-or-flight nervous system response.",
];

const SOUND_OF_DAY_IDS = [
  "rain", "ocean", "forest", "birds", "stream", "fire",
  "wind", "night", "faith", "waterfall", "crickets", "bowl",
  "train", "cafe", "fan", "leaves",
];

function getDayIndex() {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

export default function DailyContent({ onPlaySound, activeSounds }) {
  const [open, setOpen] = useState(false);

  const dayIdx = getDayIndex();
  const soundOfDayId = SOUND_OF_DAY_IDS[dayIdx % SOUND_OF_DAY_IDS.length];
  const tip = WELLNESS_TIPS[dayIdx % WELLNESS_TIPS.length];
  const sound = SOUNDS.find(s => s.id === soundOfDayId);
  const isActive = activeSounds?.some(s => s.id === soundOfDayId);
  const Icon = sound?.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-500/30 text-amber-300 hover:text-amber-200"
      >
        <Sparkles className="w-4 h-4" />
        <span>Daily</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-slate-900/95 border border-white/10 rounded-2xl p-4 z-50 shadow-2xl backdrop-blur-xl"
          >
            {/* Sound of the Day */}
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-amber-400/60 font-semibold mb-2">🎵 Sound of the Day</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {Icon && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${sound.color}22` }}>
                    <Icon className="w-5 h-5" style={{ color: sound.color }} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90">{sound?.label}</p>
                  <p className="text-xs text-white/40 capitalize">{sound?.category}</p>
                </div>
                <button
                  onClick={() => { onPlaySound(sound); setOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  <Play className="w-3 h-3" />
                  {isActive ? "Playing" : "Play"}
                </button>
              </div>
            </div>

            {/* Wellness Tip */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/60 font-semibold mb-2">💡 Wellness Tip</p>
              <div className="flex gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">{tip}</p>
              </div>
            </div>

            <p className="text-center text-[10px] text-white/20 mt-3">Refreshes daily 🌱</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}