import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Trash2, ChevronDown, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SharePresetDialog from "./SharePresetDialog";
import { usePullToRefresh } from "@/components/usePullToRefresh";

export default function PresetSelector({ presets, onSelectPreset, currentUser, isLoading, favorites, onToggleFavorite, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPresetToShare, setSelectedPresetToShare] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deletePresetMutation = useMutation({
    mutationFn: (id) => base44.entities.Preset.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["presets"] });
      const previous = queryClient.getQueryData(["presets"]);
      queryClient.setQueryData(["presets"], (old) => (old || []).filter((p) => p.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["presets"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });

  const handleDelete = (e, preset) => {
    e.stopPropagation();
    if (confirm(`Delete preset "${preset.name}"?`)) {
      deletePresetMutation.mutate(preset.id);
    }
  };

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(onRefresh ?? (() => Promise.resolve()));

  const curatedPresets = presets.filter((p) => p.is_curated);
  const userPresets = presets.filter((p) => !p.is_curated && p.created_by === currentUser?.email);

  const isFavorite = (presetId) => {
    return favorites.some((f) => f.type === "preset" && f.item_id === presetId);
  };

  const handleShare = (e, preset) => {
    e.stopPropagation();
    setSelectedPresetToShare(preset);
    setShareDialogOpen(true);
  };

  return (
    <>
      <div className="relative flex gap-2">
        <button
          onClick={() => navigate(createPageUrl("CommunityPresets"))}
          aria-label="Browse community presets"
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 min-h-[44px]",
            "border backdrop-blur-xl text-sm font-medium",
            "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Community</span>
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="My presets"
          aria-expanded={isOpen}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 min-h-[44px]",
            "border backdrop-blur-xl text-sm font-medium",
            "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Presets</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
        </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-3 left-0 w-72 p-3 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl max-h-96 overflow-y-auto"
            {...pullHandlers}
          >
            <PullIndicator />
            {isLoading ? (
              <p className="text-white/40 text-sm text-center py-4">Loading...</p>
            ) : (
              <>
                {/* Curated Presets */}
                {curatedPresets.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 px-2 mb-2">
                      <Heart className="w-3.5 h-3.5 text-pink-400/60" />
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Curated
                      </p>
                    </div>
                    <div className="space-y-1">
                      {curatedPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="group flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/10 transition-all"
                        >
                          <button
                            onClick={() => {
                              onSelectPreset(preset);
                              setIsOpen(false);
                            }}
                            className="flex-1 text-left"
                          >
                            <p className="text-sm font-medium group-hover:text-white">{preset.name}</p>
                            {preset.description && (
                              <p className="text-xs text-white/40 mt-0.5">{preset.description}</p>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(preset);
                            }}
                            aria-label={isFavorite(preset.id) ? `Remove ${preset.name} from favorites` : `Add ${preset.name} to favorites`}
                            aria-pressed={isFavorite(preset.id)}
                            className={cn(
                              "p-2.5 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center",
                              isFavorite(preset.id)
                                ? "text-pink-400 bg-pink-500/20"
                                : "opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 text-pink-400/60 hover:text-pink-400"
                            )}
                          >
                            <Heart className="w-3.5 h-3.5" fill={isFavorite(preset.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Presets */}
                {userPresets.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400/60" />
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        My Presets
                      </p>
                    </div>
                    <div className="space-y-1">
                      {userPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 transition-all group"
                        >
                          <button
                            onClick={() => {
                              onSelectPreset(preset);
                              setIsOpen(false);
                            }}
                            className="flex-1 text-left"
                          >
                            <p className="text-sm font-medium group-hover:text-white">{preset.name}</p>
                            {preset.description && (
                              <p className="text-xs text-white/40 mt-0.5">{preset.description}</p>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(preset);
                            }}
                            aria-label={isFavorite(preset.id) ? `Remove ${preset.name} from favorites` : `Add ${preset.name} to favorites`}
                            aria-pressed={isFavorite(preset.id)}
                            className={cn(
                              "p-2.5 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center",
                              isFavorite(preset.id)
                                ? "text-pink-400 bg-pink-500/20"
                                : "opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 text-pink-400/60 hover:text-pink-400"
                            )}
                          >
                            <Heart className="w-3.5 h-3.5" fill={isFavorite(preset.id) ? "currentColor" : "none"} />
                          </button>
                          <button
                            onClick={(e) => handleShare(e, preset)}
                            aria-label={`Share ${preset.name}`}
                            className="opacity-0 group-hover:opacity-100 p-2.5 rounded-lg hover:bg-blue-500/20 text-blue-400/60 hover:text-blue-400 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, preset)}
                            aria-label={`Delete ${preset.name}`}
                            className="opacity-0 group-hover:opacity-100 p-2.5 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {presets.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-4">
                    No presets yet. Save your first soundscape!
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <SharePresetDialog
        isOpen={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setSelectedPresetToShare(null);
        }}
        preset={selectedPresetToShare}
      />
    </>
  );
}