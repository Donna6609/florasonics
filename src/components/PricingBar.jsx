import React, { useRef } from "react";
import { Crown, Zap, Gift, Star, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useIsIOSWebView } from "@/lib/useIsIOSWebView";

const TIERS = [
  { name: "Free", key: "free", icon: Gift, price: "$0", color: "text-slate-400", activeColor: "bg-white/10 border-white/20" },
  { name: "Basic", key: "basic", icon: Zap, price: "$2.99/mo", color: "text-emerald-400", activeColor: "bg-emerald-500/15 border-emerald-500/40" },
  { name: "Premium", key: "premium", icon: Crown, price: "$7.99/mo", color: "text-amber-400", activeColor: "bg-amber-500/15 border-amber-500/40", badge: "Best" },
  { name: "Pro", key: "pro", icon: Star, price: "$13.99/mo", color: "text-purple-400", activeColor: "bg-purple-500/15 border-purple-500/40" },
  { name: "Corporate Wellness", key: "teams", icon: Users, price: "$9.99/user", color: "text-blue-400", activeColor: "bg-blue-500/15 border-blue-500/40" },
];

function MobilePricingSlider({ currentTier = "free", onUpgrade, onFreeClick }) {
  const isIOSWebView = useIsIOSWebView();
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -250 : 250,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-5 block sm:hidden"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => scroll('left')}
          className="p-2 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-300 transition-all shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto scroll-smooth flex-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="flex gap-2 px-2">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isActive = currentTier === tier.key;
              return (
                <div
                  key={tier.key}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 cursor-pointer flex-shrink-0 min-w-fit snap-center",
                    isActive ? tier.activeColor : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
                  )}
                  onClick={() => {
                    if (tier.key === "free") onFreeClick?.();
                    else onUpgrade(tier.key);
                  }}
                >
                  <Icon className={cn("w-5 h-5", tier.color)} />
                  <span className="text-xs font-semibold text-white/90">{tier.name}</span>
                  {!isIOSWebView && <span className="text-[10px] text-white/50">{tier.price}</span>}
                  {isActive ? (
                    <span className="text-[9px] text-emerald-400 font-bold">✓ Active</span>
                  ) : tier.key !== "free" && !isIOSWebView ? (
                    <span className="text-[9px] text-emerald-300 font-semibold">→ Upgrade</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => scroll('right')}
          className="p-2 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-300 transition-all shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function PricingBarDesktop({ currentTier = "free", onUpgrade, onFreeClick }) {
  const isIOSWebView = useIsIOSWebView();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-x-auto mb-5 hidden sm:block"
    >
      <div className="flex gap-2 justify-start min-w-max sm:min-w-0">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isActive = currentTier === tier.key;
          return (
            <button
              key={tier.key}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl border backdrop-blur-xl transition-all duration-200 cursor-pointer flex-shrink-0",
                isActive ? tier.activeColor : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
              )}
              onClick={() => {
                if (tier.key === "free") onFreeClick?.();
                else onUpgrade(tier.key);
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={cn("w-3.5 h-3.5 shrink-0", tier.color)} />
                <span className="text-xs font-medium text-white/80 whitespace-nowrap">{tier.name}</span>
                {tier.badge && (
                  <span className="hidden sm:inline text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded uppercase tracking-wide">
                    {tier.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 pointer-events-none">
                {!isIOSWebView && <span className="text-xs text-white/40 hidden sm:inline">{tier.price}</span>}
                {isActive && (
                  <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                )}
                {!isActive && tier.key !== "free" && !isIOSWebView && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-700/40 text-emerald-300">
                    Upgrade
                  </span>
                )}
                </div>
                </button>
                );
                })}
                </div>
    </motion.div>
  );
}

export default function PricingBar({ currentTier = "free", onUpgrade, onFreeClick }) {
  return (
    <>
      <MobilePricingSlider currentTier={currentTier} onUpgrade={onUpgrade} onFreeClick={onFreeClick} />
      <PricingBarDesktop currentTier={currentTier} onUpgrade={onUpgrade} onFreeClick={onFreeClick} />
    </>
  );
}