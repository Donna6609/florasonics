import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PricingTiers from "@/components/PricingTiers";
import { Crown, CheckCircle2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const TIER_COLORS = {
  free: "text-slate-400",
  basic: "text-emerald-400",
  premium: "text-amber-400",
  pro: "text-purple-400",
  teams: "text-blue-400"
};

const TIER_BADGES = {
  free: "Free",
  basic: "Basic",
  premium: "Premium",
  pro: "Pro",
  teams: "Teams"
};

export default function SubscriptionsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await base44.functions.invoke('manageSubscription', {
        action: 'cancel',
        stripe_subscription_id: user.subscription_stripe_id
      });
      setShowCancelDialog(false);
      // Reload user data
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = async (tierKey) => {
    try {
      await base44.functions.invoke('createStripeCheckout', {
        tier: tierKey,
        return_url: window.location.origin + '/subscriptions'
      });
    } catch (error) {
      console.error("Failed to start checkout:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading subscription info...</p>
        </div>
      </div>
    );
  }

  const currentTier = user?.subscription_tier || 'free';
  const subscriptionStatus = user?.subscription_status || 'inactive';
  const endDate = user?.subscription_current_period_end;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Subscriptions</h1>
          <p className="text-white/60">Manage your subscription and billing</p>
        </motion.div>

        {/* Current Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-white/[0.03] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className={`w-5 h-5 ${TIER_COLORS[currentTier]}`} />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tier Badge */}
                <div>
                  <p className="text-white/60 text-sm mb-2">Plan</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${TIER_COLORS[currentTier]}`}>
                      {TIER_BADGES[currentTier]}
                    </span>
                    {subscriptionStatus === 'active' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-white/60 text-sm mb-2">Status</p>
                  <div className={`text-lg font-semibold capitalize ${
                    subscriptionStatus === 'active' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {subscriptionStatus}
                  </div>
                </div>

                {/* Renewal Date */}
                {endDate && subscriptionStatus === 'active' && (
                  <div>
                    <p className="text-white/60 text-sm mb-2">Next Billing Date</p>
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span className="font-semibold">
                        {format(new Date(endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                {currentTier !== 'free' && subscriptionStatus === 'active' && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelDialog(true)}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/40"
                  >
                    Cancel Subscription
                  </Button>
                )}
                {currentTier !== 'free' && (
                  <Button
                    onClick={() => setShowUpgradeOptions(!showUpgradeOptions)}
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40"
                  >
                    Change Plan
                  </Button>
                )}
                {currentTier === 'free' && (
                  <Button
                    onClick={() => setShowUpgradeOptions(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Upgrade Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upgrade Options */}
        {showUpgradeOptions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Choose Your Plan</CardTitle>
                <CardDescription>Upgrade or downgrade your subscription anytime</CardDescription>
              </CardHeader>
              <CardContent>
                <PricingTiers
                  currentTier={currentTier}
                  onUpgrade={handleUpgrade}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Billing Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/[0.03] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Billing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-white/70 text-sm">
              <p>
                <span className="text-white/40">Email:</span> {user?.email}
              </p>
              {user?.subscription_stripe_id && (
                <p>
                  <span className="text-white/40">Stripe Subscription ID:</span> {user.subscription_stripe_id}
                </p>
              )}
              <p className="text-white/40 pt-4">
                For detailed billing history and invoices, visit your Stripe account.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Your subscription will remain active until {endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'the end of your billing period'}. You can resubscribe anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}