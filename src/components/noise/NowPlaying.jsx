import React from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function AudioBars({ isPlaying }) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-emerald-400/80"
          animate={
            isPlaying
              ? {
                  height: ["4px", "16px", "8px", "14px", "4px"],
                }
              : { height: "4px" }
          }
          transition={
            isPlaying
              ? {
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export default function NowPlaying({
  activeSounds,
  masterVolume,
  onMasterVolumeChange,
  isMuted,
  onToggleMute,
}) {
  const isPlaying = activeSounds.length > 0;
  const soundNames = activeSounds.map((s) => s.label).join(" · ");

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}
    >
      <div className="bg-gradient-to-t from-slate-950 via-slate-950/98 to-transparent pt-8 pb-6 px-4 sm:px-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Audio visualization */}
            <AudioBars isPlaying={isPlaying && !isMuted} />

            {/* Sound info */}
            <div className="flex-1 min-w-0">
              {isPlaying ? (
                <p className="text-white/60 text-sm truncate">{soundNames}</p>
              ) : (
                <p className="text-white/25 text-sm">Select sounds to begin</p>
              )}
            </div>

            {/* Mute button */}
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className={cn(
                "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all",
                isMuted
                  ? "text-red-400/70 bg-red-400/10"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Master volume */}
            <div className="w-28 sm:w-36">
              <Slider
                value={[isMuted ? 0 : masterVolume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(val) => onMasterVolumeChange(val[0])}
                className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}