import { useCallback } from "react";
import { base44 } from "@/api/base44Client";

export const useAnalytics = () => {
  const trackEvent = useCallback((eventName, properties = {}) => {
    try {
      base44.analytics.track({
        eventName,
        properties,
      });
    } catch (error) {
      console.error("Analytics error:", error);
    }
  }, []);

  return {
    // Sound interactions
    trackSoundToggle: useCallback((soundId, isActive) => {
      trackEvent("sound_toggled", { sound_id: soundId, is_active: isActive });
    }, [trackEvent]),

    trackVolumeChange: useCallback((soundId, volume) => {
      trackEvent("volume_changed", { sound_id: soundId, volume });
    }, [trackEvent]),

    // Mood interactions
    trackMoodSelected: useCallback((moodId, moodName) => {
      trackEvent("mood_selected", { mood_id: moodId, mood_name: moodName });
    }, [trackEvent]),

    // Preset interactions
    trackPresetSaved: useCallback((presetName, soundCount) => {
      trackEvent("preset_saved", { preset_name: presetName, sound_count: soundCount });
    }, [trackEvent]),

    trackPresetLoaded: useCallback((presetId, presetName) => {
      trackEvent("preset_loaded", { preset_id: presetId, preset_name: presetName });
    }, [trackEvent]),

    // AI interactions
    trackAIGenerated: useCallback((prompt, soundCount) => {
      trackEvent("ai_soundscape_generated", { prompt, sound_count: soundCount });
    }, [trackEvent]),

    // Download interactions
    trackSoundscapeDownloaded: useCallback((duration, soundCount) => {
      trackEvent("soundscape_downloaded", { duration_minutes: duration, sound_count: soundCount });
    }, [trackEvent]),

    // Favorite interactions
    trackFavoriteAdded: useCallback((type, itemId) => {
      trackEvent("favorite_added", { type, item_id: itemId });
    }, [trackEvent]),

    trackFavoriteRemoved: useCallback((type, itemId) => {
      trackEvent("favorite_removed", { type, item_id: itemId });
    }, [trackEvent]),

    // Subscription interactions
    trackUpgradeClicked: useCallback((targetTier) => {
      trackEvent("upgrade_clicked", { target_tier: targetTier });
    }, [trackEvent]),

    trackSubscriptionChanged: useCallback((newTier) => {
      trackEvent("subscription_changed", { new_tier: newTier });
    }, [trackEvent]),

    // Timer interactions
    trackTimerSet: useCallback((duration) => {
      trackEvent("timer_set", { duration_minutes: duration });
    }, [trackEvent]),

    // Session interactions
    trackSessionStarted: useCallback((soundCount) => {
      trackEvent("session_started", { sound_count: soundCount });
    }, [trackEvent]),

    trackSessionEnded: useCallback((duration, soundCount) => {
      trackEvent("session_ended", { duration_seconds: duration, sound_count: soundCount });
    }, [trackEvent]),

    // Language interactions
    trackLanguageChanged: useCallback((language) => {
      trackEvent("language_changed", { language });
    }, [trackEvent]),

    // Settings interactions
    trackSettingsSaved: useCallback((settingsChanged) => {
      trackEvent("settings_saved", { settings: settingsChanged });
    }, [trackEvent]),
  };
};