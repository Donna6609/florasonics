import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Volume2, Heart, Zap, Download, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SOUNDS } from "@/components/noise/SoundMixer";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useAnalytics } from "@/components/analytics/useAnalytics";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import { useQuery } from "@tanstack/react-query";
import DeleteAccountFlow from "@/components/settings/DeleteAccountFlow";
import { usePullToRefresh } from "@/components/usePullToRefresh";
import { useIsIOSWebView } from "@/lib/useIsIOSWebView";

const SOUND_CATEGORIES = [
  { id: "nature", label: "Nature", sounds: ["rain", "ocean", "wind", "forest", "stream"] },
  { id: "ambient", label: "Ambient", sounds: ["fire", "cafe", "night", "fan"] },
  { id: "transport", label: "Transport", sounds: ["train"] },
  { id: "weather", label: "Weather", sounds: ["thunder"] },
  { id: "wildlife", label: "Wildlife", sounds: ["birds"] },
];

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const analytics = useAnalytics();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [preferredCategories, setPreferredCategories] = useState([]);
  const [defaultMasterVolume, setDefaultMasterVolume] = useState(80);
  const [defaultSoundVolume, setDefaultSoundVolume] = useState(70);
  const [autoPlayLastSession, setAutoPlayLastSession] = useState(false);

  const { data: downloadedSounds = [] } = useQuery({
    queryKey: ["downloads"],
    queryFn: () => base44.entities.DownloadedSound.list("-created_date"),
    initialData: [],
  });

  const { data: downloadedWellness = [] } = useQuery({
    queryKey: ["downloadedWellness"],
    queryFn: () => base44.entities.DownloadedWellnessContent.list("-created_date"),
    initialData: [],
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load subscription
      const subs = await base44.entities.Subscription.filter(
        { created_by: currentUser.email },
        "-created_date",
        1
      );
      if (subs.length > 0 && subs[0].status === "active") {
        setSubscription(subs[0]);
      }

      // Load user preferences
      setPreferredCategories(currentUser.preferred_categories || []);
      setDefaultMasterVolume(currentUser.default_master_volume || 80);
      setDefaultSoundVolume(currentUser.default_sound_volume || 70);
      setAutoPlayLastSession(currentUser.auto_play_last_session || false);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        preferred_categories: preferredCategories,
        default_master_volume: defaultMasterVolume,
        default_sound_volume: defaultSoundVolume,
        auto_play_last_session: autoPlayLastSession,
      });
      analytics.trackSettingsSaved({
        preferred_categories: preferredCategories.length,
        default_master_volume: defaultMasterVolume,
        default_sound_volume: defaultSoundVolume,
        auto_play_last_session: autoPlayLastSession,
      });
      toast.success(t("saveChanges"));
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setPreferredCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(loadUserData);
  const isIOSWebView = useIsIOSWebView();

  const handleManageSubscription = async () => {
    try {
      const response = await base44.functions.invoke("manageSubscription", {});
      if (response.data?.url) {
        window.open(response.data.url, "_blank");
      } else {
        toast.error("Could not open subscription portal");
      }
    } catch (error) {
      toast.error("Failed to open subscription management");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  const userTier = subscription?.tier || "free";

  return (
    <div className="min-h-screen bg-slate-950 text-white" {...pullHandlers}>
      <PullIndicator />
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-950/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-950/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(createPageUrl("Home"))}
            aria-label="Go back to Home"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-light tracking-tight text-white/90">{t("settingsTitle")}</h1>
            <p className="text-white/40 text-sm mt-1">Manage your profile and preferences</p>
          </div>
          <LanguageSelector />
        </div>

        <div className="space-y-6">
          {/* Sign In Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-medium text-white/90">Sign In</h2>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-white/90 font-medium">{user?.full_name || user?.email}</p>
                <p className="text-white/50 text-sm">{user?.email}</p>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 hover:text-white/90 text-sm transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-medium text-white/90">Subscription & Billing</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.04] flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Plan</p>
                  <p className="text-white/90 font-medium capitalize">{userTier} Plan</p>
                  {subscription?.current_period_end && (
                    <p className="text-sm text-white/40 mt-0.5">
                      Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                  userTier === "free" ? "bg-white/10 text-white/50" :
                  userTier === "premium" ? "bg-purple-500/20 text-purple-300" :
                  "bg-emerald-500/20 text-emerald-300"
                )}>
                  {userTier}
                </span>
              </div>

              {userTier !== "free" ? (
                isIOSWebView ? (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                    <p className="text-white/50 text-sm">To manage your subscription, visit <span className="text-emerald-400 font-medium">florasonics.info</span></p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 mb-3">Manage your subscription via the Stripe billing portal — update payment, change plan, or cancel anytime.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        onClick={handleManageSubscription}
                        variant="outline"
                        className="bg-white/[0.06] border-white/[0.08] text-white/70 hover:bg-white/[0.1] hover:text-white/90 w-full"
                      >
                        Update Plan
                      </Button>
                      <Button
                        onClick={handleManageSubscription}
                        variant="outline"
                        className="bg-white/[0.06] border-white/[0.08] text-white/70 hover:bg-white/[0.1] hover:text-white/90 w-full"
                      >
                        Update Card
                      </Button>
                      <Button
                        onClick={handleManageSubscription}
                        variant="outline"
                        className="bg-red-950/30 border-red-500/20 text-red-400 hover:bg-red-950/50 hover:text-red-300 w-full"
                      >
                        Cancel Plan
                      </Button>
                    </div>
                  </div>
                )
              ) : isIOSWebView ? (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-white/50 text-sm">Subscribe at <span className="text-emerald-400 font-medium">florasonics.info</span> to unlock all sounds & features</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/20 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white/80 font-medium text-sm">Upgrade to unlock all sounds & features</p>
                    <p className="text-white/40 text-xs mt-0.5">Starting at $2.99/month</p>
                  </div>
                  <Button
                    onClick={() => navigate(createPageUrl("Home"))}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm shrink-0"
                  >
                    Upgrade
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sound Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Heart className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-medium text-white/90">Preferred Categories</h2>
            </div>
            <p className="text-sm text-white/50 mb-4">
              Select your favorite sound categories for quick access
            </p>
            <div className="flex flex-wrap gap-2">
              {SOUND_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "px-4 min-h-[44px] rounded-full text-sm font-medium transition-all",
                    preferredCategories.includes(category.id)
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "bg-white/[0.06] text-white/50 border border-white/[0.08] hover:bg-white/[0.1]"
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Volume Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Volume2 className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-medium text-white/90">Default Volume Levels</h2>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-white/70">Master Volume</p>
                  <span className="text-sm text-white/50">{defaultMasterVolume}%</span>
                </div>
                <Slider
                  value={[defaultMasterVolume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setDefaultMasterVolume(val[0])}
                  className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-white/70">Individual Sound Volume</p>
                  <span className="text-sm text-white/50">{defaultSoundVolume}%</span>
                </div>
                <Slider
                  value={[defaultSoundVolume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setDefaultSoundVolume(val[0])}
                  className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>
            </div>
          </motion.div>

          {/* Playback Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-medium text-white/90">Playback</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90">Auto-play Last Session</p>
                <p className="text-sm text-white/50 mt-1">
                  Automatically resume your last soundscape on app load
                </p>
              </div>
              <Switch
                checked={autoPlayLastSession}
                onCheckedChange={setAutoPlayLastSession}
              />
            </div>
          </motion.div>

          {/* Offline Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Download className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-medium text-white/90">Offline Content</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]">
                <div>
                  <p className="text-white/90 font-medium">Total Downloaded</p>
                  <p className="text-sm text-white/50 mt-1">
                    Available for offline playback
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-light text-white/90">
                    {downloadedSounds.length + downloadedWellness.length}
                  </p>
                  <p className="text-xs text-white/50">items</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.04]">
                  <p className="text-sm text-white/50 mb-1">Soundscapes</p>
                  <p className="text-xl font-light text-white/90">{downloadedSounds.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.04]">
                  <p className="text-sm text-white/50 mb-1">Wellness Content</p>
                  <p className="text-xl font-light text-white/90">{downloadedWellness.length}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end"
          >
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-8"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </motion.div>

          {/* Delete Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <DeleteAccountFlow />
          </motion.div>
        </div>
      </div>
    </div>
  );
}