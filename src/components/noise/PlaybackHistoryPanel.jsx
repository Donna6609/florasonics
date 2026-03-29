import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Play, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function PlaybackHistoryPanel({ history, onReplay, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300",
          "border backdrop-blur-xl text-sm font-medium",
          "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
        )}
      >
        <History className="w-4 h-4" />
        <span>History</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-3 right-0 w-80 p-3 rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl max-h-96 overflow-y-auto"
          >
            {isLoading ? (
              <p className="text-white/40 text-sm text-center py-4">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">
                No playback history yet. Start playing sounds!
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] p-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">
                          {item.session_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-white/30" />
                          <p className="text-xs text-white/40">
                            {format(new Date(item.created_date), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.sound_configs.slice(0, 3).map((config, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50"
                            >
                              {config.id}
                            </span>
                          ))}
                          {item.sound_configs.length > 3 && (
                            <span className="text-xs px-2 py-0.5 text-white/40">
                              +{item.sound_configs.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onReplay(item)}
                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/70 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Play className="w-4 h-4" fill="currentColor" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}