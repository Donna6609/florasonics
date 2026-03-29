import React, { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { useIsIOSWebView } from "@/lib/useIsIOSWebView";

const TIER_INFO = {
  free: {
    name: "Free",
    color: "from-slate-600 to-slate-700",
    icon: "🎵",
  },
  basic: {
    name: "Basic",
    color: "from-blue-600 to-blue-700",
    icon: "⭐",
    price: "$2.99/month",
  },
  premium: {
    name: "Premium",
    color: "from-purple-600 to-pink-600",
    icon: "👑",
    price: "$4.99/month",
  },
};

export default function SubscriptionManager({ subscription, onClose }) {
  const [loading, setLoading] = useState(false);
  const isIOSWebView = useIsIOSWebView();
  const tier = subscription?.tier || "free";
  const tierInfo = TIER_INFO[tier];

  const handleManageSubscription = async () => {
    if (tier === "free") return;
    
    setLoading(true);
    try {
      const result = await base44.functions.manageSubscription({});
      window.location.href = result.portal_url;
    } catch (error) {
      alert(error.message || "Failed to open subscription management");
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 mx-4"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${tierInfo.color}`}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white/90">
                  {tierInfo.icon} {tierInfo.name} Plan
                </h3>
                {tierInfo.price && !isIOSWebView && (
                  <p className="text-sm text-white/40">{tierInfo.price}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {tier !== "free" && subscription && (
              <>
                <div className="p-3 rounded-lg bg-white/5 border border-white/[0.08]">
                  <p className="text-xs text-white/40 mb-1">Status</p>
                  <p className="text-sm text-white/90 capitalize font-medium">
                    {subscription.status === "active" ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Active
                      </span>
                    ) : (
                      subscription.status
                    )}
                  </p>
                </div>

                {subscription.current_period_end && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/[0.08]">
                    <p className="text-xs text-white/40 mb-1">
                      {subscription.status === "cancelled" ? "Valid Until" : "Renews On"}
                    </p>
                    <p className="text-sm text-white/90">
                      {format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="p-3 rounded-lg bg-white/5 border border-white/[0.08]">
              <p className="text-xs text-white/40 mb-2">Your Benefits</p>
              <div className="space-y-1.5">
                {tier === "free" && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>3 free ambient sounds</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Basic sound mixing</span>
                    </div>
                  </>
                )}
                {(tier === "basic" || tier === "premium") && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>All free + 5 premium sounds</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Save unlimited presets</span>
                    </div>
                  </>
                )}
                {tier === "premium" && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>AI soundscape generator</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Download & mix tracks</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Advanced playback controls</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {tier !== "free" && !isIOSWebView && (
            <Button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              {loading ? "Loading..." : "Manage Subscription"}
            </Button>
          )}
          {tier !== "free" && isIOSWebView && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-white/50 text-xs">To manage your subscription, visit <span className="text-emerald-400">florasonics.info</span></p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}