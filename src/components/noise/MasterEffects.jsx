import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function MasterEffects({ onEffectChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reverb, setReverb] = useState(0);
  const [delay, setDelay] = useState(0);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);

  const handleReverbChange = (val) => {
    setReverb(val[0]);
    onEffectChange("reverb", val[0] / 100);
  };

  const handleDelayChange = (val) => {
    setDelay(val[0]);
    onEffectChange("delay", val[0] / 100);
  };

  const handleEqLowChange = (val) => {
    setEqLow(val[0]);
    onEffectChange("eq_low", val[0]);
  };

  const handleEqMidChange = (val) => {
    setEqMid(val[0]);
    onEffectChange("eq_mid", val[0]);
  };

  const handleEqHighChange = (val) => {
    setEqHigh(val[0]);
    onEffectChange("eq_high", val[0]);
  };

  const hasEffects = reverb > 0 || delay > 0 || eqLow !== 0 || eqMid !== 0 || eqHigh !== 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300",
          "border backdrop-blur-xl text-sm font-medium",
          hasEffects
            ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
            : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
        )}
      >
        <Sliders className="w-4 h-4" />
        <span>FX</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-3 right-0 w-72 p-4 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl"
          >
            <h3 className="text-sm font-medium text-white/90 mb-4">Master Effects</h3>
            
            <div className="space-y-4">
              {/* Reverb */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/60">Reverb</span>
                  <span className="text-xs text-white/40">{reverb}%</span>
                </div>
                <Slider
                  value={[reverb]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleReverbChange}
                  className="[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
                />
              </div>

              {/* Delay */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/60">Delay</span>
                  <span className="text-xs text-white/40">{delay}%</span>
                </div>
                <Slider
                  value={[delay]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleDelayChange}
                  className="[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
                />
              </div>

              {/* EQ Section */}
              <div className="pt-3 border-t border-white/[0.08]">
                <p className="text-xs text-white/60 mb-3">Equalizer</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/50">Low (200Hz)</span>
                      <span className="text-xs text-white/40">{eqLow > 0 ? '+' : ''}{eqLow} dB</span>
                    </div>
                    <Slider
                      value={[eqLow]}
                      min={-12}
                      max={12}
                      step={1}
                      onValueChange={handleEqLowChange}
                      className="[&_[role=slider]]:h-2 [&_[role=slider]]:w-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/50">Mid (1kHz)</span>
                      <span className="text-xs text-white/40">{eqMid > 0 ? '+' : ''}{eqMid} dB</span>
                    </div>
                    <Slider
                      value={[eqMid]}
                      min={-12}
                      max={12}
                      step={1}
                      onValueChange={handleEqMidChange}
                      className="[&_[role=slider]]:h-2 [&_[role=slider]]:w-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/50">High (3kHz)</span>
                      <span className="text-xs text-white/40">{eqHigh > 0 ? '+' : ''}{eqHigh} dB</span>
                    </div>
                    <Slider
                      value={[eqHigh]}
                      min={-12}
                      max={12}
                      step={1}
                      onValueChange={handleEqHighChange}
                      className="[&_[role=slider]]:h-2 [&_[role=slider]]:w-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}