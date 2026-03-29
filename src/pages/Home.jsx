import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkPlus, Download, Wand2, Crown, Settings as SettingsIcon, Sparkles, User, Leaf, Users, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SoundMixer from "@/components/noise/SoundMixer";
import GardenScene from "@/components/garden/GardenScene";
import GardenMixer from "@/components/garden/GardenMixer";
import NowPlaying from "@/components/noise/NowPlaying";
import PomodoroTimer from "@/components/wellness/PomodoroTimer";
import BreathingExercise from "@/components/wellness/BreathingExercise";
import MeditationGuide from "@/components/wellness/MeditationGuide";
import AIGuidedMeditation from "@/components/wellness/AIGuidedMeditation";
import MoodTracker from "@/components/wellness/MoodTracker";
import WellnessGoals from "@/components/wellness/WellnessGoals";
import PersonalizedJourney from "@/components/wellness/PersonalizedJourney";
import GuidedNatureWalk from "@/components/wellness/GuidedNatureWalk";
import JourneySelector from "@/components/wellness/JourneySelector";
import OfflineIndicator from "@/components/offline/OfflineIndicator";
import DownloadManager from "@/components/offline/DownloadManager";
import WearableConnections from "@/components/wearables/WearableConnections";
import BiometricInsights from "@/components/wearables/BiometricInsights";
import PresetSelector from "@/components/noise/PresetSelector";
import SavePresetDialog from "@/components/noise/SavePresetDialog";
import PlaybackHistoryPanel from "@/components/noise/PlaybackHistoryPanel";
import SoundscapeRecorder from "@/components/noise/SoundscapeRecorder";
import DownloadsPanel from "@/components/noise/DownloadsPanel";
import AISoundscapeGenerator from "@/components/noise/AISoundscapeGenerator";
import FavoritesPanel from "@/components/noise/FavoritesPanel";
import UpgradeModal from "@/components/noise/UpgradeModal";
import SubscriptionManager from "@/components/SubscriptionManager";
import PricingTiers from "@/components/PricingTiers";
import PricingBar from "@/components/PricingBar.jsx";
import DailyTasks from "@/components/wellness/DailyTasks";
import SleepTimer from "@/components/wellness/SleepTimer";
import WellnessReminder from "@/components/wellness/WellnessReminder";
import MasterEffects from "@/components/noise/MasterEffects";
import AmbientEffects from "@/components/noise/AmbientEffects";
import SoundProfiles from "@/components/noise/SoundProfiles";
import NatureJournal from "@/components/journal/NatureJournal";
import OnboardingTour from "@/components/OnboardingTour";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import DailyContent from "@/components/DailyContent";
import NotificationSetup from "@/components/NotificationSetup";
import FreeTierModal from "@/components/FreeTierModal";
import GardenShareModal from "@/components/garden/GardenShareCard";

import LanguageSelector from "@/components/i18n/LanguageSelector";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useAnalytics } from "@/components/analytics/useAnalytics";
import { useActivityTracker } from "@/components/analytics/ActivityTracker.jsx";
import { SOUNDS } from "@/components/noise/SoundMixer";
import useAudioEngine from "@/components/noise/useAudioEngine";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePullToRefresh } from "@/components/usePullToRefresh";

