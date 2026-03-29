import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Music, Heart, Bookmark, Share2, Edit3, Check, X, Crown, Leaf, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SocialShareCard from "@/components/profile/SocialShareCard";
import { usePullToRefresh } from "@/components/usePullToRefresh";

const TIER_ICONS = { free: Leaf, basic: Zap, premium: Crown };
const TIER_COLORS = { free: "text-slate-400", basic: "text-emerald-400", premium: "text-amber-400" };

const VIBE_OPTIONS = [
  { id: "focus", label: "Focus & Deep Work", emoji: "🎯" },
  { id: "sleep", label: "Sleep & Rest", emoji: "🌙" },
  { id: "relax", label: "Relaxation", emoji: "🌿" },
  { id: "meditation", label: "Meditation", emoji: "🧘" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "nature", label: "Nature Lover", emoji: "🌲" },
];

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [sharePreset, setSharePreset] = useState(null);

  const { data: presets = [] } = useQuery({
    queryKey: ["presets"],
    queryFn: () => base44.entities.Preset.list("-created_date"),
    initialData: [],
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => base44.entities.Favorite.list("-created_date"),
    initialData: [],
  });

  const { data: moodLogs = [] } = useQuery({
    queryKey: ["moodLogs"],
    queryFn: () => base44.entities.MoodLog.list("-created_date", 10),
    initialData: [],
  });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      setBio(u.bio || "");
      setDisplayName(u.display_name || u.full_name || "");
      setSelectedVibes(u.sound_vibes || []);

      const subs = await base44.entities.Subscription.filter({ created_by: u.email }, "-created_date", 1);
      if (subs.length > 0 && subs[0].status === "active") {
        setSubscription(subs[0]);
      }
    }).catch(() => navigate(createPageUrl("Home")));
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ bio, display_name: displayName, sound_vibes: selectedVibes });
    setUser((u) => ({ ...u, bio, display_name: displayName, sound_vibes: selectedVibes }));
    setSaving(false);
    setEditing(false);
    toast.success("Profile updated!");
  };

  const toggleVibe = (id) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["presets"] }),
      queryClient.invalidateQueries({ queryKey: ["favorites"] }),
      queryClient.invalidateQueries({ queryKey: ["moodLogs"] }),
    ]);
  };

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(refreshAll);

  const userPresets = presets.filter((p) => !p.is_curated);
  const tier = subscription?.tier || "free";
  const TierIcon = TIER_ICONS[tier];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/40 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-8 py-6" {...pullHandlers}>
      <PullIndicator />
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          aria-label="Back to Home"
          className="flex items-center gap-2 min-h-[44px] px-3 text-white/40 hover:text-white/70 transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Garden
        </button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/20 flex items-center justify-center text-2xl">
                {user.full_name?.[0]?.toUpperCase() || "🌿"}
              </div>
              <div>
                {editing ? (
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-lg font-medium text-white bg-white/10 border border-white/20 rounded-lg px-2 py-1 mb-1 w-full"
                    placeholder="Display name"
                  />
                ) : (
                  <h2 className="text-lg font-medium text-white/90">{user.display_name || user.full_name}</h2>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <TierIcon className={cn("w-3.5 h-3.5", TIER_COLORS[tier])} />
                  <span className={cn("text-xs font-medium capitalize", TIER_COLORS[tier])}>{tier} plan</span>
                </div>
              </div>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  aria-label="Cancel editing"
                  className="p-3 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  aria-label="Save profile changes"
                  className="p-3 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                aria-label="Edit profile"
                className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-sm justify-center"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Bio</label>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={150}
                className="w-full text-sm text-white/70 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-emerald-500/40"
                placeholder="Tell others about your sound journey..."
              />
            ) : (
              <p className="text-sm text-white/50 leading-relaxed">
                {bio || <span className="italic text-white/25">No bio yet — tap Edit to add one</span>}
              </p>
            )}
          </div>

          {/* Sound Vibes */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">My Sound Vibes</label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((vibe) => {
                const active = editing ? selectedVibes.includes(vibe.id) : (user.sound_vibes || []).includes(vibe.id);
                return (
                  <button
                    key={vibe.id}
                    onClick={() => editing && toggleVibe(vibe.id)}
                    disabled={!editing}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      active
                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                        : "bg-white/[0.04] border border-white/[0.08] text-white/40",
                      editing && !active && "hover:bg-white/10 hover:text-white/60 cursor-pointer"
                    )}
                  >
                    <span>{vibe.emoji}</span>
                    {vibe.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { label: "Presets", value: userPresets.length, icon: Music },
            { label: "Favorites", value: favorites.length, icon: Heart },
            { label: "Mood Logs", value: moodLogs.length, icon: Bookmark },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 text-center">
              <Icon className="w-4 h-4 text-emerald-400/60 mx-auto mb-1" />
              <div className="text-2xl font-light text-white/90">{value}</div>
              <div className="text-xs text-white/40">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* My Presets — shareable */}
        {userPresets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white/70">My Soundscapes</h3>
              <span className="ml-auto text-xs text-white/25">Tap Share to post</span>
            </div>
            <div className="space-y-2">
              {userPresets.slice(0, 8).map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm">🌿</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{preset.name}</p>
                    {preset.description && (
                      <p className="text-xs text-white/35 truncate">{preset.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSharePreset(preset); setShareCardOpen(true); }}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs transition-all hover:bg-emerald-500/20"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Social Share Card Modal */}
      {shareCardOpen && sharePreset && (
        <SocialShareCard
          preset={sharePreset}
          user={user}
          onClose={() => { setShareCardOpen(false); setSharePreset(null); }}
        />
      )}
    </div>
  );
}