import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Trash2, HardDrive, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SOUNDS } from "@/components/noise/SoundMixer";

const MEDITATION_TYPES = [
  { id: "body_scan", name: "Body Scan", duration: 10 },
  { id: "mindfulness", name: "Mindfulness", duration: 15 },
  { id: "loving_kindness", name: "Loving Kindness", duration: 12 },
];

const BREATHING_TYPES = [
  { id: "box", name: "Box Breathing" },
  { id: "478", name: "4-7-8 Breathing" },
  { id: "calm", name: "Calm Breathing" },
];

export default function DownloadManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("soundscapes");

  const queryClient = useQueryClient();

  const { data: downloadedSounds = [] } = useQuery({
    queryKey: ["downloads"],
    queryFn: () => base44.entities.DownloadedSound.list("-created_date"),
    initialData: [],
  });

  const { data: downloadedWellness = [] } = useQuery({
    queryKey: ["downloadedWellness"],
    queryFn: () => base44.entities.DownloadedWellnessContent.list("-created_date"),
    initialData: [],
  });

  const downloadWellnessMutation = useMutation({
    mutationFn: (data) => base44.entities.DownloadedWellnessContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloadedWellness"] });
      toast.success("Content downloaded for offline use");
    },
  });

  const deleteWellnessMutation = useMutation({
    mutationFn: (id) => base44.entities.DownloadedWellnessContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloadedWellness"] });
      toast.success("Content removed");
    },
  });

  const deleteSoundMutation = useMutation({
    mutationFn: (id) => base44.entities.DownloadedSound.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloads"] });
      toast.success("Soundscape removed");
    },
  });

  const handleDownloadMeditation = (meditation) => {
    downloadWellnessMutation.mutate({
      content_type: "meditation",
      content_id: meditation.id,
      name: meditation.name,
      metadata: { duration: meditation.duration },
      file_size_mb: 0.5,
    });
  };

  const handleDownloadBreathing = (breathing) => {
    downloadWellnessMutation.mutate({
      content_type: "breathing",
      content_id: breathing.id,
      name: breathing.name,
      metadata: {},
      file_size_mb: 0.1,
    });
  };

  const totalSize = 
    downloadedSounds.reduce((sum, s) => sum + (s.file_size_mb || 0), 0) +
    downloadedWellness.reduce((sum, w) => sum + (w.file_size_mb || 0), 0);

  const isDownloaded = (type, id) => {
    return downloadedWellness.some(w => w.content_type === type && w.content_id === id);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
      >
        <Download className="w-4 h-4" />
        <span>Offline</span>
        {(downloadedSounds.length + downloadedWellness.length) > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-xs text-green-300">
            {downloadedSounds.length + downloadedWellness.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-slate-900/95 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-all"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Download className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white/90">Offline Content</h2>
                  <p className="text-sm text-white/50">Manage downloads for offline use</p>
                </div>
              </div>

              {/* Storage Info */}
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-white/50" />
                    <div>
                      <p className="text-white/90 font-medium">Storage Used</p>
                      <p className="text-xs text-white/50">
                        {totalSize.toFixed(1)} MB • {downloadedSounds.length + downloadedWellness.length} items
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab("soundscapes")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    activeTab === "soundscapes"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-white/[0.06] text-white/50 hover:bg-white/[0.1]"
                  )}
                >
                  Soundscapes ({downloadedSounds.length})
                </button>
                <button
                  onClick={() => setActiveTab("meditations")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    activeTab === "meditations"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-white/[0.06] text-white/50 hover:bg-white/[0.1]"
                  )}
                >
                  Meditations ({downloadedWellness.filter(w => w.content_type === "meditation").length})
                </button>
                <button
                  onClick={() => setActiveTab("breathing")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    activeTab === "breathing"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-white/[0.06] text-white/50 hover:bg-white/[0.1]"
                  )}
                >
                  Breathing ({downloadedWellness.filter(w => w.content_type === "breathing").length})
                </button>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {activeTab === "soundscapes" && (
                  <>
                    {downloadedSounds.length === 0 ? (
                      <p className="text-center text-white/40 py-8">No downloaded soundscapes</p>
                    ) : (
                      downloadedSounds.map((sound) => (
                        <div
                          key={sound.id}
                          className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white/90 font-medium">{sound.name}</p>
                            <p className="text-xs text-white/50">
                              {sound.duration_minutes} min • {sound.file_size_mb?.toFixed(1) || 0} MB
                            </p>
                          </div>
                          <button
                            onClick={() => deleteSoundMutation.mutate(sound.id)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === "meditations" && (
                  <>
                    <h3 className="text-sm text-white/50 mb-3">Available Meditations</h3>
                    {MEDITATION_TYPES.map((meditation) => {
                      const downloaded = isDownloaded("meditation", meditation.id);
                      return (
                        <div
                          key={meditation.id}
                          className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white/90 font-medium">{meditation.name}</p>
                            <p className="text-xs text-white/50">{meditation.duration} minutes</p>
                          </div>
                          {downloaded ? (
                            <button
                              onClick={() => {
                                const item = downloadedWellness.find(
                                  w => w.content_type === "meditation" && w.content_id === meditation.id
                                );
                                if (item) deleteWellnessMutation.mutate(item.id);
                              }}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDownloadMeditation(meditation)}
                              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {activeTab === "breathing" && (
                  <>
                    <h3 className="text-sm text-white/50 mb-3">Available Breathing Exercises</h3>
                    {BREATHING_TYPES.map((breathing) => {
                      const downloaded = isDownloaded("breathing", breathing.id);
                      return (
                        <div
                          key={breathing.id}
                          className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white/90 font-medium">{breathing.name}</p>
                            <p className="text-xs text-white/50">Guided breathing exercise</p>
                          </div>
                          {downloaded ? (
                            <button
                              onClick={() => {
                                const item = downloadedWellness.find(
                                  w => w.content_type === "breathing" && w.content_id === breathing.id
                                );
                                if (item) deleteWellnessMutation.mutate(item.id);
                              }}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDownloadBreathing(breathing)}
                              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}