import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const FREE_FEATURES = [
  "Access to all nature sounds",
  "Create and save presets",
  "Basic meditation guides",
  "Mood tracking",
  "Limited to 10 saved presets"
];

export default function FreeTierModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Free Plan</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <p className="text-white/70 mb-4">Always free, no credit card needed.</p>

        <div className="space-y-2 mb-6">
          {FREE_FEATURES.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-white/80 text-sm">{feature}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          Got it
        </Button>
      </motion.div>
    </motion.div>
  );
}