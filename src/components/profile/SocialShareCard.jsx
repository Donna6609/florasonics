import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Twitter, Check, Link, Music2, Instagram, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { SOUNDS } from "@/components/noise/SoundMixer";

export default function SocialShareCard({ preset, user, onClose }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const sounds = (preset.sound_configs || []).map((cfg) => {
    const sound = SOUNDS.find((s) => s.id === cfg.id);
    return sound ? { ...sound, volume: cfg.volume } : null;
  }).filter(Boolean);

  const shareUrl = `${window.location.origin}${window.location.pathname}?import=${preset.share_code || preset.id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetText = `🌿 I'm listening to "${preset.name}" on FloraSonics — ${sounds.map((s) => s.label).join(", ")} mixed together. ${shareUrl} #FloraSonics #NatureSounds #Focus`;

  const openTweet = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
  };

  const GRADIENT_MAP = {
    rain: "#7aa8c4",
    ocean: "#1e7a9e",
    wind: "#c8d8e8",
    forest: "#2d7d46",
    fire: "#e05c1a",
    birds: "#d4a017",
    thunder: "#4a4a72",
    cafe: "#8b5e3c",
    night: "#2e3a5c",
    train: "#6b7280",
    stream: "#3ab5c0",
    fan: "#9db4c0",
    faith: "#c2445c",
    calm: "#f0c060",
  };

  const dominantColor = sounds[0] ? GRADIENT_MAP[sounds[0].id] || "#2d7d46" : "#2d7d46";
  const accentColor = sounds[1] ? GRADIENT_MAP[sounds[1].id] || "#1a3d2b" : "#1a3d2b";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
      >
        {/* The shareable card */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden mb-4 shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${dominantColor}22 0%, ${accentColor}33 100%)`,
            border: `1px solid ${dominantColor}40`,
          }}
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌿</span>
              <span className="text-white/50 text-xs font-medium tracking-widest uppercase">FloraSonics</span>
            </div>

            <h2 className="text-xl font-medium text-white mb-1">{preset.name}</h2>
            {preset.description && (
              <p className="text-white/50 text-sm mb-4">{preset.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-5">
              {sounds.map((sound) => {
                const Icon = sound.icon;
                return (
                  <div
                    key={sound.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${sound.color}25`, border: `1px solid ${sound.color}40`, color: sound.color }}
                  >
                    <Icon className="w-3 h-3" />
                    {sound.label}
                    <span className="text-white/30 text-[10px]">{sound.volume}%</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="text-xs text-white/30">
                by {user?.display_name || user?.full_name?.split(" ")[0] || "a gardener"}
              </div>
              <div className="text-xs text-white/20">{sounds.length} sounds layered</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="bg-slate-900/95 border border-white/[0.08] rounded-2xl p-4 space-y-2">
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all text-sm text-white/70 hover:text-white"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy share link"}
          </button>
          <button
            onClick={openTweet}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 transition-all text-sm text-sky-300 hover:text-sky-200"
          >
            <Twitter className="w-4 h-4" />
            Share on X / Twitter
          </button>
          <button
            onClick={() => {
              const text = `🌿 Vibing to "${preset.name}" on FloraSonics — ${sounds.map((s) => s.label).join(", ")} 🎵 Try it: ${shareUrl} #FloraSonics #NatureSounds #StudyWithMe #FocusMusic`;
              window.open(`https://www.tiktok.com/upload?description=${encodeURIComponent(text)}`, "_blank");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/20 transition-all text-sm text-pink-300 hover:text-pink-200"
          >
            <Music2 className="w-4 h-4" />
            Share on TikTok
          </button>
          <button
            onClick={() => {
              const caption = `🌿 Vibing to "${preset.name}" on FloraSonics — ${sounds.map((s) => s.label).join(", ")} 🎵\n\nTry it: ${shareUrl}\n\n#FloraSonics #NatureSounds #StudyWithMe #FocusMusic #Wellness`;
              navigator.clipboard.writeText(caption);
              toast.success("Caption copied! Open Instagram to post.");
              setTimeout(() => window.open("https://www.instagram.com", "_blank"), 500);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 transition-all text-sm text-purple-300 hover:text-purple-200"
          >
            <Instagram className="w-4 h-4" />
            Share on Instagram
          </button>
          <button
            onClick={() => {
              const title = `🌿 "${preset.name}" — ${sounds.map((s) => s.label).join(" + ")} on FloraSonics`;
              const redditUrl = `https://www.reddit.com/r/studywithme/submit?type=link&title=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
              window.open(redditUrl, "_blank");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 transition-all text-sm text-orange-300 hover:text-orange-200"
          >
            <MessageSquare className="w-4 h-4" />
            Share on Reddit
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all text-sm text-white/40 hover:text-white/60"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}