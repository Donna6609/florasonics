import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Calm forest with distant thunder",
  "Cozy cafe on a rainy day",
  "Ocean waves at sunset",
  "Peaceful night with crickets",
  "Working from home with coffee shop ambience",
];

export default function AISoundscapeGenerator({ isOpen, onClose, onGenerate }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const availableSounds = [
        { id: "rain", description: "Rain sounds, gentle to heavy rainfall" },
        { id: "ocean", description: "Ocean waves, beach sounds" },
        { id: "wind", description: "Wind sounds, breezy atmosphere" },
        { id: "forest", description: "Forest ambience, nature sounds" },
        { id: "fire", description: "Fireplace crackling, warm cozy fire" },
        { id: "birds", description: "Bird chirping, songbirds" },
        { id: "thunder", description: "Thunder rumbling, distant storm" },
        { id: "cafe", description: "Coffee shop ambience, people chatting" },
        { id: "night", description: "Night sounds, crickets, calm evening" },
        { id: "train", description: "Train sounds, rhythmic travel" },
        { id: "stream", description: "Flowing water, babbling brook" },
        { id: "fan", description: "White noise, fan sounds" },
      ];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert sound designer. Based on the user's description, select appropriate sounds and set their volumes to create the perfect soundscape.

User's description: "${prompt}"

Available sounds:
${availableSounds.map((s) => `- ${s.id}: ${s.description}`).join("\n")}

Instructions:
1. Select 2-5 sounds that best match the description
2. Set volume levels (0-100) for each sound to create the right balance
3. Consider which sounds should be prominent (higher volume) vs ambient (lower volume)
4. Create a cohesive, realistic soundscape

Return ONLY the sound configuration with no additional text.`,
        response_json_schema: {
          type: "object",
          properties: {
            sound_configs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  volume: { type: "number" },
                },
                required: ["id", "volume"],
              },
            },
            description: {
              type: "string",
              description: "Brief description of the generated soundscape",
            },
          },
          required: ["sound_configs", "description"],
        },
      });

      if (result.sound_configs && result.sound_configs.length > 0) {
        onGenerate(result.sound_configs, result.description || prompt);
        setPrompt("");
        onClose();
      }
    } catch (error) {
      console.error("Failed to generate soundscape:", error);
      alert("Failed to generate soundscape. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Wand2 className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white/90">AI Soundscape Generator</h3>
                </div>
                <button
                  onClick={onClose}
                  disabled={isGenerating}
                  aria-label="Close"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Describe your ideal soundscape
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Calm forest with distant thunder and gentle rain..."
                    disabled={isGenerating}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none h-24"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleGenerate();
                      }
                    }}
                  />
                </div>

                <div>
                  <p className="text-xs text-white/40 mb-2">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(example)}
                        disabled={isGenerating}
                        className="text-xs min-h-[44px] px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isGenerating}
                    className="flex-1 bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
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