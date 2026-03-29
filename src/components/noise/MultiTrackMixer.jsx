import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Plus, Trash2, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MultiTrackMixer({ isOpen, onClose, downloads }) {
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const audioRefs = useRef({});

  useEffect(() => {
    // Stop all tracks when closing
    if (!isOpen) {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      setTracks([]);
      setIsPlaying(false);
    }
  }, [isOpen]);

  const addTrack = (download) => {
    if (tracks.some(t => t.id === download.id)) return;
    
    setTracks(prev => [...prev, {
      ...download,
      volume: 80,
      solo: false,
      mute: false,
    }]);
  };

  const removeTrack = (trackId) => {
    const audio = audioRefs.current[trackId];
    if (audio) {
      audio.pause();
      delete audioRefs.current[trackId];
    }
    setTracks(prev => prev.filter(t => t.id !== trackId));
  };

  const updateTrack = (trackId, updates) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updates } : t));
    
    const audio = audioRefs.current[trackId];
    if (audio && updates.volume !== undefined) {
      const hasSolo = tracks.some(t => t.solo);
      const track = tracks.find(t => t.id === trackId);
      
      if (track?.mute || (hasSolo && !track?.solo)) {
        audio.volume = 0;
      } else {
        audio.volume = (updates.volume / 100) * (masterVolume / 100);
      }
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      Object.values(audioRefs.current).forEach(audio => audio?.pause());
    } else {
      tracks.forEach(track => {
        let audio = audioRefs.current[track.id];
        if (!audio) {
          audio = new Audio(track.file_url);
          audio.loop = true;
          audioRefs.current[track.id] = audio;
        }
        
        const hasSolo = tracks.some(t => t.solo);
        if (track.mute || (hasSolo && !track.solo)) {
          audio.volume = 0;
        } else {
          audio.volume = (track.volume / 100) * (masterVolume / 100);
        }
        
        audio.play();
      });
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    // Update all volumes when master changes
    const hasSolo = tracks.some(t => t.solo);
    tracks.forEach(track => {
      const audio = audioRefs.current[track.id];
      if (audio) {
        if (track.mute || (hasSolo && !track.solo)) {
          audio.volume = 0;
        } else {
          audio.volume = (track.volume / 100) * (masterVolume / 100);
        }
      }
    });
  }, [masterVolume, tracks]);

  const availableDownloads = downloads.filter(d => !tracks.some(t => t.id === d.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] z-[70] mx-4"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-lg font-semibold text-white/90">Multi-Track Mixer</h3>
                  <p className="text-sm text-white/40 mt-0.5">Layer multiple soundscapes together</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Tracks */}
                {tracks.length > 0 ? (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/[0.08]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{track.name}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateTrack(track.id, { solo: !track.solo })}
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium transition-all",
                              track.solo
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-white/5 text-white/40 hover:text-white/60"
                            )}
                          >
                            S
                          </button>
                          <button
                            onClick={() => updateTrack(track.id, { mute: !track.mute })}
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium transition-all",
                              track.mute
                                ? "bg-red-500/20 text-red-400"
                                : "bg-white/5 text-white/40 hover:text-white/60"
                            )}
                          >
                            M
                          </button>
                        </div>

                        <div className="flex items-center gap-2 w-32">
                          <Volume2 className="w-3 h-3 text-white/40" />
                          <Slider
                            value={[track.volume]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(val) => updateTrack(track.id, { volume: val[0] })}
                            className="[&_[role=slider]]:h-2 [&_[role=slider]]:w-2"
                          />
                        </div>

                        <button
                          onClick={() => removeTrack(track.id)}
                          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/40">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Add tracks to start mixing</p>
                  </div>
                )}

                {/* Add Track Selector */}
                {availableDownloads.length > 0 && (
                  <div className="pt-4 border-t border-white/[0.08]">
                    <p className="text-xs text-white/40 mb-2">Add Track:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableDownloads.map((download) => (
                        <button
                          key={download.id}
                          onClick={() => addTrack(download)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.08] text-left transition-all"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span className="text-sm text-white/70 truncate">{download.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Master Controls */}
              <div className="p-6 border-t border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayPause}
                    disabled={tracks.length === 0}
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="currentColor" />}
                  </button>

                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs text-white/40 font-medium">Master</span>
                    <Slider
                      value={[masterVolume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(val) => setMasterVolume(val[0])}
                      className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                    />
                    <span className="text-xs text-white/60 w-8">{masterVolume}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}