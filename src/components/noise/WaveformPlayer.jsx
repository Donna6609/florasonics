import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function WaveformPlayer({ audioUrl, name, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [loopMode, setLoopMode] = useState("none"); // none, all, segment
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1.0); // 0.5 to 2.0 for pitch
  const [isDraggingLoop, setIsDraggingLoop] = useState(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      
      if (loopMode === "segment") {
        const loopEndTime = (loopEnd / 100) * audio.duration;
        if (audio.currentTime >= loopEndTime) {
          audio.currentTime = (loopStart / 100) * audio.duration;
        }
      }
    });

    audio.addEventListener("ended", () => {
      if (loopMode === "all") {
        audio.currentTime = 0;
        audio.play();
      } else {
        setIsPlaying(false);
      }
    });

    audio.volume = volume / 100;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl, loopMode, loopStart, loopEnd]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    const drawWaveform = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw waveform bars
      const barCount = 100;
      const barWidth = width / barCount;
      const progress = duration > 0 ? currentTime / duration : 0;

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const barHeight = (Math.sin(i * 0.5) * 0.4 + Math.random() * 0.6) * height * 0.6;
        const y = (height - barHeight) / 2;

        const inLoop = loopMode === "segment" && i >= loopStart && i <= loopEnd;
        const isPast = i / barCount < progress;

        ctx.fillStyle = isPast
          ? "rgba(99, 102, 241, 0.8)"
          : inLoop
          ? "rgba(139, 92, 246, 0.3)"
          : "rgba(255, 255, 255, 0.1)";

        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }

      // Draw loop markers
      if (loopMode === "segment") {
        ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
        ctx.fillRect((loopStart / 100) * width, 0, 2, height);
        ctx.fillRect((loopEnd / 100) * width, 0, 2, height);
      }

      // Draw playhead
      ctx.fillStyle = "rgba(99, 102, 241, 1)";
      ctx.fillRect(progress * width - 1, 0, 2, height);

      animationRef.current = requestAnimationFrame(drawWaveform);
    };

    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickPercent = (x / width) * 100;
      
      if (loopMode === "segment") {
        // Snap to nearest loop point if close
        const distToStart = Math.abs(clickPercent - loopStart);
        const distToEnd = Math.abs(clickPercent - loopEnd);
        
        if (distToStart < 5) {
          setIsDraggingLoop("start");
        } else if (distToEnd < 5) {
          setIsDraggingLoop("end");
        } else {
          handleSeek([clickPercent]);
        }
      } else {
        handleSeek([clickPercent]);
      }
    };

    const handleCanvasMove = (e) => {
      if (!isDraggingLoop) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const movePercent = Math.max(0, Math.min(100, (x / width) * 100));
      
      if (isDraggingLoop === "start") {
        setLoopStart(Math.min(movePercent, loopEnd - 1));
      } else if (isDraggingLoop === "end") {
        setLoopEnd(Math.max(movePercent, loopStart + 1));
      }
    };

    const handleCanvasUp = () => {
      setIsDraggingLoop(null);
    };

    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleCanvasMove);
    canvas.addEventListener("mouseup", handleCanvasUp);
    canvas.addEventListener("mouseleave", handleCanvasUp);

    drawWaveform();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleCanvasMove);
      canvas.removeEventListener("mouseup", handleCanvasUp);
      canvas.removeEventListener("mouseleave", handleCanvasUp);
    };
  }, [currentTime, duration, loopMode, loopStart, loopEnd, isDraggingLoop]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    const time = (value[0] / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const cycleLoopMode = () => {
    setLoopMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "segment";
      return "none";
    });
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white/90 truncate">{name}</h3>
          <p className="text-sm text-white/40 mt-1">{formatTime(duration)} total</p>
        </div>

        {/* Waveform */}
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            className="w-full h-24 rounded-lg cursor-pointer" 
            style={{ cursor: isDraggingLoop ? 'grabbing' : 'pointer' }}
          />
          {loopMode === "segment" && (
            <p className="text-xs text-white/40 mt-2 text-center">
              Click loop markers to adjust • Click waveform to seek
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Advanced Controls */}
        <div className="grid grid-cols-2 gap-3">
          {/* Loop Controls */}
          {loopMode === "segment" && (
            <div className="col-span-2 space-y-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-xs text-violet-300 font-medium">Loop Points</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Start</span>
                    <span>{formatTime((loopStart / 100) * duration)}</span>
                  </div>
                  <Slider
                    value={[loopStart]}
                    min={0}
                    max={loopEnd - 1}
                    step={0.1}
                    onValueChange={(val) => setLoopStart(val[0])}
                    className="[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>End</span>
                    <span>{formatTime((loopEnd / 100) * duration)}</span>
                  </div>
                  <Slider
                    value={[loopEnd]}
                    min={loopStart + 1}
                    max={100}
                    step={0.1}
                    onValueChange={(val) => setLoopEnd(val[0])}
                    className="[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pitch Control */}
          <div className="col-span-2 space-y-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex justify-between items-center">
              <p className="text-xs text-blue-300 font-medium">Pitch / Speed</p>
              <button
                onClick={() => setPlaybackRate(1.0)}
                className="text-[10px] text-blue-400/60 hover:text-blue-400 transition-all"
              >
                Reset
              </button>
            </div>
            <div className="space-y-1">
              <Slider
                value={[playbackRate]}
                min={0.5}
                max={2.0}
                step={0.05}
                onValueChange={(val) => setPlaybackRate(val[0])}
                className="[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
              />
              <div className="flex justify-between text-[10px] text-white/40">
                <span>0.5x</span>
                <span className="text-blue-400">{playbackRate.toFixed(2)}x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={skipBackward}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="currentColor" />}
            </button>
            <button
              onClick={skipForward}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleLoopMode}
              className={cn(
                "p-2 rounded-lg transition-all relative",
                loopMode !== "none"
                  ? "bg-violet-500/20 text-violet-400"
                  : "text-white/40 hover:text-white/60 hover:bg-white/10"
              )}
            >
              <Repeat className="w-5 h-5" />
              {loopMode === "segment" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                  A
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 w-32">
              <Volume2 className="w-4 h-4 text-white/40" />
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(val) => setVolume(val[0])}
                className="[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}