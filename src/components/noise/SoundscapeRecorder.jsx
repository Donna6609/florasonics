import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import WorkerPool from "@/lib/WorkerPool";

// Persistent pool for recording downloads
let recordingWorkerPool = null;
function getRecordingWorkerPool() {
  if (!recordingWorkerPool) {
    recordingWorkerPool = new WorkerPool("/src/workers/audioBufferWorker.js", 3);
  }
  return recordingWorkerPool;
}

// Map sound IDs to the noise type the worker already knows how to generate
function getNoiseType(soundId) {
  if (["rain", "fire", "thunder", "train"].includes(soundId)) return "brown";
  if (["ocean", "stream"].includes(soundId)) return "pink";
  return "white";
}

// Generate buffer via WorkerPool for recordings
function createNoiseBufferViaWorker(ctx, soundId, durationSec, taskId) {
  return new Promise((resolve, reject) => {
    const pool = getRecordingWorkerPool();
    const noiseType = getNoiseType(soundId);
    
    pool.executeTask(taskId, { type: noiseType, sampleRate: ctx.sampleRate, durationSec })
      .then((result) => {
        const { ch0, ch1 } = result;
        const buffer = ctx.createBuffer(2, ch0.length, ctx.sampleRate);
        buffer.copyToChannel(ch0, 0);
        buffer.copyToChannel(ch1, 1);
        resolve(buffer);
      })
      .catch((err) => {
        console.error('Recording worker pool error:', err);
        reject(err);
      });
  });
}

function getFilterSettings(soundId) {
  const settings = {
    rain: { type: "lowpass", frequency: 800, Q: 0.5 },
    ocean: { type: "lowpass", frequency: 400, Q: 0.7 },
    wind: { type: "bandpass", frequency: 600, Q: 0.3 },
    forest: { type: "bandpass", frequency: 2000, Q: 0.5 },
    fire: { type: "lowpass", frequency: 300, Q: 1.0 },
    birds: { type: "highpass", frequency: 2500, Q: 0.4 },
    thunder: { type: "lowpass", frequency: 200, Q: 1.2 },
    cafe: { type: "bandpass", frequency: 1200, Q: 0.2 },
    night: { type: "bandpass", frequency: 3000, Q: 0.3 },
    train: { type: "lowpass", frequency: 500, Q: 0.8 },
    stream: { type: "highpass", frequency: 1500, Q: 0.4 },
    fan: { type: "lowpass", frequency: 1000, Q: 0.3 },
  };
  return settings[soundId] || { type: "lowpass", frequency: 1000, Q: 0.5 };
}

export default function SoundscapeRecorder({ activeSounds, isOpen, onClose, userTier }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("10");
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Premium users get free downloads, others need to pay
    setRequiresPayment(userTier !== "premium");
  }, [userTier]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.DownloadedSound.create(data),
    onMutate: async (newSound) => {
      await queryClient.cancelQueries({ queryKey: ["downloads"] });
      const previous = queryClient.getQueryData(["downloads"]);
      queryClient.setQueryData(["downloads"], (old) => [{ ...newSound, id: `temp_${Date.now()}` }, ...(old || [])]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(["downloads"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["downloads"] });
      setName("");
      setDuration("10");
      onClose();
    },
  });

  const handlePurchaseDownload = async () => {
    try {
      // Check if running in iframe (preview mode)
      if (window.self !== window.top) {
        toast.error("Checkout only works from published apps. Please publish your app first.");
        return;
      }

      const { data } = await base44.functions.invoke('createDownloadCheckout', {
        downloadId: `temp_${Date.now()}`,
        successUrl: window.location.href + "?download_paid=true",
        cancelUrl: window.location.href,
      });

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    }
  };

  const handleRecord = useCallback(async () => {
    if (!name.trim() || activeSounds.length === 0) return;

    if (requiresPayment) {
      toast.error("Please complete payment to download");
      return;
    }

    setIsRecording(true);
    setProgress(0);

    try {
      const durationMinutes = parseInt(duration);
      const durationSeconds = durationMinutes * 60;
      const sampleRate = 44100;

      const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);
      const masterGain = offlineCtx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(offlineCtx.destination);

      // Generate all buffers off the main thread in parallel via pool
          const buffers = await Promise.all(
            activeSounds.map((sound) => createNoiseBufferViaWorker(offlineCtx, sound.id, durationSeconds, sound.id))
          );

      activeSounds.forEach((sound, idx) => {
        const buffer = buffers[idx];
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        const filter = offlineCtx.createBiquadFilter();
        const filterSettings = getFilterSettings(sound.id);
        filter.type = filterSettings.type;
        filter.frequency.value = filterSettings.frequency;
        filter.Q.value = filterSettings.Q;

        const gain = offlineCtx.createGain();
        gain.gain.value = sound.volume / 100;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        source.start();
      });

      const renderedBuffer = await offlineCtx.startRendering();

      const wavBlob = await bufferToWave(renderedBuffer, renderedBuffer.length);
      const file = new File([wavBlob], `${name}.wav`, { type: "audio/wav" });

      setProgress(50);

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setProgress(75);

      const fileSizeMB = (wavBlob.size / (1024 * 1024)).toFixed(2);

      await saveMutation.mutateAsync({
        name: name.trim(),
        file_url,
        sound_configs: activeSounds.map((s) => ({ id: s.id, volume: s.volume })),
        duration_minutes: durationMinutes,
        file_size_mb: parseFloat(fileSizeMB),
      });

      setProgress(100);
    } catch (error) {
      console.error("Recording failed:", error);
      alert("Failed to record soundscape. Please try again.");
    } finally {
      setIsRecording(false);
      setProgress(0);
    }
  }, [name, duration, activeSounds, requiresPayment, saveMutation, onClose]);

  function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white/90">Download Soundscape</h3>
                <button
                  onClick={onClose}
                  disabled={isRecording}
                  aria-label="Close"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-white/60 hover:text-white/90 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/75 mb-1.5 block">Recording Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Evening Relaxation"
                    disabled={isRecording}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/75 mb-1.5 block">Duration</label>
                  <Select value={duration} onValueChange={setDuration} disabled={isRecording}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isRecording && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Recording...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {requiresPayment && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/60 text-center">Choose your option:</p>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                      <p className="text-sm text-white/80 mb-3">
                        💎 One-time purchase: $1.99
                      </p>
                      <Button
                        onClick={handlePurchaseDownload}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy This Download
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-slate-900 px-2 text-white/40">or</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                      <p className="text-sm text-white/80 mb-2">
                        ⭐ Premium: Unlimited downloads
                      </p>
                      <p className="text-xs text-white/50 mb-3">
                        Plus AI meditation, advanced features & more
                      </p>
                      <Button
                        onClick={() => {
                          onClose();
                          window.dispatchEvent(new CustomEvent('upgrade-premium'));
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isRecording}
                    className="flex-1 bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecord}
                    disabled={!name.trim() || isRecording || activeSounds.length === 0 || requiresPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {isRecording ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {requiresPayment ? "Payment Required" : "Download"}
                      </>
                    )}
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