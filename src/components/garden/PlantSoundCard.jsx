import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Lock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Each sound maps to a plant/nature emoji and a botanical description
const PLANT_MAP = {
  rain: { plant: "🌧️", growthEmoji: "💧", label: "Rain", flavor: "Pitter-patter on leaves" },
  ocean: { plant: "🌊", growthEmoji: "🐚", label: "Ocean", flavor: "Rhythmic shoreline" },
  wind: { plant: "🌬️", growthEmoji: "🍃", label: "Wind", flavor: "Rustling through fronds" },
  forest: { plant: "🌲", growthEmoji: "🌿", label: "Forest", flavor: "Deep canopy ambience" },
  fire: { plant: "🔥", growthEmoji: "🪵", label: "Fireplace", flavor: "Crackling hearth" },
  birds: { plant: "🐦", growthEmoji: "🌸", label: "Birds", flavor: "Morning chorus" },
  thunder: { plant: "⛈️", growthEmoji: "⚡", label: "Thunder", flavor: "Roaring storm crack" },
  cafe: { plant: "☕", growthEmoji: "🌺", label: "Café", flavor: "Cozy background chatter" },
  night: { plant: "🌙", growthEmoji: "✨", label: "Night", flavor: "Crickets & moonlight" },
  train: { plant: "🚂", growthEmoji: "🌾", label: "Train", flavor: "Rhythmic journey" },
  stream: { plant: "🏞️", growthEmoji: "🪨", label: "Stream", flavor: "Babbling brook" },
  fan: { plant: "💨", growthEmoji: "🌀", label: "Fan", flavor: "Steady white noise" },
  prayer: { plant: "⛪", growthEmoji: "🕯️", label: "Prayer", flavor: "Peaceful sanctuary" },
  faith: { plant: "🙏", growthEmoji: "💚", label: "Faith", flavor: "Grounding presence" },
  calm: { plant: "🌤️", growthEmoji: "🍃", label: "Calm", flavor: "Soft, clear skies" },
  waterfall: { plant: "💧", growthEmoji: "💦", label: "Water Drips", flavor: "Cascading waters" },
  leaves: { plant: "🍃", growthEmoji: "🍂", label: "Leaves", flavor: "Tapping & rustling" },
  crickets: { plant: "🦗", growthEmoji: "🌙", label: "Crickets", flavor: "Summer night song" },
  campfire: { plant: "🏕️", growthEmoji: "🔥", label: "Campfire", flavor: "Wood smoke & warmth" },
  library: { plant: "📚", growthEmoji: "🕯️", label: "Library", flavor: "Quiet focus" },
  binaural: { plant: "🎵", growthEmoji: "✨", label: "Binaural", flavor: "Deep brainwave sync" },
  bowl: { plant: "🎶", growthEmoji: "💫", label: "Singing Bowl", flavor: "Sacred resonance" },
  embers: { plant: "🪨", growthEmoji: "✨", label: "Embers", flavor: "Soft glowing warmth" },
  hearth: { plant: "🧊", growthEmoji: "❄️", label: "Hearth", flavor: "Frosty stillness" },
  plant_bass: { plant: "🌱", growthEmoji: "🎵", label: "Plant Bass", flavor: "Botanical deep drone" },
  snow: { plant: "🌨️", growthEmoji: "❄️", label: "Snow", flavor: "Soft flurries on branches" },
  neuroharmony: { plant: "✨", growthEmoji: "💓", label: "Neuro Harmony", flavor: "Heartbeat & calm rhythm" },
};

