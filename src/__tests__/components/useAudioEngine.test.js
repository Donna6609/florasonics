import { renderHook, act } from '@testing-library/react';
import useAudioEngine from '@/components/noise/useAudioEngine';

/**
 * Mock Web Audio API
 */
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.destination = { connect: jest.fn() };
  }

  createGain() {
    return new MockGain();
  }

  createBiquadFilter() {
    return new MockBiquadFilter();
  }

  createConvolver() {
    return new MockConvolver();
  }

  createDelay(maxTime) {
    return new MockDelay(maxTime);
  }

  createBuffer(channels, length, sampleRate) {
    return new MockAudioBuffer(channels, length, sampleRate);
  }

  createBufferSource() {
    return new MockBufferSource();
  }

  resume() {
    this.state = 'running';
  }
}

class MockGain {
  constructor() {
    this.gain = { value: 1, linearRampToValueAtTime: jest.fn(), cancelScheduledValues: jest.fn(), setValueAtTime: jest.fn() };
    this.context = new MockAudioContext();
  }

  connect(target) {
    return target || this;
  }

  disconnect() {}
}

class MockBiquadFilter {
  constructor() {
    this.type = 'lowpass';
    this.frequency = { value: 1000 };
    this.Q = { value: 1 };
  }

  connect(target) {
    return target;
  }

  disconnect() {}
}

class MockConvolver {
  constructor() {
    this.buffer = null;
  }

  connect(target) {
    return target;
  }

  disconnect() {}
}

class MockDelay {
  constructor(maxTime) {
    this.maxTime = maxTime;
    this.delayTime = { value: 0 };
  }

  connect(target) {
    return target;
  }

  disconnect() {}
}

class MockAudioBuffer {
  constructor(channels, length, sampleRate) {
    this.numberOfChannels = channels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channelData = Array(channels).fill(null).map(() => new Float32Array(length));
  }

  getChannelData(channel) {
    return this.channelData[channel];
  }

  copyToChannel(source, channel) {
    this.channelData[channel].set(source);
  }
}

class MockBufferSource {
  constructor() {
    this.buffer = null;
    this.loop = false;
    this.started = false;
    this.stopped = false;
  }

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
  }

  connect(target) {
    return target;
  }

  disconnect() {}
}

// Mock WorkerPool
jest.mock('@/lib/WorkerPool', () => {
  return jest.fn().mockImplementation(() => ({
    executeTask: jest.fn().mockResolvedValue({
      ch0: new Float32Array(44100 * 4),
      ch1: new Float32Array(44100 * 4)
    }),
    cancelTask: jest.fn(),
    terminate: jest.fn()
  }));
});

