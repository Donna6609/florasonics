import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Play, Pause, Download, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const FOCUS_AREAS = [
  { value: "stress_relief", label: "Stress Relief" },
  { value: "sleep", label: "Better Sleep" },
  { value: "focus", label: "Focus & Clarity" },
  { value: "anxiety", label: "Anxiety Relief" },
  { value: "energy", label: "Energy Boost" },
  { value: "gratitude", label: "Gratitude & Positivity" },
];

const NARRATOR_STYLES = [
  { value: "calm_female", label: "Calm Female Voice" },
  { value: "soothing_male", label: "Soothing Male Voice" },
  { value: "gentle_neutral", label: "Gentle Neutral Voice" },
];

export default function AIGuidedMeditation({ isOpen, onClose }) {
  const [duration, setDuration] = useState(10);
  const [focus, setFocus] = useState("stress_relief");
  const [narratorStyle, setNarratorStyle] = useState("calm_female");
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a ${duration}-minute guided meditation script focused on ${focus.replace("_", " ")}.

The meditation should:
- Have a gentle, calming introduction
- Include specific breathing exercises
- Use visualization techniques
- Build progressively throughout the session
- End with a peaceful grounding exercise
- Be narrated in a ${narratorStyle.replace("_", " ")} style
- Include natural pauses (mark with [pause 3s] for 3 second pauses)

The script should be conversational, warm, and use "you" to address the listener.
Format it as a continuous narration script that flows naturally when read aloud.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            script: { type: "string" },
            duration_minutes: { type: "number" },
          },
        },
      });

      setScript(result);
      toast.success("Meditation script generated!");
    } catch (error) {
      toast.error("Failed to generate meditation script");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!script) return;

    if (isPlaying && utterance) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setUtterance(null);
    } else {
      // Clean pauses from script for TTS
      const cleanScript = script.script.replace(/\[pause \d+s\]/g, "");
      
      const newUtterance = new SpeechSynthesisUtterance(cleanScript);
      
      // Select voice based on narrator style
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices[0];
      
      if (narratorStyle.includes("female")) {
        selectedVoice = voices.find((v) => v.name.includes("Female") || v.name.includes("Samantha")) || voices[0];
      } else if (narratorStyle.includes("male")) {
        selectedVoice = voices.find((v) => v.name.includes("Male") || v.name.includes("Daniel")) || voices[0];
      }
      
      newUtterance.voice = selectedVoice;
      newUtterance.rate = 0.8; // Slower, more calming pace
      newUtterance.pitch = 1.0;
      newUtterance.volume = 1.0;

      newUtterance.onend = () => {
        setIsPlaying(false);
        setUtterance(null);
        toast.success("Meditation complete!");
      };

      newUtterance.onerror = () => {
        setIsPlaying(false);
        setUtterance(null);
        toast.error("Audio playback error");
      };

      window.speechSynthesis.speak(newUtterance);
      setUtterance(newUtterance);
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!script) return;
    
    const blob = new Blob([script.script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Script downloaded!");
  };

  const handleClose = () => {
    if (isPlaying && utterance) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setUtterance(null);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white/90">AI Guided Meditation</h3>
                    <p className="text-sm text-white/40">Personalized meditation experience</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!script ? (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Duration</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[duration]}
                        onValueChange={([value]) => setDuration(value)}
                        min={5}
                        max={30}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-white/90 font-medium w-16 text-right">{duration} min</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Focus Area</label>
                    <Select value={focus} onValueChange={setFocus}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOCUS_AREAS.map((area) => (
                          <SelectItem key={area.value} value={area.value}>
                            {area.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Narrator Style</label>
                    <Select value={narratorStyle} onValueChange={setNarratorStyle}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NARRATOR_STYLES.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generating ? "Generating..." : "Generate Meditation"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <h4 className="text-lg font-semibold text-white/90 mb-2">{script.title}</h4>
                    <p className="text-sm text-white/60 mb-4">
                      {script.duration_minutes} minute meditation
                    </p>
                    <div className="max-h-64 overflow-y-auto text-sm text-white/70 leading-relaxed space-y-2">
                      {script.script.split("\n\n").map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handlePlayPause}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play Audio
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={() => {
                      setScript(null);
                      if (isPlaying) {
                        window.speechSynthesis.cancel();
                        setIsPlaying(false);
                        setUtterance(null);
                      }
                    }}
                    variant="outline"
                    className="w-full bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    Generate New Meditation
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}