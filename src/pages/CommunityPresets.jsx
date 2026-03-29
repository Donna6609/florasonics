import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Search, Flag, TrendingUp, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { SOUNDS } from "@/components/noise/SoundMixer";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/components/usePullToRefresh";

const MOOD_FILTERS = [
  { id: "all", label: "All", emoji: "🌿" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "sleep", label: "Sleep", emoji: "🌙" },
  { id: "relax", label: "Relax", emoji: "💆" },
  { id: "energy", label: "Energy", emoji: "⚡" },
  { id: "nature", label: "Nature", emoji: "🌲" },
];

const SORT_OPTIONS = [
  { id: "popular", label: "Most Popular" },
  { id: "newest", label: "Newest" },
];

function getSoundMoodTags(soundConfigs) {
  const ids = soundConfigs.map(c => c.id);
  const tags = [];
  if (ids.some(id => ["night", "rain", "fan", "ocean"].includes(id))) tags.push("sleep");
  if (ids.some(id => ["cafe", "library", "fan"].includes(id))) tags.push("focus");
  if (ids.some(id => ["ocean", "birds", "forest", "stream"].includes(id))) tags.push("relax");
  if (ids.some(id => ["thunder", "birds", "rain"].includes(id))) tags.push("energy");
  if (ids.some(id => ["forest", "birds", "leaves", "crickets", "stream", "waterfall"].includes(id))) tags.push("nature");
  return tags;
}

export default function CommunityPresets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMood, setActiveMood] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const { data: publicPresets = [], isLoading, refetch } = useQuery({
    queryKey: ["public-presets"],
    queryFn: () => base44.entities.Preset.filter({ is_public: true, reported: false }, sortBy === "popular" ? "-import_count" : "-created_date"),
    initialData: [],
  });

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(refetch);

  const importMutation = useMutation({
    mutationFn: async (preset) => {
      await base44.entities.Preset.create({
        name: `${preset.name} (imported)`,
        description: preset.description,
        sound_configs: preset.sound_configs,
        is_public: false,
        is_curated: false,
      });
      await base44.entities.Preset.update(preset.id, {
        import_count: (preset.import_count || 0) + 1,
      });
    },
    onMutate: async (preset) => {
      await queryClient.cancelQueries({ queryKey: ["public-presets"] });
      const previous = queryClient.getQueryData(["public-presets"]);
      // Optimistically increment import_count
      queryClient.setQueryData(["public-presets"], (old) =>
        (old || []).map((p) =>
          p.id === preset.id ? { ...p, import_count: (p.import_count || 0) + 1 } : p
        )
      );
      return { previous };
    },
    onError: (_err, _preset, context) => {
      queryClient.setQueryData(["public-presets"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.invalidateQueries({ queryKey: ["public-presets"] });
      toast.success("Preset imported to your garden!");
    },
  });

  const [currentUser, setCurrentUser] = React.useState(null);
  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const reportMutation = useMutation({
    mutationFn: (presetId) => base44.entities.Preset.update(presetId, { reported: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-presets"] });
      toast.success("Preset reported. Thanks for keeping the community safe.");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ preset, newLikes }) => {
      await base44.entities.Preset.update(preset.id, { likes: newLikes });
    },
    onMutate: async ({ preset, newLikes }) => {
      await queryClient.cancelQueries({ queryKey: ["public-presets"] });
      const previous = queryClient.getQueryData(["public-presets"]);
      queryClient.setQueryData(["public-presets"], (old) =>
        (old || []).map((p) => p.id === preset.id ? { ...p, likes: newLikes } : p)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["public-presets"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["public-presets"] }),
  });

  const filteredPresets = publicPresets.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.creator_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeMood === "all") return true;

    const tags = getSoundMoodTags(preset.sound_configs);
    return tags.includes(activeMood);
  });

  const getSoundNames = (soundConfigs) =>
    soundConfigs
      .map((config) => SOUNDS.find((s) => s.id === config.id)?.label || config.id)
      .join(", ");

  const getSoundEmojis = (soundConfigs) => {
    const map = { rain:"🌧️", ocean:"🌊", wind:"🌬️", forest:"🌲", fire:"🔥", birds:"🐦", thunder:"⛈️", cafe:"☕", night:"🌙", train:"🚂", stream:"🏞️", fan:"💨", calm:"🌤️", faith:"🙏", waterfall:"💦", leaves:"🍃", crickets:"🦗", campfire:"🏕️", library:"📚", binaural:"🎵", bowl:"🎶" };
    return soundConfigs.slice(0, 4).map(c => map[c.id] || "🔊").join(" ");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6" {...pullHandlers}>
      <PullIndicator />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("Home"))} className="text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white/90">Community Presets</h1>
            <p className="text-white/40 text-sm">Discover soundscapes shared by the community</p>
          </div>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm border transition-all",
                  sortBy === opt.id
                    ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                    : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 flex-wrap">
          {MOOD_FILTERS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setActiveMood(mood.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                activeMood === mood.id
                  ? "bg-emerald-700/40 border-emerald-500/50 text-emerald-200"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
              )}
            >
              <span>{mood.emoji}</span>
              {mood.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-white/40">Loading presets...</div>
        ) : filteredPresets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌿</div>
            <div className="text-white/60">No presets found</div>
            <p className="text-white/40 text-sm mt-2">
              {searchQuery || activeMood !== "all" ? "Try different filters" : "Be the first to share a preset!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPresets.map((preset, idx) => {
              const moodTags = getSoundMoodTags(preset.sound_configs);
              return (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.06] transition-all flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getSoundEmojis(preset.sound_configs)}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white/90">{preset.name}</h3>
                      {preset.creator_name && (
                        <p className="text-xs text-white/40 mt-0.5">by {preset.creator_name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => reportMutation.mutate(preset.id)}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Report"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {preset.description && (
                    <p className="text-xs text-white/50 leading-relaxed">{preset.description}</p>
                  )}

                  {/* Mood tags */}
                  {moodTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {moodTags.map((tag) => {
                        const mood = MOOD_FILTERS.find(m => m.id === tag);
                        return mood ? (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.06]">
                            {mood.emoji} {mood.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {preset.import_count || 0}
                      </span>
                      <button
                        onClick={() => {
                          if (!currentUser) return;
                          const likes = preset.likes || [];
                          const hasLiked = likes.includes(currentUser.email);
                          const newLikes = hasLiked ? likes.filter(e => e !== currentUser.email) : [...likes, currentUser.email];
                          likeMutation.mutate({ preset, newLikes });
                        }}
                        className={`flex items-center gap-1 transition-all ${
                          (preset.likes || []).includes(currentUser?.email)
                            ? "text-rose-400"
                            : "text-white/30 hover:text-rose-400"
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${(preset.likes || []).includes(currentUser?.email) ? "fill-rose-400" : ""}`} />
                        {(preset.likes || []).length || 0}
                      </button>
                    </div>
                    <Button
                      onClick={() => importMutation.mutate(preset)}
                      disabled={importMutation.isPending}
                      size="sm"
                      className="bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-200 border-0 text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Import
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}