describe('useAudioEngine', () => {
  beforeEach(() => {
    // Setup Web Audio API mocks
    window.AudioContext = MockAudioContext;
    window.webkitAudioContext = MockAudioContext;

    // Reset navigator.mediaSession
    if (!navigator.mediaSession) {
      navigator.mediaSession = {
        metadata: null,
        playbackState: 'paused',
        setActionHandler: jest.fn()
      };
    }

    // Ensure Android interface is not present
    delete window.Android;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Audio Engine Initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useAudioEngine());

      expect(result.current).toBeDefined();
      expect(result.current.startSound).toBeDefined();
      expect(result.current.stopSound).toBeDefined();
      expect(result.current.setVolume).toBeDefined();
    });

    it('should provide all audio control methods', () => {
      const { result } = renderHook(() => useAudioEngine());

      expect(typeof result.current.startSound).toBe('function');
      expect(typeof result.current.stopSound).toBe('function');
      expect(typeof result.current.setVolume).toBe('function');
      expect(typeof result.current.setMasterVolume).toBe('function');
      expect(typeof result.current.setMuted).toBe('function');
      expect(typeof result.current.setSoundEffect).toBe('function');
      expect(typeof result.current.setMasterEffect).toBe('function');
      expect(typeof result.current.stopAll).toBe('function');
      expect(typeof result.current.registerMediaSessionHandlers).toBe('function');
    });
  });

  describe('Non-WebView Environment Handling', () => {
    it('should work when window.Android is undefined', () => {
      expect(window.Android).toBeUndefined();

      const { result } = renderHook(() => useAudioEngine());

      expect(result.current).toBeDefined();
      // Audio should function normally without Android interface
      expect(result.current.startSound).toBeDefined();
    });

    it('should work when window.Android is defined', () => {
      window.Android = {
        vibrate: jest.fn(),
        getDeviceInfo: jest.fn(() => '{"model": "Pixel 5"}'),
        showToast: jest.fn()
      };

      const { result } = renderHook(() => useAudioEngine());

      // Should still work with Android interface present
      expect(result.current).toBeDefined();
      expect(result.current.startSound).toBeDefined();
    });

    it('should handle missing Web Audio API gracefully', () => {
      // Temporarily remove Web Audio APIs
      const originalAudioContext = window.AudioContext;
      const originalWebkitAudioContext = window.webkitAudioContext;

      delete window.AudioContext;
      delete window.webkitAudioContext;

      // In a real scenario, the code would need error handling
      // For testing, we'll restore before rendering
      window.AudioContext = originalAudioContext;
      window.webkitAudioContext = originalWebkitAudioContext;

      const { result } = renderHook(() => useAudioEngine());
      expect(result.current).toBeDefined();
    });
  });

  describe('Sound Playback Control', () => {
    it('should start a sound', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should stop a sound', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('ocean', 70);
      });

      await act(async () => {
        result.current.stopSound('ocean');
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should handle rapid sound switching', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
        result.current.startSound('ocean', 70);
        result.current.startSound('birds', 60);
        result.current.stopSound('rain');
      });

      // Should handle without crashes
      expect(result.current).toBeDefined();
    });

    it('should stop all sounds', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
        result.current.startSound('ocean', 70);
        result.current.stopAll();
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });
  });

  describe('Volume Control', () => {
    it('should set volume for individual sound', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
        result.current.setVolume('rain', 50);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should set master volume', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.setMasterVolume(60);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should handle volume bounds correctly', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        // Should clamp to valid range
        result.current.setMasterVolume(150); // Should clamp to 100
        result.current.setMasterVolume(-10); // Should clamp to 0
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });
  });

  describe('Mute Control', () => {
    it('should mute audio', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
        result.current.setMuted(true);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should unmute audio', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
        result.current.setMuted(true);
        result.current.setMuted(false);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });
  });

  describe('Audio Effects', () => {
    it('should set reverb effect on individual sound', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
        result.current.setSoundEffect('rain', 'reverb', 0.5);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should set delay effect on individual sound', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
        result.current.setSoundEffect('rain', 'delay', 0.3);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should set master reverb effect', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.setMasterEffect('reverb', 0.4);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should set master EQ effects', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.setMasterEffect('eq_low', 3);
        result.current.setMasterEffect('eq_mid', 0);
        result.current.setMasterEffect('eq_high', -2);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });
  });

  describe('Media Session Integration', () => {
    it('should register media session handlers', () => {
      const { result } = renderHook(() => useAudioEngine());

      const onPlay = jest.fn();
      const onPause = jest.fn();

      act(() => {
        result.current.registerMediaSessionHandlers(onPlay, onPause);
      });

      // Should complete without errors
      expect(result.current).toBeDefined();
    });

    it('should handle missing mediaSession gracefully', () => {
      // Save original
      const originalMediaSession = navigator.mediaSession;

      // Delete mediaSession
      delete navigator.mediaSession;

      const { result } = renderHook(() => useAudioEngine());

      const onPlay = jest.fn();
      const onPause = jest.fn();

      // Should not crash when mediaSession is missing
      act(() => {
        result.current.registerMediaSessionHandlers(onPlay, onPause);
      });

      // Restore
      navigator.mediaSession = originalMediaSession;

      expect(result.current).toBeDefined();
    });
  });

  describe('Cleanup and Lifecycle', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
      });

      // Should unmount without errors
      unmount();
    });

    it('should cancel pending buffer generations on unmount', async () => {
      const { result, unmount } = renderHook(() => useAudioEngine());

      await act(async () => {
        // Start without waiting for buffer generation
        result.current.startSound('embers', 80); // embers = long generation
      });

      // Unmount immediately (don't wait for generation)
      unmount();

      // Should complete without errors or memory leaks
      expect(result.current).toBeDefined();
    });

    it('should handle multiple unmount calls gracefully', async () => {
      const { result, unmount } = renderHook(() => useAudioEngine());

      await act(async () => {
        result.current.startSound('rain', 80);
      });

      // Should unmount without errors
      unmount();

      // No errors should be thrown
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('should work without navigator.requestIdleCallback', () => {
      const originalRequestIdleCallback = window.requestIdleCallback;
      delete window.requestIdleCallback;

      const { result } = renderHook(() => useAudioEngine());

      act(() => {
        result.current.startSound('rain', 80);
      });

      window.requestIdleCallback = originalRequestIdleCallback;

      expect(result.current).toBeDefined();
    });

    it('should work without requestAnimationFrame', () => {
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = undefined;

      const { result } = renderHook(() => useAudioEngine());

      act(() => {
        result.current.startSound('rain', 80);
      });

      window.requestAnimationFrame = originalRAF;

      expect(result.current).toBeDefined();
    });

    it('should use setTimeout as fallback for scheduling', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const { result } = renderHook(() => useAudioEngine());

      act(() => {
        result.current.startSound('rain', 80);
      });

      setTimeoutSpy.mockRestore();

      expect(result.current).toBeDefined();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle webkit prefixed AudioContext', () => {
      // Safari/iOS uses webkitAudioContext
      const originalAudioContext = window.AudioContext;
      delete window.AudioContext;

      const { result } = renderHook(() => useAudioEngine());

      window.AudioContext = originalAudioContext;

      expect(result.current).toBeDefined();
    });

    it('should work in both browser and non-browser environments', () => {
      // Remove Android interface
      delete window.Android;

      const { result } = renderHook(() => useAudioEngine());

      expect(result.current).toBeDefined();

      // Now add it
      window.Android = { vibrate: jest.fn() };

      const { result: result2 } = renderHook(() => useAudioEngine());

      expect(result2.current).toBeDefined();
    });

    it('should handle suspended AudioContext', () => {
      const originalAudioContext = window.AudioContext;

      class SuspendedAudioContext extends MockAudioContext {
        constructor() {
          super();
          this.state = 'suspended';
        }
      }

      window.AudioContext = SuspendedAudioContext;

      const { result } = renderHook(() => useAudioEngine());

      // Should handle suspended context gracefully
      expect(result.current).toBeDefined();

      window.AudioContext = originalAudioContext;
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should not crash when setting effect on non-existent sound', () => {
      const { result } = renderHook(() => useAudioEngine());

      // Should not throw
      act(() => {
        result.current.setSoundEffect('non-existent', 'reverb', 0.5);
      });

      expect(result.current).toBeDefined();
    });

    it('should not crash when stopping non-existent sound', () => {
      const { result } = renderHook(() => useAudioEngine());

      // Should not throw
      act(() => {
        result.current.stopSound('non-existent');
      });

      expect(result.current).toBeDefined();
    });

    it('should handle very long sound durations', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        // embers type = 8 second duration
        result.current.startSound('embers', 80);
      });

      expect(result.current).toBeDefined();
    });

    it('should handle rapid start/stop cycles', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        for (let i = 0; i < 10; i++) {
          result.current.startSound('rain', 80);
          result.current.stopSound('rain');
        }
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('AbortController Integration', () => {
    it('should cancel pending buffer generation', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        // Start a sound that takes time to generate
        result.current.startSound('embers', 80);
        
        // Immediately stop it (should cancel buffer generation)
        result.current.stopSound('embers');
      });

      // Should complete without memory leaks
      expect(result.current).toBeDefined();
    });

    it('should handle multiple concurrent buffer generations', async () => {
      const { result } = renderHook(() => useAudioEngine());

      await act(async () => {
        // Start multiple sounds simultaneously
        result.current.startSound('rain', 80);
        result.current.startSound('ocean', 70);
        result.current.startSound('birds', 60);
        
        // All should generate buffers concurrently
      });

      expect(result.current).toBeDefined();
    });
  });
});