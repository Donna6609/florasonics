import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart as HeartIcon, Settings as SettingsIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import AudioVisualization from "./AudioVisualization";

export default function SoundCard({ sound, isActive, volume, onToggle, onVolumeChange, isFavorite, onToggleFavorite, userTier = "free", onUpgrade, onEffectChange }) {
  const Icon = sound.icon;
  const isLocked = sound.tier === "basic" && userTier === "free" || sound.tier === "premium" && (userTier === "free" || userTier === "basic");
  const [showEffects, setShowEffects] = useState(false);
  const [reverb, setReverb] = useState(0);
  const [delay, setDelay] = useState(0);

  const handleClick = () => {
    if (isLocked && onUpgrade) {
      onUpgrade(sound.tier);
    } else {
      onToggle();
    }
  };

  const handleReverbChange = (val) => {
    setReverb(val[0]);
    if (onEffectChange) {
      onEffectChange(sound.id, "reverb", val[0] / 100);
    }
  };

  const handleDelayChange = (val) => {
    setDelay(val[0]);
    if (onEffectChange) {
      onEffectChange(sound.id, "delay", val[0] / 100);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative group rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-500 select-none overflow-hidden",
        "border border-white/[0.06] backdrop-blur-xl",
        isActive
          ? "bg-white/[0.12] shadow-lg shadow-black/20"
          : "bg-white/[0.04] hover:bg-white/[0.07]"
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <img
          src={sound.image}
          alt={sound.label}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isActive ? "opacity-50 scale-110" : "opacity-25 scale-100 group-hover:opacity-35"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950/70" />
      </div>

      {/* Favorite and Effects Buttons */}
      {!isLocked && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all z-20",
              isFavorite
                ? "bg-pink-500/20 text-pink-400"
                : "bg-white/5 text-white/60 opacity-0 group-hover:opacity-100 hover:text-pink-400"
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
          >
            <HeartIcon className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} />
          </button>
          
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEffects(!showEffects);
              }}
              className={cn(
                "absolute top-2 right-10 p-1.5 rounded-full backdrop-blur-sm transition-all z-20",
                showEffects
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/5 text-white/60 opacity-0 group-hover:opacity-100 hover:text-blue-400"
              )}
              aria-label={showEffects ? "Hide effect controls" : "Show effect controls"}
              aria-expanded={showEffects}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}

      {/* Lock Badge */}
      {isLocked && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm z-20">
          <span className="text-[10px] font-semibold text-amber-300 uppercase">
            {sound.tier}
          </span>
        </div>
      )}

      {/* Ambient glow when active */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${sound.color}20, transparent 70%)`,
          }}
        />
      )}

      <button 
        onClick={handleClick} 
        className="flex flex-col items-center gap-3 w-full cursor-pointer"
        aria-label={isLocked ? `Unlock ${sound.label} - ${sound.tier} tier required` : `Toggle ${sound.label} ${isActive ? "off" : "on"}`}
        aria-pressed={isActive}
      >
        <div
          className={cn(
            "relative z-10 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
            isActive ? "scale-110" : "scale-100"
          )}
          style={{
            backgroundColor: isActive ? `${sound.color}25` : "rgba(255,255,255,0.06)",
          }}
          aria-hidden="true"
        >
          <Icon
            className={cn(
              "w-6 h-6 transition-all duration-500",
              isActive ? "opacity-100" : "opacity-70"
            )}
            style={{ color: isActive ? sound.color : "rgba(255,255,255,0.8)" }}
            aria-hidden="true"
          />
        </div>

        <span
          className={cn(
            "relative z-10 text-xs font-medium tracking-wide uppercase transition-all duration-500",
            isActive ? "text-white/90" : "text-white/60"
          )}
          aria-hidden="true"
        >
          {sound.label}
        </span>
      </button>

      {/* Audio Visualization */}
      <AudioVisualization
        isActive={isActive}
        volume={volume}
        color={sound.color}
        soundId={sound.id}
      />

      {/* Volume slider */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="relative z-10 w-full pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(val) => onVolumeChange(val[0])}
            className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0"
            style={{
              "--slider-color": sound.color,
            }}
            aria-label={`${sound.label} volume`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volume}
            aria-valuetext={`${volume} percent`}
          />
          <p className="text-[10px] text-white/60 text-center mt-1.5" aria-live="polite">{volume}%</p>
        </motion.div>
      )}

      {/* Effects Panel */}
      <AnimatePresence>
        {showEffects && isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-30 overflow-hidden"
          >
            <div className="p-3 bg-slate-900/95 backdrop-blur-xl border-t border-white/[0.08] rounded-b-2xl space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white/60">Reverb</span>
                    <span className="text-xs text-white/60">{reverb}%</span>
                  </div>
                <Slider
                    value={[reverb]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleReverbChange}
                    className="[&_[role=slider]]:h-2 [&_[role=slider]]:w-2"
                    aria-label={`${sound.label} reverb effect`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={reverb}
                    aria-valuetext={`${reverb} percent`}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white/60">Delay</span>
                    <span className="text-xs text-white/60">{delay}%</span>
                  </div>
                  <Slider
                    value={[delay]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleDelayChange}
                    className="[&_[role=slider]]:h-2 [&_[role=slider]]:w-2"
                    aria-label={`${sound.label} delay effect`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={delay}
                    aria-valuetext={`${delay} percent`}
                  />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}