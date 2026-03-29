import { useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Utility hook to track user activities
export function useActivityTracker() {
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const sessionStartTime = useRef(Date.now());
  const soundStartTimes = useRef({});
  const pendingWrite = useRef(null);

  // Debounced write to avoid bursting the rate limit
  const debouncedWrite = useCallback((data, delay = 1000) => {
    if (pendingWrite.current) clearTimeout(pendingWrite.current);
    pendingWrite.current = setTimeout(() => {
      base44.entities.ActivityTracking.create(data).catch(() => {});
    }, delay);
  }, []);

  useEffect(() => {
    // Track session start
    base44.entities.ActivityTracking.create({
      event_type: "session_start",
      session_id: sessionId.current,
      event_data: { timestamp: new Date().toISOString() },
    }).catch(() => {});

    // Heartbeat every 5 minutes (was 30s — too aggressive, caused 429s)
    const heartbeatInterval = setInterval(() => {
      base44.entities.ActivityTracking.create({
        event_type: "heartbeat",
        session_id: sessionId.current,
        event_data: { timestamp: new Date().toISOString() },
      }).catch(() => {});
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(heartbeatInterval);
      if (pendingWrite.current) clearTimeout(pendingWrite.current);
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      base44.entities.ActivityTracking.create({
        event_type: "session_end",
        session_id: sessionId.current,
        duration_seconds: sessionDuration,
        event_data: { timestamp: new Date().toISOString() },
      }).catch(() => {});
    };
  }, []);

  return {
    trackSoundPlayed: (soundId, soundName) => {
      soundStartTimes.current[soundId] = Date.now();
      debouncedWrite({
        event_type: "sound_played",
        session_id: sessionId.current,
        event_data: { sound_id: soundId, sound_name: soundName, timestamp: new Date().toISOString() },
      });
    },

    trackSoundStopped: (soundId, soundName) => {
      const startTime = soundStartTimes.current[soundId];
      if (startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        debouncedWrite({
          event_type: "sound_played",
          session_id: sessionId.current,
          duration_seconds: duration,
          event_data: { sound_id: soundId, sound_name: soundName, timestamp: new Date().toISOString(), stopped: true },
        });
        delete soundStartTimes.current[soundId];
      }
    },

    trackPresetSaved: (presetName, soundConfigs) => {
      base44.entities.ActivityTracking.create({
        event_type: "preset_saved",
        session_id: sessionId.current,
        event_data: { preset_name: presetName, sound_count: soundConfigs.length, timestamp: new Date().toISOString() },
      }).catch(() => {});
    },

    trackPresetLoaded: (presetName, soundConfigs) => {
      base44.entities.ActivityTracking.create({
        event_type: "preset_loaded",
        session_id: sessionId.current,
        event_data: { preset_name: presetName, sound_count: soundConfigs.length, timestamp: new Date().toISOString() },
      }).catch(() => {});
    },

    trackFeatureUsage: (featureType, duration, metadata = {}) => {
      base44.entities.ActivityTracking.create({
        event_type: featureType,
        session_id: sessionId.current,
        duration_seconds: duration,
        event_data: { ...metadata, timestamp: new Date().toISOString() },
      }).catch(() => {});
    },
  };
}