import React, { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlantSoundCard from "./PlantSoundCard";
import { SOUNDS, SOUND_CATEGORIES } from "@/components/noise/SoundMixer";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/components/usePullToRefresh";

// Stable per-card wrapper so each card only re-renders when its own data changes
const MemoizedSoundCard = React.memo(function MemoizedSoundCard({
  sound, activeSound, isFavorite, onToggleSound, onVolumeChange, onToggleFavorite, userTier, onUpgrade,
}) {
  const handleToggle = useCallback(() => onToggleSound(sound), [onToggleSound, sound]);
  const handleVolume = useCallback((vol) => onVolumeChange(sound.id, vol), [onVolumeChange, sound.id]);
  const handleFavorite = useCallback(() => onToggleFavorite(sound), [onToggleFavorite, sound]);
  return (
    <PlantSoundCard
      sound={sound}
      isActive={!!activeSound}
      volume={activeSound?.volume ?? 70}
      onToggle={handleToggle}
      onVolumeChange={handleVolume}
      isFavorite={isFavorite}
      onToggleFavorite={handleFavorite}
      userTier={userTier}
      onUpgrade={onUpgrade}
    />
  );
});

const CARD_ROW_HEIGHT = 160;

const VirtualSoundGrid = React.memo(function VirtualSoundGrid({ sounds, activeSounds, favorites, onToggleSound, onVolumeChange, onToggleFavorite, userTier, onUpgrade }) {
  const containerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < CARD_ROW_HEIGHT * 2) {
      setVisibleCount((c) => Math.min(c + 9, sounds.length));
    }
  }, [sounds.length]);

  const visibleSounds = sounds.slice(0, visibleCount);
  const hiddenCount = sounds.length - visibleCount;

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
      onScroll={handleScroll}
    >
      {visibleSounds.map((sound) => {
        const activeSound = activeSounds.find((s) => s.id === sound.id);
        const isFavorite = favorites.some((f) => f.type === "sound" && f.item_id === sound.id);
        return (
          <MemoizedSoundCard
            key={sound.id}
            sound={sound}
            activeSounds={activeSounds}
            activeSound={activeSound}
            isFavorite={isFavorite}
            onToggleSound={onToggleSound}
            onVolumeChange={onVolumeChange}
            onToggleFavorite={onToggleFavorite}
            userTier={userTier}
            onUpgrade={onUpgrade}
          />
        );
      })}
      {hiddenCount > 0 && (
        <button
          onClick={() => setVisibleCount((c) => Math.min(c + 9, sounds.length))}
          className="col-span-3 sm:col-span-4 md:col-span-5 min-h-[44px] py-3 text-xs text-white/30 hover:text-white/50 transition-colors"
          aria-label={`Load ${hiddenCount} more sounds`}
        >
          ↓ {hiddenCount} more
        </button>
      )}
    </div>
  );
});

export default function GardenMixer({
  activeSounds,
  onToggleSound,
  onVolumeChange,
  favorites,
  onToggleFavorite,
  userTier,
  onUpgrade,
  onRefresh,
}) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(
    () => (activeCategory === "all" ? SOUNDS : SOUNDS.filter((s) => s.category === activeCategory)),
    [activeCategory]
  );

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(
    onRefresh ?? (() => Promise.resolve())
  );

  return (
    <div className="space-y-4" {...pullHandlers}>
      <PullIndicator />

      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center flex-wrap"
        role="group"
        aria-label="Filter sounds by category"
      >
        {SOUND_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-label={`Filter by ${cat.label}`}
            aria-pressed={activeCategory === cat.id}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap min-h-[44px] min-w-[44px]",
              activeCategory === cat.id
                ? "bg-green-700/50 border-green-500/60 text-green-200"
                : "bg-white/[0.05] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <VirtualSoundGrid
            sounds={filtered}
            activeSounds={activeSounds}
            favorites={favorites}
            onToggleSound={onToggleSound}
            onVolumeChange={onVolumeChange}
            onToggleFavorite={onToggleFavorite}
            userTier={userTier}
            onUpgrade={onUpgrade}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}