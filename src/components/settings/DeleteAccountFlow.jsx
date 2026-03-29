import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = ["warn", "confirm", "type"];

export default function DeleteAccountFlow() {
  const [step, setStep] = useState(null); // null = closed
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const focusTrapRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Focus trap effect: trap keyboard focus within modal when active
  useEffect(() => {
    if (step === null) return;

    previousActiveElement.current = document.activeElement;
    const focusTrap = focusTrapRef.current;

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;
      if (!focusTrap) return;

      const focusableElements = focusTrap.querySelectorAll(
        "button, input, [tabindex]:not([tabindex=\"-1\"])"
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    focusTrap?.addEventListener("keydown", handleKeyDown);
    return () => {
      focusTrap?.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [step]);

  const reset = () => {
    setStep(null);
    setConfirmText("");
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      toast.success("Account deleted. Logging out…");
      setTimeout(() => base44.auth.logout(), 1500);
    } catch {
      toast.error("Failed to delete account data");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-red-950/20 border border-red-500/20 p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-red-500/10">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <h2 className="text-xl font-medium text-white/90">Delete Account</h2>
      </div>
      <p className="text-sm text-white/50 mb-4">
        Permanently delete all your data including presets, mood logs, and subscription info. This cannot be undone.
      </p>

      {step === null && (
        <Button
          onClick={() => setStep("warn")}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          Delete My Account
        </Button>
      )}

      <div ref={focusTrapRef} role="alertdialog" aria-label="Delete account confirmation">
        <AnimatePresence mode="wait">
        {step === "warn" && (
          <motion.div
            key="warn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/20 space-y-2">
              <div className="flex items-center gap-2 text-red-300 font-medium text-sm">
                <AlertTriangle className="w-4 h-4" />
                What will be deleted
              </div>
              {[
                "All presets and soundscape configurations",
                "Mood logs and wellness history",
                "Activity completions and points",
                "Subscription and billing records",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/60">
                  <div className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={reset} variant="ghost" className="flex-1 text-white/50">
                Cancel
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                className="flex-1 bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-500/20"
              >
                I understand, continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-white/70">
                This action is <strong className="text-white/90">irreversible</strong>. Your account and all associated data will be permanently erased. There is no way to recover it.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={reset} variant="ghost" className="flex-1 text-white/50">
                Cancel
              </Button>
              <Button
                onClick={() => setStep("type")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, delete everything
              </Button>
            </div>
          </motion.div>
        )}

        {step === "type" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <p className="text-sm text-red-300">
              Type <strong>DELETE</strong> to permanently delete your account:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-red-500/30 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <div className="flex gap-3">
              <Button onClick={reset} variant="ghost" className="flex-1 text-white/50">
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className={cn(
                  "flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40",
                  confirmText === "DELETE" && "ring-2 ring-red-500/50"
                )}
              >
                {deleting ? "Deleting…" : "Permanently Delete"}
              </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}