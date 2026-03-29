import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, Copy, Check, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const PLANT_MAP = {
  rain: { plant: "🌧️", label: "Rain", color: "#93c5fd" },
  ocean: { plant: "🌊", label: "Ocean", color: "#22d3ee" },
  wind: { plant: "🌬️", label: "Wind", color: "#a3e635" },
  forest: { plant: "🌲", label: "Forest", color: "#4ade80" },
  fire: { plant: "🔥", label: "Fireplace", color: "#fb923c" },
  birds: { plant: "🐦", label: "Birds", color: "#fbbf24" },
  thunder: { plant: "⛈️", label: "Thunder", color: "#818cf8" },
  cafe: { plant: "☕", label: "Café", color: "#d97706" },
  night: { plant: "🌙", label: "Night", color: "#6366f1" },
  train: { plant: "🚂", label: "Train", color: "#94a3b8" },
  stream: { plant: "🏞️", label: "Stream", color: "#34d399" },
  fan: { plant: "💨", label: "Fan", color: "#e2e8f0" },
  faith: { plant: "🙏", label: "Faith", color: "#a78bfa" },
  calm: { plant: "🌤️", label: "Calm", color: "#fde68a" },
  waterfall: { plant: "💦", label: "Waterfall", color: "#67e8f9" },
  leaves: { plant: "🍃", label: "Leaves", color: "#6ee7b7" },
  crickets: { plant: "🦗", label: "Crickets", color: "#bef264" },
  campfire: { plant: "🏕️", label: "Campfire", color: "#f97316" },
  library: { plant: "📚", label: "Library", color: "#c084fc" },
  binaural: { plant: "🎵", label: "Binaural", color: "#818cf8" },
  bowl: { plant: "🎶", label: "Singing Bowl", color: "#f0abfc" },
  snow: { plant: "🌨️", label: "Snow", color: "#bfdbfe" },
  plant_bass: { plant: "🌱", label: "Plant Bass", color: "#86efac" },
};

// The visual card that gets captured as an image
function GardenCardCanvas({ topSounds, userName, cardRef }) {
  return (
    <div
      ref={cardRef}
      style={{
        width: 480,
        background: "linear-gradient(135deg, #0f1e13 0%, #0d1a1f 50%, #0f172a 100%)",
        borderRadius: 24,
        padding: 32,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow blobs */}
      <div style={{
        position: "absolute", top: -60, left: -60,
        width: 200, height: 200,
        background: "radial-gradient(circle, rgba(74,222,128,0.15) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute", bottom: -40, right: -40,
        width: 180, height: 180,
        background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>🌿</span>
        <div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>
            FloraSonics
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1 }}>
            Nature soundscapes powered by plants
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "16px 0" }} />

      {/* User label */}
      <div style={{ color: "rgba(74,222,128,0.7)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
        {userName ? `${userName}'s Garden` : "My Sound Garden"}
      </div>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 20 }}>
        Most-loved soundscapes
      </div>

      {/* Plant Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(topSounds.length, 4)}, 1fr)`,
        gap: 12,
      }}>
        {topSounds.map((s, i) => {
          const info = PLANT_MAP[s.id] || { plant: "🌿", label: s.label || s.id, color: "#4ade80" };
          const size = i === 0 ? 44 : i === 1 ? 38 : 32;
          return (
            <div key={s.id} style={{
              background: `radial-gradient(circle at 50% 30%, ${info.color}18, rgba(255,255,255,0.03) 70%)`,
              border: `1px solid ${info.color}30`,
              borderRadius: 16,
              padding: "14px 8px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{ fontSize: size }}>{info.plant}</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 600, textAlign: "center" }}>
                {info.label}
              </span>
              {s.count > 1 && (
                <span style={{
                  background: `${info.color}22`,
                  border: `1px solid ${info.color}40`,
                  borderRadius: 20,
                  padding: "2px 8px",
                  color: info.color,
                  fontSize: 9,
                  fontWeight: 700,
                }}>
                  ×{s.count} sessions
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>florasonics.app</div>
        <div style={{ display: "flex", gap: 6 }}>
          {["🌱", "🍃", "✨"].map((e, i) => (
            <span key={i} style={{ fontSize: 14, opacity: 0.5 }}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GardenShareModal({ isOpen, onClose, playbackHistory, userName }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Compute top sounds from playback history
  const soundCounts = {};
  (playbackHistory || []).forEach((session) => {
    (session.sound_configs || []).forEach((cfg) => {
      if (cfg.id && cfg.id !== "_base_background") {
        soundCounts[cfg.id] = (soundCounts[cfg.id] || 0) + 1;
      }
    });
  });

  const topSounds = Object.entries(soundCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({ id, count }));

  const hasData = topSounds.length > 0;

  const handleExportImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-florasonics-garden.png";
      a.click();
      toast.success("Garden image downloaded!");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = () => {
    const topIds = topSounds.map((s) => s.id).join(",");
    const url = `${window.location.origin}${window.location.pathname}?garden=${encodeURIComponent(topIds)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Shareable link copied!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900/95 border border-emerald-500/20 rounded-2xl p-6 w-full max-w-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  Share Your Garden
                </h2>
                <p className="text-white/40 text-xs mt-0.5">Your most-loved soundscapes as a virtual garden</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!hasData ? (
              <div className="text-center py-10 text-white/30">
                <span className="text-4xl block mb-3">🌱</span>
                <p className="text-sm">Play some sounds first to grow your garden!</p>
              </div>
            ) : (
              <>
                {/* Preview */}
                <div className="flex justify-center mb-5 overflow-hidden rounded-2xl">
                  <div style={{ transform: "scale(0.72)", transformOrigin: "top center", height: 280 }}>
                    <GardenCardCanvas topSounds={topSounds} userName={userName} cardRef={cardRef} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleExportImage}
                    disabled={exporting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-all text-sm font-medium disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? "Exporting…" : "Save Image"}
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all",
                      copied
                        ? "bg-green-600/20 border-green-500/30 text-green-300"
                        : "bg-white/[0.06] border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80"
                    )}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                <p className="text-center text-white/20 text-xs mt-3">
                  Friends can open your link to explore your garden & listen along
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}