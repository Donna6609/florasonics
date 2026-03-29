import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Plus, X, Check, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SOUNDS } from "@/components/noise/SoundMixer";

const PROFILE_PRESETS = [
  { name: "Focus", emoji: "🎯", sounds: [{ id: "rain", volume: 60 }, { id: "fan", volume: 40 }] },
  { name: "Sleep", emoji: "🌙", sounds: [{ id: "ocean", volume: 50 }, { id: "night", volume: 70 }, { id: "rain", volume: 30 }] },
  { name: "Morning", emoji: "🌅", sounds: [{ id: "birds", volume: 65 }, { id: "stream", volume: 45 }, { id: "wind", volume: 25 }] },
  { name: "Meditate", emoji: "🧘", sounds: [{ id: "forest", volume: 55 }, { id: "stream", volume: 40 }] },
];

export default function SoundProfiles({ activeSounds, onLoadProfile }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [profileName, setProfileName] = useState("");

  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ["presets", "profiles"],
    queryFn: () => base44.entities.Preset.list("-created_date"),
    enabled: open,
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Preset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      toast.success("Sound profile saved 🎵");
      setCreating(false);
      setProfileName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Preset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presets"] }),
  });

  const handleSave = () => {
    if (!profileName.trim()) return toast.error("Give your profile a name!");
    if (activeSounds.length === 0) return toast.error("Play some sounds first!");
    saveMutation.mutate({
      name: profileName,
      sound_configs: activeSounds.map((s) => ({ id: s.id, volume: s.volume })),
      is_public: false,
    });
  };

  const handleLoadBuiltIn = (preset) => {
    onLoadProfile({ sound_configs: preset.sounds, name: preset.name });
    toast.success(`Loaded ${preset.emoji} ${preset.name} profile`);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
      >
        <User className="w-4 h-4" />
        <span>Sound Profiles</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-full max-w-md bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden max-h-[80vh] flex flex-col"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎵</span>
                  <h2 className="text-white/90 font-semibold">Sound Profiles</h2>
                </div>
                <div className="flex items-center gap-2">
                  {activeSounds.length > 0 && (
                    <button
                      onClick={() => setCreating(!creating)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-medium hover:bg-emerald-600/40 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Save Current
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-all">
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Save form */}
                <AnimatePresence>
                  {creating && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                        <p className="text-xs text-white/40">Saving {activeSounds.length} active sound{activeSounds.length > 1 ? "s" : ""}</p>
                        <input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Profile name (e.g. Late night reading)..."
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-emerald-500/40"
                          onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setCreating(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-white/40 text-sm hover:bg-white/5 transition-all">Cancel</button>
                          <button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-all disabled:opacity-50">Save</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Built-in profiles */}
                <div>
                  <p className="text-xs text-white/30 mb-2 uppercase tracking-wide">Quick Profiles</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PROFILE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleLoadBuiltIn(preset)}
                        className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all text-left"
                      >
                        <span className="text-2xl">{preset.emoji}</span>
                        <div>
                          <div className="text-sm text-white/80">{preset.name}</div>
                          <div className="text-[10px] text-white/30">{preset.sounds.length} sounds</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* User profiles */}
                {profiles.length > 0 && (
                  <div>
                    <p className="text-xs text-white/30 mb-2 uppercase tracking-wide">My Profiles</p>
                    <div className="space-y-2">
                      {profiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] transition-all"
                        >
                          <button
                            className="flex-1 text-left"
                            onClick={() => { onLoadProfile(profile); toast.success(`Loaded: ${profile.name}`); setOpen(false); }}
                          >
                            <div className="text-sm text-white/80">{profile.name}</div>
                            <div className="text-[10px] text-white/30">
                              {profile.sound_configs?.map((sc) => {
                                const s = SOUNDS.find((s) => s.id === sc.id);
                                return s?.label;
                              }).filter(Boolean).join(", ")}
                            </div>
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(profile.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}