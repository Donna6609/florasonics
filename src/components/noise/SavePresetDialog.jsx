import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivityTracker } from "@/components/analytics/ActivityTracker";

export default function SavePresetDialog({ isOpen, onClose, activeSounds }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const activityTracker = useActivityTracker();

  const savePresetMutation = useMutation({
    mutationFn: (data) => base44.entities.Preset.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["presets"] });
      const previous = queryClient.getQueryData(["presets"]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        ...data,
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(["presets"], (old) => [optimistic, ...(old || [])]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(["presets"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      setName("");
      setDescription("");
      onClose();
    },
  });

  const handleSave = async () => {
    if (!name.trim()) return;

    const sound_configs = activeSounds.map((sound) => ({
      id: sound.id,
      volume: sound.volume,
    }));

    const user = await base44.auth.me().catch(() => null);

    await savePresetMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      sound_configs,
      is_curated: false,
      is_public: false,
      creator_name: user?.full_name || "Anonymous",
      share_code: `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
    });

    activityTracker.trackPresetSaved(name.trim(), sound_configs);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white/90">Save Soundscape</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Preset Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Morning Focus"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">
                    Description (optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this soundscape..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none h-20"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!name.trim() || savePresetMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savePresetMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}