const PlantSoundCard = React.memo(function PlantSoundCard({ sound, isActive, volume, onToggle, onVolumeChange, isFavorite, onToggleFavorite, userTier = "free", onUpgrade }) {
  const plant = PLANT_MAP[sound.id] || { plant: "🌿", growthEmoji: "🌱", label: sound.label, flavor: "" };
  const isLocked = (sound.tier === "basic" && userTier === "free") || (sound.tier === "premium" && (userTier === "free" || userTier === "basic"));

  const handleClick = useCallback(() => {
    if (isLocked && onUpgrade) {
      onUpgrade(sound.tier);
    } else {
      onToggle();
    }
  }, [isLocked, onUpgrade, onToggle, sound.tier]);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      role="button"
      tabIndex={0}
      aria-label={`${plant.label}${isActive ? ", playing" : ""}${isLocked ? ", locked" : ""}`}
      aria-pressed={isActive}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      className={cn(
        "relative rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-500 select-none cursor-pointer group overflow-hidden",
        isActive
          ? "bg-green-900/40 border border-green-500/40 shadow-lg shadow-green-900/30"
          : "bg-slate-900/60 border border-white/[0.07] hover:bg-slate-800/60 hover:border-green-800/40"
      )}
      onClick={handleClick}
    >
      {/* Active glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ background: `radial-gradient(circle at 50% 40%, ${sound.color}18, transparent 70%)` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Tier badge — always visible */}
      <div className="absolute top-2 left-2 z-20">
        {isLocked ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
            <Lock className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-300 uppercase">{sound.tier}</span>
          </div>
        ) : sound.tier !== "free" ? (
          <div className={cn(
            "px-1.5 py-0.5 rounded-full border text-[9px] font-bold uppercase",
            sound.tier === "premium"
              ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
              : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
          )}>
            {sound.tier}
          </div>
        ) : null}
      </div>

      {/* Favorite button */}
      {!isLocked && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          aria-label={isFavorite ? `Remove ${plant.label} from favorites` : `Add ${plant.label} to favorites`}
          aria-pressed={isFavorite}
          className={cn(
            "absolute top-1 right-1 p-2.5 rounded-full backdrop-blur-sm transition-all z-20 min-w-[44px] min-h-[44px] flex items-center justify-center",
            isFavorite
              ? "bg-pink-500/20 text-pink-400"
              : "bg-white/5 text-white/20 opacity-0 group-hover:opacity-100 hover:text-pink-400"
          )}
        >
          <Heart className="w-3 h-3" fill={isFavorite ? "currentColor" : "none"} />
        </button>
      )}

      {/* Plant emoji — grows when active */}
      <motion.div
        className="relative z-10 text-3xl sm:text-4xl leading-none"
        animate={isActive ? (
          sound.id === "leaves" ? { rotate: [-4, 4, -6, 6, -3, 3, 0], y: [0, -2, 1, -3, 0] } :
          sound.id === "thunder" ? { scale: [1, 1.25, 0.95, 1.2, 1], opacity: [1, 0.5, 1, 0.6, 1] } :
          sound.id === "hearth"  ? { scale: [1, 1.08, 1], filter: ["brightness(1)", "brightness(1.4) hue-rotate(180deg)", "brightness(1)"] } :
          sound.id === "neuroharmony" ? { scale: [1, 1.18, 1, 1.18, 1] } :
          { scale: [1, 1.12, 1], y: [0, -3, 0] }
        ) : { scale: 1, y: 0 }}
        transition={isActive ? (
          sound.id === "leaves" ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" } :
          sound.id === "thunder" ? { duration: 0.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" } :
          sound.id === "hearth"  ? { duration: 3, repeat: Infinity, ease: "easeInOut" } :
          sound.id === "neuroharmony" ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" } :
          { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
        ) : { duration: 0 }}
      >
        {plant.plant}
        {/* Growth sparkle when active */}
        {isActive && (
          <motion.span
            className="absolute -top-1 -right-1 text-sm"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5], y: [0, -6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            {plant.growthEmoji}
          </motion.span>
        )}
      </motion.div>

      {/* Label */}
      <span className={cn(
        "relative z-10 text-xs font-semibold tracking-wide transition-colors duration-300",
        isActive ? "text-green-300" : "text-white/50"
      )}>
        {plant.label}
      </span>

      {/* Flavor text */}
      {isActive && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-[9px] text-green-400/70 text-center leading-tight px-1"
        >
          {plant.flavor}
        </motion.span>
      )}

      {/* Volume ring */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 w-full mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(val) => onVolumeChange(val[0])}
            className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-green-400"
          />
          <p className="text-[9px] text-green-500/60 text-center mt-1">{volume}%</p>
        </motion.div>
      )}
    </motion.div>
  );
});

export default PlantSoundCard;