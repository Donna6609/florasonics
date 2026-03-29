import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Waves, X, Sliders } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const EFFECTS = [
  {
    id: "reverb",
    label: "Reverb",
    emoji: "🏔️",
    description: "Space & depth",
    min: 0, max: 100, default: 0,
  },
  {
    id: "delay",
    label: "Echo",
    emoji: "🌀",
    description: "Trailing echo",
    min: 0, max: 100, default: 0,
  },
  {
    id: "lowpass",
    label: "Warmth",
    emoji: "🔥",
    description: "Filter high tones",
    min: 0, max: 100, default: 0,
  },
  {
    id: "highpass",
    label: "Clarity",
    emoji: "💎",
    description: "Filter low tones",
    min: 0, max: 100, default: 0,
  },
  {
    id: "bass",
    label: "Bass",
    emoji: "🌊",
    description: "Low frequency boost",
    min: -12, max: 12, default: 0,
  },
  {
    id: "treble",
    label: "Treble",
    emoji: "🎵",
    description: "High frequency boost",
    min: -12, max: 12, default: 0,
  },
];

export default function AmbientEffects({ onEffectChange }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(() =>
    Object.fromEntries(EFFECTS.map((e) => [e.id, e.default]))
  );

  const handleChange = (id, val) => {
    setValues((prev) => ({ ...prev, [id]: val }));
    onEffectChange?.(id, val);
  };

  const handleReset = () => {
    const reset = Object.fromEntries(EFFECTS.map((e) => [e.id, e.default]));
    setValues(reset);
    EFFECTS.forEach((e) => onEffectChange?.(e.id, e.default));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
      >
        <Sliders className="w-4 h-4" />
        <span>Ambient FX</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-full max-w-md bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎛️</span>
                  <h2 className="text-white/90 font-semibold">Ambient Effects</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Reset
                  </button>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-all">
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>

              <div className="p-5 grid grid-cols-2 gap-4">
                {EFFECTS.map((effect) => (
                  <div key={effect.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{effect.emoji}</span>
                      <div>
                        <div className="text-sm text-white/80 font-medium">{effect.label}</div>
                        <div className="text-[10px] text-white/30">{effect.description}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Slider
                        min={effect.min}
                        max={effect.max}
                        step={1}
                        value={[values[effect.id]]}
                        onValueChange={([v]) => handleChange(effect.id, v)}
                        className="w-full"
                      />
                      <div className="text-right text-xs text-white/30 mt-1">
                        {values[effect.id] > 0 && effect.min === 0 ? `${values[effect.id]}%` : `${values[effect.id]}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}