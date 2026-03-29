import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Copy, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SharePresetDialog({ isOpen, onClose, preset }) {
  const [isPublic, setIsPublic] = useState(preset?.is_public || false);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  const shareCode = preset?.share_code || preset?.id?.substring(0, 8);
  const shareUrl = `${window.location.origin}${window.location.pathname}?import=${shareCode}`;

  const handleTogglePublic = async () => {
    if (!preset) return;
    
    setUpdating(true);
    try {
      const newPublicState = !isPublic;
      await base44.entities.Preset.update(preset.id, {
        is_public: newPublicState,
        share_code: shareCode,
      });
      setIsPublic(newPublicState);
      toast.success(newPublicState ? "Preset is now public" : "Preset is now private");
    } catch (error) {
      toast.error("Failed to update sharing settings");
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!preset) return null;

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
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Share2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white/90">Share Preset</h3>
                    <p className="text-sm text-white/40">{preset.name}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-white/40" />
                    <div>
                      <div className="text-sm font-medium text-white/90">Public Sharing</div>
                      <div className="text-xs text-white/40">
                        {isPublic ? "Visible in community" : "Only via link"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={handleTogglePublic}
                    disabled={updating}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Share Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="bg-white/5 border-white/10 text-white text-sm"
                    />
                    <Button
                      onClick={handleCopy}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Anyone with this link can import your preset
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={onClose}
                    className="w-full bg-white/5 hover:bg-white/10 text-white"
                  >
                    Done
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