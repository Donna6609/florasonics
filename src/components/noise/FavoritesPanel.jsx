import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, ChevronDown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function FavoritesPanel({ 
  favorites, 
  isLoading, 
  onSelectSound, 
  onSelectPreset,
  currentUser 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const removeFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const previous = queryClient.getQueryData(["favorites"]);
      queryClient.setQueryData(["favorites"], (old) => (old || []).filter((f) => f.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["favorites"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const handleRemove = (e, favorite) => {
    e.stopPropagation();
    if (!favorite.id || String(favorite.id).startsWith("temp-")) return;
    removeFavoriteMutation.mutate(favorite.id);
  };

  const soundFavorites = favorites.filter((f) => f.type === "sound");
  const presetFavorites = favorites.filter((f) => f.type === "preset");

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Favorites${favorites.length > 0 ? `, ${favorites.length} saved` : ""}`}
        aria-expanded={isOpen}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 min-h-[44px]",
          "border backdrop-blur-xl text-sm font-medium",
          "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
        )}
      >
        <Heart className="w-4 h-4" />
        <span>Favorites</span>
        {favorites.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs">
            {favorites.length}
          </span>
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-3 left-0 w-80 p-3 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl max-h-[400px] overflow-y-auto"
          >
            {isLoading ? (
              <p className="text-white/40 text-sm text-center py-4">Loading...</p>
            ) : favorites.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No favorites yet</p>
                <p className="text-white/25 text-xs mt-1">
                  Tap the ♡ on sounds or presets to save them here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Favorite Sounds */}
                {soundFavorites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-2">
                      <Star className="w-3.5 h-3.5 text-amber-400/60" />
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Sounds
                      </p>
                    </div>
                    <div className="space-y-1">
                      {soundFavorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                        >
                          <button
                            onClick={() => onSelectSound(fav.item_id)}
                            className="flex-1 flex items-center gap-3"
                          >
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${fav.metadata?.color}20` }}
                            >
                              <div className="w-4 h-4" style={{ color: fav.metadata?.color }}>
                                {fav.metadata?.icon === "cloud-rain" && "🌧️"}
                                {fav.metadata?.icon === "waves" && "🌊"}
                                {fav.metadata?.icon === "wind" && "💨"}
                                {fav.metadata?.icon === "trees" && "🌲"}
                                {fav.metadata?.icon === "flame" && "🔥"}
                                {fav.metadata?.icon === "bird" && "🐦"}
                                {fav.metadata?.icon === "zap" && "⚡"}
                                {fav.metadata?.icon === "coffee" && "☕"}
                                {fav.metadata?.icon === "moon" && "🌙"}
                                {fav.metadata?.icon === "train-front" && "🚂"}
                                {fav.metadata?.icon === "droplet" && "💧"}
                                {fav.metadata?.icon === "fan" && "🌀"}
                              </div>
                            </div>
                            <span className="text-sm text-white/70 group-hover:text-white">
                              {fav.name}
                            </span>
                          </button>
                          <button
                            onClick={(e) => handleRemove(e, fav)}
                            aria-label={`Remove ${fav.name} from favorites`}
                            className="opacity-0 group-hover:opacity-100 p-2.5 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Heart className="w-4 h-4" fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorite Presets */}
                {presetFavorites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-2">
                      <Star className="w-3.5 h-3.5 text-purple-400/60" />
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Presets
                      </p>
                    </div>
                    <div className="space-y-1">
                      {presetFavorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                        >
                          <button
                            onClick={() => onSelectPreset(fav.item_id)}
                            className="flex-1 text-left"
                          >
                            <p className="text-sm font-medium text-white/70 group-hover:text-white">
                              {fav.name}
                            </p>
                            {fav.metadata?.description && (
                              <p className="text-xs text-white/40 mt-0.5">{fav.metadata.description}</p>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleRemove(e, fav)}
                            aria-label={`Remove ${fav.name} preset from favorites`}
                            className="opacity-0 group-hover:opacity-100 p-2.5 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Heart className="w-4 h-4" fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}