import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, ChevronDown, X, Calendar, Tag, Cloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const MOODS = [
  { id: "peaceful", emoji: "🌿", label: "Peaceful" },
  { id: "energized", emoji: "⚡", label: "Energized" },
  { id: "reflective", emoji: "🌊", label: "Reflective" },
  { id: "anxious", emoji: "🌪️", label: "Anxious" },
  { id: "grateful", emoji: "🌸", label: "Grateful" },
  { id: "tired", emoji: "🌙", label: "Tired" },
  { id: "inspired", emoji: "✨", label: "Inspired" },
];

const WEATHER = [
  { id: "sunny", emoji: "☀️" },
  { id: "cloudy", emoji: "☁️" },
  { id: "rainy", emoji: "🌧️" },
  { id: "stormy", emoji: "⛈️" },
  { id: "snowy", emoji: "❄️" },
  { id: "foggy", emoji: "🌫️" },
  { id: "windy", emoji: "💨" },
];

export default function NatureJournal({ activeSounds }) {
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({
    entry_text: "",
    nature_observation: "",
    mood: "",
    weather: "",
  });

  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["journal"],
    queryFn: () => base44.entities.NatureJournal.list("-entry_date", 10),
    enabled: open,
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.NatureJournal.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["journal"] });
      const previous = queryClient.getQueryData(["journal"]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        ...data,
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(["journal"], (old) => [optimistic, ...(old || [])]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(["journal"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      toast.success("Journal entry saved 🌿");
      setWriting(false);
      setForm({ entry_text: "", nature_observation: "", mood: "", weather: "" });
    },
  });

  const handleSave = () => {
    if (!form.entry_text.trim()) return toast.error("Write something first!");
    saveMutation.mutate({
      ...form,
      entry_date: format(new Date(), "yyyy-MM-dd"),
      sounds_active: activeSounds.map((s) => s.id),
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
      >
        <BookOpen className="w-4 h-4" />
        <span>Nature Journal</span>
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
              className="relative w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📖</span>
                  <h2 className="text-white/90 font-semibold">Nature Journal</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWriting(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-medium hover:bg-emerald-600/40 transition-all"
                  >
                    <Plus className="w-3 h-3" /> New Entry
                  </button>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-all">
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>

              <div 
                className="overflow-y-auto flex-1"
                role="region"
                aria-live="polite"
                aria-label="Journal entries"
              >
                {/* Write new entry */}
                <AnimatePresence>
                  {writing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-b border-white/[0.08]"
                    >
                      <div className="p-5 space-y-4">
                        <p className="text-white/40 text-xs">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>

                        {/* Mood */}
                        <div>
                          <label className="text-white/40 text-xs mb-2 block">How are you feeling?</label>
                          <div className="flex flex-wrap gap-2">
                            {MOODS.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setForm((f) => ({ ...f, mood: m.id }))}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all ${
                                  form.mood === m.id
                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                    : "bg-white/[0.04] border-white/10 text-white/50 hover:border-white/20"
                                }`}
                              >
                                {m.emoji} {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Weather */}
                        <div>
                          <label className="text-white/40 text-xs mb-2 block">Weather today?</label>
                          <div className="flex gap-2">
                            {WEATHER.map((w) => (
                              <button
                                key={w.id}
                                onClick={() => setForm((f) => ({ ...f, weather: w.id }))}
                                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                                  form.weather === w.id
                                    ? "bg-emerald-500/20 border-emerald-500/50"
                                    : "bg-white/[0.04] border-white/10 hover:border-white/20"
                                }`}
                              >
                                {w.emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Entry */}
                        <div>
                          <label className="text-white/40 text-xs mb-2 block">Today's reflection</label>
                          <textarea
                            value={form.entry_text}
                            onChange={(e) => setForm((f) => ({ ...f, entry_text: e.target.value }))}
                            placeholder="What's on your mind today? How did the sounds make you feel?..."
                            rows={4}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-emerald-500/40"
                          />
                        </div>

                        {/* Nature observation */}
                        <div>
                          <label className="text-white/40 text-xs mb-2 block">Nature gratitude / observation (optional)</label>
                          <input
                            value={form.nature_observation}
                            onChange={(e) => setForm((f) => ({ ...f, nature_observation: e.target.value }))}
                            placeholder="e.g. Noticed birds singing outside..."
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-emerald-500/40"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setWriting(false)}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/[0.05] transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-50"
                          >
                            {saveMutation.isPending ? "Saving..." : "Save Entry 🌿"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Past entries with aria-live for new entries */}
                  <div 
                    className="p-5 space-y-3"
                    role="region"
                    aria-live="polite"
                    aria-label="Past journal entries"
                    aria-atomic="false"
                  >
                  {entries.length === 0 && !writing && (
                    <div className="text-center py-10 text-white/30 text-sm">
                      <div className="text-4xl mb-3">🌱</div>
                      Start your nature journal today
                    </div>
                  )}
                  {entries.map((entry) => {
                    const mood = MOODS.find((m) => m.id === entry.mood);
                    const weather = WEATHER.find((w) => w.id === entry.weather);
                    return (
                      <div key={entry.id} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {mood && <span>{mood.emoji}</span>}
                          {weather && <span className="text-sm">{weather.emoji}</span>}
                          <span className="text-xs text-white/30 ml-auto">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {entry.entry_date}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{entry.entry_text}</p>
                        {entry.nature_observation && (
                          <p className="text-xs text-emerald-400/70 mt-2 italic">🌿 {entry.nature_observation}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}