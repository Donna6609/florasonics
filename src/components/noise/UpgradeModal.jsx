import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useIsIOSWebView } from "@/lib/useIsIOSWebView";

const PLANS = {
  basic: {
    name: "Basic",
    price: "$2.99",
    period: "/month",
    stripeEnabled: true,
    features: [
      "All free sounds",
      "Forest ambience",
      "Fireplace crackling",
      "Bird songs",
      "Train sounds",
      "Stream water",
      "Save unlimited presets",
    ],
  },
  premium: {
    name: "Premium",
    price: "$7.99",
    period: "/month",
    stripeEnabled: true,
    features: [
      "All Basic sounds",
      "Thunder storms",
      "Coffee shop ambience",
      "Night crickets",
      "AI soundscape generator",
      "Download soundscapes",
      "Priority support",
    ],
  },
  pro: {
    name: "Pro",
    price: "$13.99",
    period: "/month",
    stripeEnabled: true,
    features: [
      "Everything in Premium",
      "Wearable integration",
      "Biometric analytics",
      "Custom sound creation",
      "Priority support",
      "Advanced wellness goals",
    ],
  },
  family: {
    name: "Family",
    price: "$22.99",
    period: "/month",
    stripeEnabled: false,
    features: [
      "Everything in Pro",
      "Up to 5 family members",
      "Shared wellness goals",
      "Family challenges",
      "Individual profiles",
      "Dedicated account support",
    ],
  },
  teams: {
    name: "Teams",
    price: "$9.99",
    period: "/user/month",
    stripeEnabled: false,
    features: [
      "Everything in Premium",
      "Corporate team dashboard",
      "Team wellness challenges",
      "Leaderboards & progress",
      "Invite colleagues",
      "Admin analytics",
      "Priority support",
    ],
  },
};

export default function UpgradeModal({ isOpen, onClose, targetTier = "basic" }) {
  const [loading, setLoading] = useState(false);
  const isIOSWebView = useIsIOSWebView();
  const plan = PLANS[targetTier];

  const handleSubscribe = async () => {
    // For tiers without Stripe configured, show contact message
    if (!plan?.stripeEnabled) {
      toast.info("Contact us at hello@florasonics.com to set up your Teams or Pro plan.");
      return;
    }

    setLoading(true);
    try {
      // Check if running in iframe (preview mode)
      if (window.self !== window.top) {
        toast.error("Checkout only works in published apps. Please publish and open in a new tab.");
        setLoading(false);
        return;
      }

      const result = await base44.functions.invoke("createStripeCheckout", { tier: targetTier });
      if (result.data?.error) {
        toast.error(result.data.error);
        setLoading(false);
        return;
      }
      window.location.href = result.data.checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to start checkout. Please try again.");
      setLoading(false);
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md z-[101] max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl w-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white/90">Upgrade to {plan.name}</h3>
                    <p className="text-sm text-white/40">Unlock premium sounds</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-emerald-500/20">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {isIOSWebView ? (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                    <p className="text-white/70 text-sm mb-2">Subscriptions are managed on our website.</p>
                    <p className="text-white/50 text-xs">Visit <span className="text-emerald-400 font-medium">florasonics.info</span> to subscribe, then log in here to access your plan.</p>
                  </div>
                ) : targetTier === "teams" ? (
                  <Button
                    onClick={() => { onClose(); window.location.href = `/${createPageUrl("CorporateWellness")}`; }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <Users className="w-4 h-4 mr-2" /> Go to Teams Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white disabled:opacity-50"
                  >
                    {loading ? "Loading..." : plan?.stripeEnabled ? "Subscribe Now" : "Contact Us"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}