export default function Home() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const analytics = useAnalytics();
  const activityTracker = useActivityTracker();
  const [activeSounds, setActiveSounds] = useState([]);
  const [masterVolume, setMasterVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetTier, setTargetTier] = useState("basic");
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [aiMeditationOpen, setAiMeditationOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userTier, setUserTier] = useState("free");
  const [userSubscription, setUserSubscription] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [journeySelectorOpen, setJourneySelectorOpen] = useState(false);
  const [freeTierModalOpen, setFreeTierModalOpen] = useState(false);
  const [gardenShareOpen, setGardenShareOpen] = useState(false);
  const lastHistoryRecord = useRef(null);

  const audioEngine = useAudioEngine();
  const queryClient = useQueryClient();

  // Track language changes
  useEffect(() => {
    if (language) {
      analytics.trackLanguageChanged(language);
    }
  }, [language, analytics]);

  // Check for import code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const importCode = urlParams.get("import");
    
    if (importCode) {
      base44.entities.Preset.filter({ share_code: importCode }, "-created_date", 1)
        .then(async (presets) => {
          if (presets.length > 0) {
            const preset = presets[0];
            const user = await base44.auth.me().catch(() => null);
            
            if (user) {
              await base44.entities.Preset.create({
                name: `${preset.name} (imported)`,
                description: preset.description,
                sound_configs: preset.sound_configs,
                is_public: false,
                is_curated: false,
              });
              await base44.entities.Preset.update(preset.id, {
                import_count: (preset.import_count || 0) + 1,
              });
              queryClient.invalidateQueries({ queryKey: ["presets"] });
              toast.success(`Imported: ${preset.name}`);
            }
          }
        })
        .catch(() => {});
      
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Handle shared garden link (?garden=rain,ocean,forest)
    const gardenParam = urlParams.get("garden");
    if (gardenParam) {
      const soundIds = gardenParam.split(",");
      setTimeout(() => {
        audioEngine.stopAll();
        const newSounds = soundIds.map((id) => {
          const sound = SOUNDS.find((s) => s.id === id);
          if (sound) { audioEngine.startSound(id, 70); return { ...sound, volume: 70 }; }
          return null;
        }).filter(Boolean);
        setActiveSounds(newSounds);
        toast.success("🌿 Garden loaded! Enjoy the soundscape.");
      }, 800);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [queryClient]);

  const handleUpgrade = useCallback((tier) => {
    setTargetTier(tier);
    setUpgradeModalOpen(true);
  }, []);

  // Fetch current user and subscription
  useEffect(() => {
    // Listen for upgrade events
    const handleUpgradeEvent = () => {
      handleUpgrade("premium");
    };
    window.addEventListener('upgrade-premium', handleUpgradeEvent);

    base44.auth.me().then(async (user) => {
      setCurrentUser(user);

      // Show onboarding for new users
      if (!user.onboarding_completed) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }

      // Apply user's default volume settings
      if (user.default_master_volume) {
        setMasterVolume(user.default_master_volume);
        audioEngine.setMasterVolume(user.default_master_volume);
      }

      // Sync subscription from Stripe once per session (delayed to avoid rate limits on load)
      if (!sessionStorage.getItem('sub_synced')) {
        setTimeout(async () => {
          try {
            await base44.functions.invoke('syncSubscriptionOnLogin');
            sessionStorage.setItem('sub_synced', '1');
          } catch (err) {
            // non-blocking
          }
        }, 2000);
      }

      // Owners/admins have full access
      if (user.role === "admin") {
        setUserTier("teams");
        setUserSubscription(null);
      } else {
        // Get tier from user profile (synced subscription data)
        const tier = user.subscription_tier || "free";
        const status = user.subscription_status || "active";
        setUserTier(tier);
        // Defer subscription entity fetch to avoid rate limiting on initial load
      }

      // Auto-play last session if enabled (skip if onboarding)
      // Defer this to avoid rate limiting on load
      if (user.auto_play_last_session && user.onboarding_completed) {
        setTimeout(async () => {
          try {
            const history = await base44.entities.PlaybackHistory.list("-created_date", 1);
            if (history.length > 0) {
              const lastSession = history[0];
              const newActiveSounds = lastSession.sound_configs.map((config) => {
                const sound = SOUNDS.find((s) => s.id === config.id);
                if (sound) {
                  audioEngine.startSound(config.id, config.volume);
                  return { ...sound, volume: config.volume };
                }
                return null;
              }).filter(Boolean);
              if (newActiveSounds.length > 0) {
                setActiveSounds(newActiveSounds);
              }
            }
          } catch (err) {
            // Non-blocking
          }
        }, 3000); // Stagger after initial UI render
      }
      }).catch(() => {});

      return () => {
      window.removeEventListener('upgrade-premium', handleUpgradeEvent);
      };
      }, [audioEngine, handleUpgrade]);

  // Fetch presets (critical, fetch immediately)
  const { data: presets = [], isLoading: presetsLoading } = useQuery({
    queryKey: ["presets"],
    queryFn: () => base44.entities.Preset.list("-created_date"),
    initialData: [],
  });

  // Fetch playback history (defer slightly to avoid rate limiting)
  const { data: playbackHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["playbackHistory"],
    queryFn: () => base44.entities.PlaybackHistory.list("-created_date", 50),
    initialData: [],
    enabled: !!presets.length, // Wait for presets to load first
  });

  // Fetch downloads (defer to avoid rate limiting)
  const { data: downloads = [], isLoading: downloadsLoading } = useQuery({
    queryKey: ["downloads"],
    queryFn: () => base44.entities.DownloadedSound.list("-created_date"),
    initialData: [],
    enabled: !!playbackHistory.length, // Further stagger
  });

  // Fetch favorites (defer to avoid rate limiting)
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => base44.entities.Favorite.list("-created_date"),
    initialData: [],
    enabled: !!downloads.length, // Further stagger
  });

  const addFavoriteMutation = useMutation({
    mutationFn: (data) => base44.entities.Favorite.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const previous = queryClient.getQueryData(["favorites"]);
      queryClient.setQueryData(["favorites"], (old) => [...(old || []), { ...data, id: `temp-${Date.now()}` }]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(["favorites"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const previous = queryClient.getQueryData(["favorites"]);
      queryClient.setQueryData(["favorites"], (old) => (old || []).filter((f) => f.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["favorites"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  // Save to history when sounds change
  useEffect(() => {
    if (activeSounds.length === 0) return;

    const timeoutId = setTimeout(async () => {
      const sound_configs = activeSounds.map((s) => ({ id: s.id, volume: s.volume }));
      const configKey = JSON.stringify(sound_configs);

      if (lastHistoryRecord.current === configKey) return;
      lastHistoryRecord.current = configKey;

      const soundNames = activeSounds.map((s) => s.label).join(" + ");
      await base44.entities.PlaybackHistory.create({
        sound_configs,
        session_name: soundNames,
      });
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [activeSounds]);

  const handleToggleSound = useCallback(
    (sound) => {
      setActiveSounds((prev) => {
        const exists = prev.find((s) => s.id === sound.id);
        if (exists) {
          audioEngine.stopSound(sound.id);
          analytics.trackSoundToggle(sound.id, false);
          activityTracker.trackSoundStopped(sound.id, sound.label);
          const remaining = prev.filter((s) => s.id !== sound.id);
          // Stop background if no sounds left
          if (remaining.length === 0) {
            audioEngine.stopSound("_base_background");
          }
          return remaining;
        } else {
          // Free tier: max 2 simultaneous sounds
          if (userTier === "free" && prev.length >= 2) {
            handleUpgrade("basic");
            return prev;
          }
          const defaultVolume = currentUser?.default_sound_volume || 70;
          audioEngine.startSound(sound.id, defaultVolume);
          analytics.trackSoundToggle(sound.id, true);
          activityTracker.trackSoundPlayed(sound.id, sound.label);
          const newSounds = [...prev, { ...sound, volume: defaultVolume }];
          // Add subtle background if not already present
          if (!newSounds.some((s) => s.id === "_base_background")) {
            audioEngine.startSound("_base_background", 12);
            newSounds.push({ id: "_base_background", label: "Forest Base", volume: 12, color: "#2d7d46" });
          }
          return newSounds;
        }
        });
        },
        [audioEngine, currentUser, analytics, activityTracker, userTier, handleUpgrade]
        );

  const handleVolumeChange = useCallback(
    (soundId, volume) => {
      audioEngine.setVolume(soundId, volume);
      setActiveSounds((prev) =>
        prev.map((s) => (s.id === soundId ? { ...s, volume } : s))
      );
    },
    [audioEngine]
  );

  const handleMasterVolumeChange = useCallback(
    (volume) => {
      setMasterVolume(volume);
      audioEngine.setMasterVolume(volume);
      if (isMuted && volume > 0) {
        setIsMuted(false);
        audioEngine.setMuted(false);
      }
    },
    [audioEngine, isMuted]
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      audioEngine.setMuted(!prev);
      return !prev;
    });
  }, [audioEngine]);



  const handleTimerEnd = useCallback(() => {
    audioEngine.stopAll();
    setActiveSounds([]);
  }, [audioEngine]);

  const handleSelectPreset = useCallback(
    (preset) => {
      // Stop all current sounds
      audioEngine.stopAll();
      setActiveSounds([]);

      // Start sounds from preset
      setTimeout(() => {
        const newActiveSounds = preset.sound_configs.map((config) => {
          const sound = SOUNDS.find((s) => s.id === config.id);
          if (sound) {
            audioEngine.startSound(config.id, config.volume);
            activityTracker.trackSoundPlayed(config.id, sound.label);
            return { ...sound, volume: config.volume };
          }
          return null;
        }).filter(Boolean);

        setActiveSounds(newActiveSounds);
        activityTracker.trackPresetLoaded(preset.name, preset.sound_configs);
      }, 100);
    },
    [audioEngine, activityTracker]
  );

  const handleReplayHistory = useCallback(
    (historyItem) => {
      // Stop all current sounds
      audioEngine.stopAll();
      setActiveSounds([]);

      // Start sounds from history
      setTimeout(() => {
        const newActiveSounds = historyItem.sound_configs.map((config) => {
          const sound = SOUNDS.find((s) => s.id === config.id);
          if (sound) {
            audioEngine.startSound(config.id, config.volume);
            return { ...sound, volume: config.volume };
          }
          return null;
        }).filter(Boolean);

        setActiveSounds(newActiveSounds);
      }, 100);
    },
    [audioEngine]
  );

  const handleAIGenerate = useCallback(
    async (prompt) => {
      // Premium feature check
      if (userTier !== "premium") {
        handleUpgrade("premium");
        return;
      }

      setAiDialogOpen(false);
      const userVibes = currentUser?.sound_vibes || [];
      const vibeContext = userVibes.length > 0
        ? `The user's personal sound preferences are: ${userVibes.join(", ")}. Factor these into your mix.`
        : "";
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Given this soundscape description: "${prompt}", select appropriate sounds and volumes to create the atmosphere. ${vibeContext}
        
Available sounds: rain, ocean, wind, forest, fire, birds, thunder, cafe, night, train, stream, fan, faith, calm

Return a JSON with this schema:
- sound_configs: array of {id: string (sound id), volume: number (0-100)}
- description: brief description of the generated soundscape

Think about what sounds naturally fit the mood and setting described. Vary volumes thoughtfully — not everything should be at 70.`,
        response_json_schema: {
          type: "object",
          properties: {
            sound_configs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  volume: { type: "number" },
                },
              },
            },
            description: { type: "string" },
          },
        },
      });

      // Stop all current sounds
      audioEngine.stopAll();
      setActiveSounds([]);

      // Start AI-generated sounds
      setTimeout(() => {
        const newActiveSounds = result.sound_configs.map((config) => {
          const sound = SOUNDS.find((s) => s.id === config.id);
          if (sound) {
            audioEngine.startSound(config.id, config.volume);
            return { ...sound, volume: config.volume };
          }
          return null;
        }).filter(Boolean);

        setActiveSounds(newActiveSounds);
      }, 100);
    },
    [audioEngine, userTier]
  );

  const handleToggleSoundFavorite = useCallback(
    async (sound) => {
      const existing = favorites.find((f) => f.type === "sound" && f.item_id === sound.id);
      if (existing) {
        await removeFavoriteMutation.mutateAsync(existing.id);
      } else {
        await addFavoriteMutation.mutateAsync({
          type: "sound",
          item_id: sound.id,
          name: sound.label,
          metadata: {
            color: sound.color,
            icon: sound.icon.name,
          },
        });
      }
    },
    [favorites, addFavoriteMutation, removeFavoriteMutation]
  );

  const handleTogglePresetFavorite = useCallback(
    async (preset) => {
      const existing = favorites.find((f) => f.type === "preset" && f.item_id === preset.id);
      if (existing) {
        await removeFavoriteMutation.mutateAsync(existing.id);
      } else {
        await addFavoriteMutation.mutateAsync({
          type: "preset",
          item_id: preset.id,
          name: preset.name,
          metadata: {
            description: preset.description,
          },
        });
      }
    },
    [favorites, addFavoriteMutation, removeFavoriteMutation]
  );

  const handleSelectFavoriteSound = useCallback(
    (soundId) => {
      const sound = SOUNDS.find((s) => s.id === soundId);
      if (sound) {
        handleToggleSound(sound);
      }
    },
    [handleToggleSound]
  );

  const handleSelectFavoritePreset = useCallback(
    async (presetId) => {
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        handleSelectPreset(preset);
      }
    },
    [presets, handleSelectPreset]
  );

  const handleRecordClick = useCallback(() => {
    setRecordDialogOpen(true);
  }, []);

  const handleSoundEffectChange = useCallback((soundId, effect, value) => {
    audioEngine.setSoundEffect(soundId, effect, value);
  }, [audioEngine]);

  const handleMasterEffectChange = useCallback((effect, value) => {
    audioEngine.setMasterEffect(effect, value);
  }, [audioEngine]);

  const handleCompleteOnboarding = useCallback(async () => {
    setShowOnboarding(false);
    if (currentUser) {
      await base44.auth.updateMe({ onboarding_completed: true });
    }
  }, [currentUser]);

  const handleSkipOnboarding = useCallback(async () => {
    setShowOnboarding(false);
    if (currentUser) {
      await base44.auth.updateMe({ onboarding_completed: true });
    }
  }, [currentUser]);

  const handleSelectJourney = useCallback(
    (journey) => {
      // Start sounds from journey
      audioEngine.stopAll();
      setActiveSounds([]);

      setTimeout(() => {
        const newActiveSounds = journey.sounds.map((soundId) => {
          const sound = SOUNDS.find((s) => s.id === soundId);
          if (sound) {
            audioEngine.startSound(soundId, 70);
            return { ...sound, volume: 70 };
          }
          return null;
        }).filter(Boolean);

        setActiveSounds(newActiveSounds);
        activityTracker.trackPresetLoaded(journey.name, journey.sounds);
      }, 100);

      setJourneySelectorOpen(false);
    },
    [audioEngine, activityTracker]
  );

  // Pull-to-Refresh for Home tab
  const refreshHome = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["presets"] }),
      queryClient.invalidateQueries({ queryKey: ["playbackHistory"] }),
      queryClient.invalidateQueries({ queryKey: ["downloads"] }),
      queryClient.invalidateQueries({ queryKey: ["favorites"] }),
    ]);
  };

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(refreshHome);

  return (
    <div data-tab-content className="min-h-screen bg-slate-950 text-white relative overflow-hidden overflow-y-auto" {...pullHandlers}>
      <PullIndicator />
      <OfflineIndicator />
      <GardenScene activeSounds={activeSounds} />
      
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-green-950/30 blur-[120px]"
          animate={activeSounds.length > 0 ? { scale: [1, 1.05, 1], opacity: [0.3, 0.45, 0.3] } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-950/25 blur-[120px]"
          animate={activeSounds.length > 0 ? { scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-[40%] left-[10%] w-[30vw] h-[30vw] rounded-full bg-teal-950/20 blur-[100px]"
          animate={activeSounds.length > 0 ? { scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] } : {}}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-8 pt-6 pb-36">
        <div className="max-w-3xl mx-auto">
          {/* Pricing Bar - full width across top */}
          <PricingBar currentTier={userTier} onUpgrade={handleUpgrade} onFreeClick={() => setFreeTierModalOpen(true)} />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-center mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <motion.span
                className="text-3xl sm:text-4xl"
                animate={activeSounds.length > 0 ? { rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 4, repeat: Infinity }}
              >
                🌿
              </motion.span>
              <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white/90">
                FloraSonics
              </h1>
              <motion.span
                className="text-3xl sm:text-4xl"
                animate={activeSounds.length > 0 ? { rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              >
                🌸
              </motion.span>
            </div>
            {currentUser && (
              <p className="text-emerald-400/60 text-sm font-medium mb-1">
                Welcome back, {currentUser.full_name?.split(" ")[0] || "gardener"} 🌱
              </p>
            )}
            <p className="text-white/30 text-sm sm:text-base font-light tracking-wide">
              🌿 Nature soundscapes powered by plants
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className={`w-4 h-4 ${i <= 4 ? "text-amber-400" : "text-white/20"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
              <span className="text-white/40 text-xs ml-1">4.0 / 5</span>
            </div>
            <p className="text-white/30 text-xs mt-2">
              🎵 Click a sound, then tap <span className="text-emerald-400/70 font-medium">Forest Base</span> below to hear it
            </p>
          </motion.div>

          {/* Garden Sound Mixer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            data-tour="sound-mixer"
          >
            <GardenMixer
              activeSounds={activeSounds}
              onToggleSound={handleToggleSound}
              onVolumeChange={handleVolumeChange}
              favorites={favorites}
              onToggleFavorite={handleToggleSoundFavorite}
              userTier={userTier}
              onUpgrade={handleUpgrade}
            />
          </motion.div>

          {/* Controls Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center items-center gap-2 mt-7"
          >
            <button
              onClick={() => setSaveDialogOpen(true)}
              disabled={activeSounds.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>{t("savePreset")}</span>
            </button>

            <div data-tour="presets">
              <PresetSelector
                presets={presets}
                onSelectPreset={handleSelectPreset}
                currentUser={currentUser}
                isLoading={presetsLoading}
                favorites={favorites}
                onToggleFavorite={handleTogglePresetFavorite}
              />
            </div>

            <button
              onClick={() => setAiDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-300 hover:text-emerald-200"
            >
              <Wand2 className="w-4 h-4" />
              <span>AI Personalization</span>
            </button>

            <button
              onClick={() => setJourneySelectorOpen(!journeySelectorOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
            >
              <Leaf className="w-4 h-4" />
              <span>Journeys</span>
            </button>

            <button
              onClick={() => setGardenShareOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30 text-green-300 hover:text-green-200 hover:from-green-600/30 hover:to-emerald-600/30"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Garden</span>
            </button>

            <DailyContent onPlaySound={handleToggleSound} activeSounds={activeSounds} />
            <NotificationSetup userStreak={0} />
            <DailyTasks currentUser={currentUser} />
            <WellnessReminder />
            <AmbientEffects onEffectChange={handleMasterEffectChange} />
            <NatureJournal activeSounds={activeSounds} />

            <button
              onClick={() => navigate(createPageUrl("Settings"))}
              data-tour="settings"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>{t("settings")}</span>
            </button>

            <button
              onClick={() => navigate(createPageUrl("Profile"))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-white/[0.06] border-white/[0.08] text-white/70 hover:text-white/90 hover:bg-white/[0.1]"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>

            <button
               onClick={() => navigate(createPageUrl("CorporateWellness"))}
               className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-blue-300 hover:text-blue-200 hover:from-blue-600/30 hover:to-indigo-600/30"
             >
               <Users className="w-4 h-4" />
               <span>Corporate Wellness</span>
             </button>
          </motion.div>



          {/* Professional Use Cases */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl"
          >
            <p className="text-white/30 text-xs uppercase tracking-widest text-center mb-3">Also perfect for</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { emoji: "🏫", title: "Teachers", desc: "Focus soundscapes for classrooms & labs" },
                { emoji: "🌸", title: "Botanical Gardens", desc: "Immersive audio for exhibits & visitor wellness" },
                { emoji: "🔬", title: "Botany & Research", desc: "Deep-focus environments for lab & fieldwork" },
                { emoji: "🌍", title: "Everyone", desc: "Nature sounds for focus, sleep & calm — for all" },
              ].map((item) => (
                <div key={item.title} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-2xl mb-1.5">{item.emoji}</div>
                  <p className="text-white/70 text-xs font-medium mb-1">{item.title}</p>
                  <p className="text-white/30 text-[11px] leading-snug hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Wellness Tools */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-2 mt-3"
          >
            <button
              onClick={() => setAiDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-300 hover:text-emerald-200"
            >
              <Wand2 className="w-4 h-4" />
              <span>AI Mix</span>
            </button>
            <BreathingExercise />
            <MeditationGuide />
            <SleepTimer onTimerEnd={() => { audioEngine.stopAll(); setActiveSounds([]); }} />
            <button
              onClick={() => setAiMeditationOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-300 hover:text-purple-200 hover:from-purple-600/30 hover:to-pink-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Wellness</span>
            </button>
          </motion.div>

          </div>
          </div>

      {/* Now Playing Bar */}
      <NowPlaying
        activeSounds={activeSounds}
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Save Preset Dialog */}
      <SavePresetDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        activeSounds={activeSounds}
      />

      {/* Record Soundscape Dialog */}
      <SoundscapeRecorder
        isOpen={recordDialogOpen}
        onClose={() => setRecordDialogOpen(false)}
        activeSounds={activeSounds}
        userTier={userTier}
      />

      {/* AI Soundscape Generator */}
      <AISoundscapeGenerator
        isOpen={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        onGenerate={handleAIGenerate}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        targetTier={targetTier}
      />

      {/* Subscription Manager */}
      <AnimatePresence>
        {subscriptionModalOpen && (
          <SubscriptionManager
            subscription={userSubscription}
            onClose={() => setSubscriptionModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Tour */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingTour
            onComplete={handleCompleteOnboarding}
            onSkip={handleSkipOnboarding}
            onApplyGoalPreset={(soundIds) => {
              audioEngine.stopAll();
              setActiveSounds([]);
              setTimeout(() => {
                const newSounds = soundIds.map(id => {
                  const sound = SOUNDS.find(s => s.id === id);
                  if (sound) { audioEngine.startSound(id, 70); return { ...sound, volume: 70 }; }
                  return null;
                }).filter(Boolean);
                setActiveSounds(newSounds);
              }, 100);
            }}
          />
        )}
      </AnimatePresence>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Journey Selector Modal */}
      <AnimatePresence>
        {journeySelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setJourneySelectorOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="fixed bottom-32 left-4 right-4 bg-slate-900/95 border border-emerald-500/20 rounded-2xl p-6 max-h-96 overflow-y-auto z-41"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Nature Journeys</h3>
              <JourneySelector onSelectJourney={handleSelectJourney} userGoal={currentUser?.wellness_goal} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Guided Meditation */}
      <AIGuidedMeditation
        isOpen={aiMeditationOpen}
        onClose={() => setAiMeditationOpen(false)}
      />

      {/* Free Tier Modal */}
      <FreeTierModal
        isOpen={freeTierModalOpen}
        onClose={() => setFreeTierModalOpen(false)}
      />

      {/* Garden Share Modal */}
      <GardenShareModal
        isOpen={gardenShareOpen}
        onClose={() => setGardenShareOpen(false)}
        playbackHistory={playbackHistory}
        userName={currentUser?.full_name?.split(" ")[0]}
      />


      </div>
      );
      }