import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Star, Zap, Leaf, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsIOSWebView } from "@/lib/useIsIOSWebView";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Leaf,
    color: "text-slate-400",
    accent: "border-white/10",
    badge: null,
    features: [
      "3 ambient sounds",
      "Basic sound mixing",
      "Save 3 favorites",
      "Daily nature journal",
    ],
  },
  {
    name: "Basic",
    price: "$2.99",
    period: "/month",
    icon: Zap,
    color: "text-emerald-400",
    accent: "border-emerald-500/30",
    badge: null,
    features: [
      "All free sounds",
      "8 premium sounds",
      "Unlimited presets",
      "Sound profiles",
      "Ambient sound effects",
    ],
  },
  {
    name: "Premium",
    price: "$7.99",
    period: "/month",
    icon: Crown,
    color: "text-amber-400",
    accent: "border-amber-500/40",
    badge: "Best Value",
    features: [
      "Everything in Basic",
      "AI soundscape generator",
      "Download & export",
      "Multi-track mixer",
      "AI guided meditation",
      "Advanced analytics",
    ],
  },
  {
    name: "Pro",
    price: "$13.99",
    period: "/month",
    icon: Star,
    color: "text-purple-400",
    accent: "border-purple-500/30",
    badge: null,
    features: [
      "Everything in Premium",
      "Wearable integration",
      "Biometric analytics",
      "Custom sound creation",
      "Priority support",
      "Advanced wellness goals",
    ],
  },
  {
    name: "Teams",
    price: "$9.99",
    period: "/user/mo",
    icon: Users,
    color: "text-blue-400",
    accent: "border-blue-500/30",
    badge: "Corporate",
    features: [
      "Everything in Premium",
      "Corporate team dashboard",
      "Team wellness challenges",
      "Leaderboards & progress",
      "Invite colleagues",
      "Admin analytics",
    ],
  },
];

export default function PricingTiers({ currentTier = "free", onUpgrade }) {
  const [selected, setSelected] = useState(null);
  const isIOSWebView = useIsIOSWebView();

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 max-w-6xl mx-auto">
        {TIERS.map((tier, idx) => {
          const Icon = tier.icon;
          const isCurrentTier = currentTier === tier.name.toLowerCase();
          const isSelected = selected === tier.name;

          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={cn(
                "relative rounded-2xl border backdrop-blur-xl cursor-pointer transition-all duration-300 overflow-hidden",
                isSelected || tier.badge
                  ? `bg-white/[0.08] ${tier.accent} shadow-lg`
                  : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
              )}
              onClick={() => setSelected(isSelected ? null : tier.name)}
            >
              {tier.badge && (
                <div className="absolute top-0 inset-x-0 text-center py-1 bg-amber-500/20 border-b border-amber-500/30">
                  <span className="text-[10px] font-semibold text-amber-400 tracking-wide uppercase">{tier.badge}</span>
                </div>
              )}

              <div className={cn("p-3 sm:p-4", tier.badge && "pt-7")}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn("w-4 h-4", tier.color)} />
                  <span className="text-xs font-medium text-white/70">{tier.name}</span>
                  {isCurrentTier && (
                    <span className="ml-auto text-[10px] text-emerald-400 font-medium">Active</span>
                  )}
                </div>

                <div className="mb-3">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-white/30 text-xs ml-1">{tier.period}</span>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-white/50 leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentTier ? (
                  <div className="w-full py-2 rounded-lg text-center text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
                    Current Plan
                  </div>
                ) : tier.name === "Free" ? (
                  <div className="w-full py-2 rounded-lg text-center text-xs text-white/30 border border-white/10">
                    Always Free
                  </div>
                ) : isIOSWebView ? (
                  <div className="w-full py-2 rounded-lg text-center text-xs text-white/40 border border-white/10 bg-white/5">
                    Visit florasonics.info
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpgrade(tier.name.toLowerCase()); }}
                    className={cn(
                      "w-full py-2 rounded-lg text-xs font-semibold text-white transition-all",
                      tier.name === "Premium"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                        : tier.name === "Teams"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                        : "bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600"
                    )}
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}