import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderDown, Play, Trash2, ChevronDown, Clock, HardDrive, Download as DownloadIcon, Activity, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import WaveformPlayer from "./WaveformPlayer";
import MultiTrackMixer from "./MultiTrackMixer";

export default function DownloadsPanel({ downloads, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [playerDownload, setPlayerDownload] = useState(null);
  const [mixerOpen, setMixerOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DownloadedSound.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloads"] });
    },
  });

  const handlePlay = (download) => {
    if (playingId === download.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(download.file_url);
    audio.play();
    setPlayingId(download.id);

    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  const handleDelete = async (e, download) => {
    e.stopPropagation();
    if (confirm(`Delete "${download.name}"?`)) {
      await deleteMutation.mutateAsync(download.id);
    }
  };

  const handleDownload = (e, download) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = download.file_url;
    link.download = `${download.name}.wav`;
    link.click();
  };

  const openPlayer = (e, download) => {
    e.stopPropagation();
    setPlayerDownload(download);
  };

  return (
    <div className="relative flex gap-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300",
          "border backdrop-blur-xl text-sm font-medium",
          "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
        )}
      >
        <FolderDown className="w-4 h-4" />
        <span>Downloads</span>
        {downloads.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
            {downloads.length}
          </span>
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      {downloads.length > 1 && (
        <button
          onClick={() => setMixerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20"
        >
          <Layers className="w-4 h-4" />
          <span>Mix</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-3 right-0 w-96 p-3 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl max-h-96 overflow-y-auto"
          >
            {isLoading ? (
              <p className="text-white/40 text-sm text-center py-4">Loading...</p>
            ) : downloads.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">
                No downloads yet. Record a soundscape!
              </p>
            ) : (
              <div className="space-y-2">
                {downloads.map((download) => (
                  <div
                    key={download.id}
                    className="group rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] p-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">
                          {download.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-white/30" />
                            <p className="text-xs text-white/40">{download.duration_minutes}m</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-white/30" />
                            <p className="text-xs text-white/40">{download.file_size_mb} MB</p>
                          </div>
                        </div>
                        <p className="text-xs text-white/30 mt-1">
                          {format(new Date(download.created_date), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => openPlayer(e, download)}
                          className="p-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400/70 hover:text-violet-400 transition-all"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePlay(download)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            playingId === download.id
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/70 hover:text-blue-400"
                          )}
                        >
                          <Play className="w-4 h-4" fill={playingId === download.id ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, download)}
                          className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400/70 hover:text-green-400 transition-all"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, download)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waveform Player Modal */}
      <AnimatePresence>
        {playerDownload && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlayerDownload(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[60] mx-4"
            >
              <WaveformPlayer
                audioUrl={playerDownload.file_url}
                name={playerDownload.name}
                onClose={() => setPlayerDownload(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Multi-Track Mixer */}
      <MultiTrackMixer
        isOpen={mixerOpen}
        onClose={() => setMixerOpen(false)}
        downloads={downloads}
      />
    </div>
  );
}