import { useRef, useEffect, useCallback } from "react";
import WorkerPool from "@/lib/WorkerPool";

// Audio context singleton
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Persistent worker pool (created once, reused across all sounds)
let workerPoolInstance = null;
function getWorkerPool() {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool("/src/workers/audioBufferWorker.js", 2);
  }
  return workerPoolInstance;
}

// Generate buffer via WorkerPool, falling back to inline if Worker fails
// Fallback uses async chunking to prevent main-thread blocking
function createNoiseBufferAsync(ctx, type, soundId, abortSignal = null) {
  return new Promise((resolve) => {
    const sampleRate = ctx.sampleRate;
    const durationSec = type === "embers" ? 8 : 4;

    // Check if already cancelled before starting
    if (abortSignal?.aborted) {
      resolve(null);
      return;
    }

    try {
      const pool = getWorkerPool();
      
      // Execute task via pool with cancellation support
      pool.executeTask(soundId, { type, sampleRate, durationSec })
        .then((result) => {
          if (abortSignal?.aborted) {
            resolve(null);
            return;
          }
          
          const buffer = ctx.createBuffer(2, result.ch0.length, sampleRate);
          buffer.copyToChannel(result.ch0, 0);
          buffer.copyToChannel(result.ch1, 1);
          resolve(buffer);
        })
        .catch((error) => {
          // Fallback to async chunked sync generation if Worker pool fails
          if (abortSignal?.aborted) {
            resolve(null);
            return;
          }
          
          console.warn('[AudioEngine] Worker pool error, using fallback generation:', error.message);
          // Use requestIdleCallback to avoid blocking main thread during fallback
          createNoiseBufferFallback(ctx, type, durationSec, abortSignal).then(resolve);
        });

      // Listen for abort signal and cancel the task
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          pool.cancelTask(soundId);
        }, { once: true });
      }
    } catch (error) {
      // Worker pool unavailable, use async chunked generation
      console.warn('[AudioEngine] Web Workers unavailable, using fallback generation:', error.message);
      createNoiseBufferFallback(ctx, type, durationSec, abortSignal).then(resolve);
    }
  });
}

// Asynchronous fallback: generates buffer in chunks with full AbortController support
// Ensures no blocking occurs and cancellation is instantaneous
function createNoiseBufferFallback(ctx, type, durationSec, abortSignal = null) {
  return new Promise((resolve) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSec;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const chunkSize = sampleRate * 0.5; // 500ms chunks
    let processedChannels = 0;
    let isAborted = false;

    // Listen for abort immediately
    const abortHandler = () => {
      isAborted = true;
    };

    if (abortSignal) {
      abortSignal.addEventListener('abort', abortHandler);
    }

    const processChannel = (channel) => {
      const data = buffer.getChannelData(channel);
      let i = 0;

      const processChunk = () => {
        // Check abort status at chunk start (instantaneous check)
        if (isAborted || abortSignal?.aborted) {
          // Cleanup abort listener
          if (abortSignal) {
            abortSignal.removeEventListener('abort', abortHandler);
          }
          resolve(null);
          return;
        }

        const endIdx = Math.min(i + chunkSize, length);
        
        // Inline simplified generation for this chunk
        for (; i < endIdx; i++) {
          if (type === "rain") {
            const dropletChance = 0.12;
            data[i] = Math.random() < dropletChance
              ? (Math.random() * 2 - 1) * Math.exp(-4 * ((i % (sampleRate * 0.08)) / (sampleRate * 0.08)))
              : data[i] * 0.3;
          } else if (type === "ocean") {
            const waveFreq = 0.4 + 0.3 * Math.sin(i / (sampleRate * 2));
            data[i] = Math.sin((i / sampleRate) * Math.PI * waveFreq * 2) * 0.5 + (Math.random() * 2 - 1) * 0.5;
          } else {
            // Default white noise
            data[i] = Math.random() * 2 - 1;
          }
        }

        if (i < length) {
          // Yield to main thread via requestIdleCallback (with setTimeout fallback)
          if ('requestIdleCallback' in window) {
            requestIdleCallback(processChunk, { timeout: 100 });
          } else {
            setTimeout(processChunk, 0);
          }
        } else {
          // Channel processing complete
          processedChannels++;
          if (processedChannels === 2) {
            // All channels done
            if (abortSignal) {
              abortSignal.removeEventListener('abort', abortHandler);
            }
            resolve(buffer);
          } else {
            // Start next channel
            processChannel(1);
          }
        }
      };

      processChunk();
    };

    // Process both channels
    processChannel(0);
  });
}

// Synchronous fallback (used by worker error path & reverb impulse)
function createNoiseBuffer(ctx, type, durationSec = type === "embers" ? 8 : 4) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    if (type === "rain") {
      // Rain: sharp droplets with rapid clicks
      for (let i = 0; i < length; i++) {
        const dropletChance = 0.12;
        if (Math.random() < dropletChance) {
          const decayFrames = sampleRate * 0.08;
          const pos = i % decayFrames;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-4 * pos / decayFrames);
        } else {
          data[i] *= 0.3;
        }
      }
    } else if (type === "ocean") {
      // Ocean/waves: rolling wave motion with pitch variation
      for (let i = 0; i < length; i++) {
        const waveFreq = 0.4 + 0.3 * Math.sin(i / (sampleRate * 2));
        const baseSine = Math.sin((i / sampleRate) * Math.PI * waveFreq * 2);
        const noise = Math.random() * 2 - 1;
        data[i] = baseSine * 0.5 + noise * 0.5;
      }
    } else if (type === "train") {
      // Train: rhythmic tracks with periodic rumbles
      for (let i = 0; i < length; i++) {
        const beatFreq = i / (sampleRate * 1.5);
        const beat = Math.sin(beatFreq * Math.PI * 2) * 0.4;
        const rumble = Math.sin((i / sampleRate) * Math.PI * 0.3) * 0.3;
        const noise = Math.random() * 2 - 1;
        data[i] = beat + rumble + noise * 0.3;
      }
    } else if (type === "birds") {
      // Birds: chirping sounds with varying frequencies
      for (let i = 0; i < length; i++) {
        const chirpChance = 0.08;
        const chirpFreq = 2 + Math.sin(i / (sampleRate * 0.5)) * 1.5;
        let sample = 0;
        if (Math.random() < chirpChance) {
          const decayFrames = sampleRate * 0.15;
          const pos = i % decayFrames;
          sample = Math.sin((i / sampleRate) * Math.PI * chirpFreq * 2) * Math.exp(-3 * pos / decayFrames);
        }
        const noise = Math.random() * 2 - 1;
        data[i] = sample * 0.6 + noise * 0.15;
      }
    } else if (type === "embers") {
      // Ice Cycles: deep plant bass drone + ice crackles + icicle drips + cold wind breath
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;

        // Strong plant bass foundation — deep harmonic drone
        const root   = Math.sin(t * Math.PI * 2 * 55)  * 0.40;
        const h2     = Math.sin(t * Math.PI * 2 * 110) * 0.22;
        const h3     = Math.sin(t * Math.PI * 2 * 165) * 0.12;
        const h4     = Math.sin(t * Math.PI * 2 * 220) * 0.06;
        // Slow breathing envelope on plant bass
        const bassBreath = 0.65 + 0.35 * Math.sin(t * Math.PI * 2 / 5.5);
        const plantBass = (root + h2 + h3 + h4) * bassBreath;

        // Cold wind whisper underneath
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.990 * b1 + white * 0.020;
        b2 = 0.978 * b2 + white * 0.035;
        const coldWind = (b0 + b1 + b2) * 0.5;
        const gustSwell = 0.25 + 0.75 * Math.abs(Math.sin(t * Math.PI * 2 / 9.0));

        // Frequent sharp ice crackles — high rate, clearly audible
        const crackleChance = 0.055;
        let crackle = 0;
        if (Math.random() < crackleChance) {
          const decayFrames = sampleRate * 0.012;
          const pos = i % decayFrames;
          crackle = (Math.random() * 2 - 1) * Math.exp(-15 * pos / decayFrames) * (0.7 + Math.random() * 0.5);
        }
        // Icicle drip — tonal, clearly pitched
        const dripChance = 0.005;
        let drip = 0;
        if (Math.random() < dripChance) {
          const decayFrames = sampleRate * 0.20;
          const pos = i % decayFrames;
          const dripFreq = 400 + Math.random() * 300; // lower freq so not cut by filter
          drip = Math.sin((i / sampleRate) * Math.PI * 2 * dripFreq)
            * Math.exp(-6 * pos / decayFrames) * (0.65 + Math.random() * 0.35);
        }
        // Ice sheet groan — every few seconds
        const groanChance = 0.0015;
        let groan = 0;
        if (Math.random() < groanChance) {
          const decayFrames = sampleRate * 0.35;
          const pos = i % decayFrames;
          groan = Math.sin((i / sampleRate) * Math.PI * 2 * 65)
            * Math.exp(-4 * pos / decayFrames) * 0.80;
        }
        // Icicle snap — sharp transient crack
        const snapChance = 0.003;
        let snap = 0;
        if (Math.random() < snapChance) {
          const decayFrames = sampleRate * 0.035;
          const pos = i % decayFrames;
          snap = (Math.random() * 2 - 1) * Math.exp(-25 * pos / decayFrames) * 0.95;
        }
        // Ice cave resonance hum
        const caveHum = Math.sin(t * Math.PI * 2 * 38) * 0.12
          * (0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 2 / 7.2)));

        data[i] = (plantBass * 0.48 + coldWind * gustSwell * 0.14 + crackle + drip + groan + snap + caveHum) * 0.88;
      }
    } else if (type === "hearth") {
      // Hearth (ice): cold wind whisper + ice crackle + distant wind chimes
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.990 * b1 + white * 0.020;
        b2 = 0.978 * b2 + white * 0.035;
        const coldWind = (b0 + b1 + b2) * 0.85;
        // Cold wind gust swell
        const gust = 0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI * 2 / 8.0));
        // Ice crackle: frequent sharp high-frequency pops + occasional deep ice sheet crack
        const crackleChance = 0.022;
        let crackle = 0;
        if (Math.random() < crackleChance) {
          const decayFrames = sampleRate * 0.018;
          const pos = i % decayFrames;
          crackle = (Math.random() * 2 - 1) * Math.exp(-9 * pos / decayFrames) * (0.7 + Math.random() * 0.5);
        }
        // Deep ice sheet groan (rare, low-freq)
        const groanChance = 0.0003;
        let groan = 0;
        if (Math.random() < groanChance) {
          const decayFrames = sampleRate * 0.25;
          const pos = i % decayFrames;
          groan = Math.sin((i / sampleRate) * Math.PI * 2 * 80) * Math.exp(-6 * pos / decayFrames) * 0.6;
        }
        // Icy chime tones
        const chimeChance = 0.0004;
        let chime = 0;
        if (Math.random() < chimeChance) {
          const decayFrames = sampleRate * 2.0;
          const pos = i % decayFrames;
          const chimeFreqs = [1568, 2093, 2637, 3136];
          const cf = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
          chime = Math.sin(t * Math.PI * 2 * cf) * Math.exp(-3.5 * pos / decayFrames) * 0.35;
        }
        data[i] = (coldWind * gust * 0.35 + crackle + groan + chime) * 0.82;
      }
    } else if (type === "plant_bass") {
      // Plant Bass: deep harmonic drone with botanical resonance
      for (let i = 0; i < length; i++) {
        const root = Math.sin((i / sampleRate) * Math.PI * 2 * 55) * 0.35;
        const h2 = Math.sin((i / sampleRate) * Math.PI * 2 * 110) * 0.18;
        const h3 = Math.sin((i / sampleRate) * Math.PI * 2 * 165) * 0.09;
        const h4 = Math.sin((i / sampleRate) * Math.PI * 2 * 220) * 0.04;
        const breathe = 0.7 + 0.3 * Math.sin(i / (sampleRate * 4.5));
        const rustle = (Math.random() * 2 - 1) * 0.018;
        data[i] = (root + h2 + h3 + h4 + rustle) * breathe * 0.85;
      }
    } else if (type === "fire") {
      // Campfire (outdoor): crackling fire + open-air wind gusts + distant night ambience
      let lastOut = 0;
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.04 * white) / 1.04;

        // Fire crackling
        const crackleChance = 0.20;
        let crackle = 0;
        if (Math.random() < crackleChance) {
          const intensity = Math.random();
          crackle = (Math.random() * 2 - 1) * (0.6 + intensity * 0.35);
        }

        // Open-air wind — slow gusting swells
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.988 * b1 + white * 0.022;
        b2 = 0.972 * b2 + white * 0.040;
        const windNoise = (b0 + b1 + b2) * 0.7;
        const gustSwell = 0.2 + 0.8 * Math.abs(Math.sin(t * Math.PI * 2 / 9.5));
        const wind = windNoise * gustSwell * 0.45;

        // Occasional wood pop / snap
        const snapChance = 0.0003;
        let snap = 0;
        if (Math.random() < snapChance) {
          const decayFrames = sampleRate * 0.04;
          const pos = i % decayFrames;
          snap = (Math.random() * 2 - 1) * Math.exp(-25 * pos / decayFrames) * 0.8;
        }

        // Distant night ambience undertone (very subtle cricket-like hum)
        const nightHum = Math.sin(t * Math.PI * 2 * 3200) * 0.012 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 4.1));

        data[i] = (lastOut * 2.5 + crackle + wind + snap + nightHum) * 0.62;
      }
    } else if (type === "night") {
      // Night: ambient crickets, wind, subtle rustling
      let lastVal = 0;
      for (let i = 0; i < length; i++) {
        const cricketChance = 0.06;
        const windModulation = 0.5 + 0.5 * Math.sin(i / (sampleRate * 2.5));
        let sample = 0;
        if (Math.random() < cricketChance) {
          sample = Math.sin((i / sampleRate) * Math.PI * 4) * 0.5;
        }
        const noise = Math.random() * 2 - 1;
        lastVal = lastVal * 0.9 + noise * windModulation * 0.1;
        data[i] = sample + lastVal * 0.4;
      }
    } else if (type === "faith") {
      // Faith: rich choir harmonics + resonant bell tones + soft breath noise
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Choir-like layered harmonics (A minor / pentatonic feel)
        const root    = Math.sin(t * Math.PI * 2 * 220)  * 0.28; // A3
        const fifth   = Math.sin(t * Math.PI * 2 * 330)  * 0.20; // E4
        const octave  = Math.sin(t * Math.PI * 2 * 440)  * 0.14; // A4
        const third   = Math.sin(t * Math.PI * 2 * 528)  * 0.10; // C5 approx
        const high    = Math.sin(t * Math.PI * 2 * 660)  * 0.06; // E5
        // Slow swelling breath envelope
        const breathSlow = 0.55 + 0.45 * Math.sin(t * Math.PI * 2 / 7.5);
        const breathFast = 0.85 + 0.15 * Math.sin(t * Math.PI * 2 / 2.1);
        // Distant bell / chime tones
        const bellChance = 0.0004;
        let bell = 0;
        if (Math.random() < bellChance) {
          const decayFrames = sampleRate * 2.2;
          const pos = i % decayFrames;
          const bellFreq = [528, 660, 792, 880][Math.floor(Math.random() * 4)];
          bell = Math.sin((i / sampleRate) * Math.PI * 2 * bellFreq)
                 * Math.exp(-3 * pos / decayFrames) * 0.45;
        }
        // Soft breath noise undertone
        const breathNoise = (Math.random() * 2 - 1) * 0.035;
        const choir = (root + fifth + octave + third + high) * breathSlow * breathFast;
        data[i] = (choir + bell + breathNoise) * 0.78;
      }
    } else if (type === "snow") {
       // Snow: layered wind whisper + distant wind chimes + soft powder texture
       let b0 = 0, b1 = 0, b2 = 0;
       for (let i = 0; i < length; i++) {
         const t = i / sampleRate;
         // Layered pink-ish wind whisper
         const white = Math.random() * 2 - 1;
         b0 = 0.998 * b0 + white * 0.012;
         b1 = 0.991 * b1 + white * 0.022;
         b2 = 0.975 * b2 + white * 0.038;
         const windBase = (b0 + b1 + b2) * 0.9;
         // Slow wind gust swell
         const gustSlow = 0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 2 / 11.0));
         const gustFast = 0.7 + 0.3 * Math.sin(t * Math.PI * 2 / 3.3);
         // Ice crystal / chime tones — rare, delicate
         const chimeChance = 0.0005;
         let chime = 0;
         if (Math.random() < chimeChance) {
           const decayFrames = sampleRate * 1.8;
           const pos = i % decayFrames;
           const chimeFreqs = [1047, 1319, 1568, 2093];
           const cf = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
           chime = Math.sin(t * Math.PI * 2 * cf)
                   * Math.exp(-4 * pos / decayFrames) * 0.3;
         }
         // Occasional soft crunch (footstep in snow)
         const crunchChance = 0.0001;
         let crunch = 0;
         if (Math.random() < crunchChance) {
           crunch = (Math.random() * 2 - 1) * 0.25;
         }
         data[i] = (windBase * gustSlow * gustFast * 0.55 + chime + crunch) * 0.7;
       }
    } else if (type === "neuroharmony") {
       // Neuro Harmony: heartbeat rhythm + soft pink noise + soothing harmonics
       let b0 = 0, b1 = 0, b2 = 0;
       // Heartbeat tempo: ~65 BPM = 0.923s per beat
       const bpm = 65;
       const beatInterval = sampleRate * (60 / bpm);
       for (let i = 0; i < length; i++) {
         const t = i / sampleRate;
         // Gentle pink noise foundation
         const white = Math.random() * 2 - 1;
         b0 = 0.995 * b0 + white * 0.016;
         b1 = 0.989 * b1 + white * 0.028;
         b2 = 0.970 * b2 + white * 0.055;
         const pinkBase = (b0 + b1 + b2) * 0.95;

         // Richer harmonic undertones (binaural-feel drone layers)
         const harmonic1 = Math.sin(t * Math.PI * 2 * 40) * 0.10;
         const harmonic2 = Math.sin(t * Math.PI * 2 * 88) * 0.07;
         const harmonic3 = Math.sin(t * Math.PI * 2 * 136) * 0.05; // 3rd partial
         const harmonic4 = Math.sin(t * Math.PI * 2 * 52) * 0.06  // slight detuned for richness
           * (0.7 + 0.3 * Math.sin(t * Math.PI * 2 / 8.0));
         // Slow swooshing ambient swell (like deep ocean)
         const ambientSwell = Math.sin(t * Math.PI * 2 * 18) * 0.08
           * (0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 2 / 6.5)));

         // Very slow breathing envelope
         const breathEnv = 0.50 + 0.50 * Math.sin(t * Math.PI * 2 / 12.0);

         // Heartbeat: two-thump pattern (lub-dub) per beat — prominent
         const posInBeat = i % beatInterval;
         const lub = posInBeat < sampleRate * 0.08
           ? Math.sin((posInBeat / sampleRate) * Math.PI * 2 * 55) * Math.exp(-10 * posInBeat / (sampleRate * 0.08)) * 0.95
           : 0;
         const dubOffset = sampleRate * 0.14;
         const dubPos = posInBeat - dubOffset;
         const dub = dubPos > 0 && dubPos < sampleRate * 0.07
           ? Math.sin((dubPos / sampleRate) * Math.PI * 2 * 65) * Math.exp(-11 * dubPos / (sampleRate * 0.07)) * 0.70
           : 0;
         // Sub-bass thud under each lub for physicality
         const subThud = posInBeat < sampleRate * 0.05
           ? Math.sin((posInBeat / sampleRate) * Math.PI * 2 * 30) * Math.exp(-8 * posInBeat / (sampleRate * 0.05)) * 0.50
           : 0;
         const heartbeat = (lub + dub + subThud);

         data[i] = ((pinkBase * 0.30 + (harmonic1 + harmonic2 + harmonic3 + harmonic4) * 0.20 + ambientSwell) * breathEnv + heartbeat) * 0.88;
       }
    } else if (type === "drip") {
      // Dripping water: irregular distinct drops with resonant plop and subtle echo
      for (let i = 0; i < length; i++) {
        data[i] = 0;
      }
      // Scatter drip events across the buffer
      const dropCount = Math.floor(sampleRate * durationSec * 0.8); // ~0.8 drops/sec average density
      let i = 0;
      while (i < length) {
        // Random gap between drops: 0.3s to 2.5s
        const gap = Math.floor(sampleRate * (0.3 + Math.random() * 2.2));
        i += gap;
        if (i >= length) break;
        // Each drop: short tonal decay (100–400 Hz plop)
        const dropFreq = 120 + Math.random() * 280;
        const dropAmp = 0.4 + Math.random() * 0.5;
        const dropDecay = sampleRate * (0.04 + Math.random() * 0.08);
        for (let j = 0; j < dropDecay && i + j < length; j++) {
          const env = Math.exp(-6 * j / dropDecay);
          const tone = Math.sin((j / sampleRate) * Math.PI * 2 * dropFreq);
          // Add slight click at onset
          const click = j < 5 ? (Math.random() * 2 - 1) * 0.3 : 0;
          data[i + j] += (tone * env * dropAmp + click) * 0.7;
        }
        // Subtle echo ~80ms later
        const echoOffset = Math.floor(sampleRate * 0.08);
        const echoDecay = sampleRate * 0.04;
        for (let j = 0; j < echoDecay && i + echoOffset + j < length; j++) {
          const env = Math.exp(-8 * j / echoDecay);
          const tone = Math.sin((j / sampleRate) * Math.PI * 2 * dropFreq * 0.95);
          data[i + echoOffset + j] += tone * env * dropAmp * 0.2;
        }
      }
      // Add very soft background trickle (low-level pink-ish noise)
      let b0 = 0, b1 = 0;
      for (let k = 0; k < length; k++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.992 * b0 + w * 0.025;
        b1 = 0.975 * b1 + w * 0.045;
        data[k] += (b0 + b1) * 0.08;
      }
    } else if (type === "leaves") {
      // Leaves: frequent crisp leaf taps + papery rustle bursts + wind undertone
      let b0 = 0, b1 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.990 * b0 + white * 0.030;
        b1 = 0.970 * b1 + white * 0.060;
        const rustleBase = (b0 + b1) * 0.6;
        // Frequent leaf tap clicks (high-frequency, short decay)
        const tapChance = 0.18;
        let tap = 0;
        if (Math.random() < tapChance) {
          const decayFrames = sampleRate * 0.025;
          const pos = i % decayFrames;
          const tapFreq = 3000 + Math.random() * 3000;
          tap = Math.sin((i / sampleRate) * Math.PI * 2 * tapFreq) * Math.exp(-10 * pos / decayFrames) * (0.3 + Math.random() * 0.4);
        }
        // Occasional rustle burst
        const burstChance = 0.003;
        let burst = 0;
        if (Math.random() < burstChance) {
          const decayFrames = sampleRate * 0.12;
          const pos = i % decayFrames;
          burst = (Math.random() * 2 - 1) * Math.exp(-5 * pos / decayFrames) * 0.5;
        }
        // Gentle wind swell
        const windSwell = 0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI * 2 / 6.0));
        data[i] = (rustleBase * windSwell * 0.4 + tap + burst) * 0.72;
      }
    } else if (type === "thunder_roar") {
      // Thunder: massive low-frequency boom with rumble tail + lightning crack
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.025 * white) / 1.025;
        // Deep roar base — massive low-frequency wall of sound
        const rumble = Math.sin(t * Math.PI * 2 * 22) * 0.55;
        const subRumble = Math.sin(t * Math.PI * 2 * 14) * 0.45;
        const midRumble = Math.sin(t * Math.PI * 2 * 48) * 0.25;
        const highRumble = Math.sin(t * Math.PI * 2 * 80) * 0.15;
        // Continuous roar swell — the sky tearing open
        const roarSwell = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 2 / 3.2));
        // Periodic thunder boom events
        const boomInterval = sampleRate * 4.0;
        const posInBoom = i % boomInterval;
        const boomEnv = posInBoom < sampleRate * 2.5
          ? Math.exp(-1.2 * posInBoom / (sampleRate * 2.5)) * (0.8 + Math.random() * 0.2)
          : 0;
        // Sharp lightning crack at boom onset
        const crack = posInBoom < sampleRate * 0.04
          ? (Math.random() * 2 - 1) * Math.exp(-18 * posInBoom / (sampleRate * 0.04)) * 1.2
          : 0;
        data[i] = ((lastOut * 4.5 + (rumble + subRumble + midRumble + highRumble) * roarSwell) * (0.5 + boomEnv * 0.5) + crack) * 0.82;
      }
    } else if (type === "cafe") {
      // Café: low chatter murmur + coffee machine hiss + occasional cup/spoon clinks
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        // Warm mid-range pink noise base (room ambience)
        b0 = 0.994 * b0 + white * 0.018;
        b1 = 0.986 * b1 + white * 0.032;
        b2 = 0.960 * b2 + white * 0.058;
        const roomNoise = (b0 + b1 + b2) * 0.7;

        // Talking murmur: overlapping voice-frequency oscillations that fade in/out
        const voice1 = Math.sin(t * Math.PI * 2 * 180) * 0.06 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.7));
        const voice2 = Math.sin(t * Math.PI * 2 * 240) * 0.05 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 2.3 + 1.1));
        const voice3 = Math.sin(t * Math.PI * 2 * 310) * 0.04 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.4 + 2.5));
        const voice4 = Math.sin(t * Math.PI * 2 * 420) * 0.035 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 3.1 + 0.7));
        // Noise band shaped like speech formants
        const chatterNoise = (Math.random() * 2 - 1) * 0.12
          * (0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI * 2 / 0.35)));
        const murmur = voice1 + voice2 + voice3 + voice4 + chatterNoise;

        // Occasional cup clink / spoon tap
        const clinkChance = 0.00015;
        let clink = 0;
        if (Math.random() < clinkChance) {
          const decayFrames = sampleRate * 0.12;
          const pos = i % decayFrames;
          const clinkFreq = 2200 + Math.random() * 1800;
          clink = Math.sin((i / sampleRate) * Math.PI * 2 * clinkFreq)
            * Math.exp(-12 * pos / decayFrames) * (0.35 + Math.random() * 0.25);
        }
        // Occasional espresso machine hiss burst
        const hissChance = 0.00005;
        let hiss = 0;
        if (Math.random() < hissChance) {
          const decayFrames = sampleRate * 0.6;
          const pos = i % decayFrames;
          hiss = (Math.random() * 2 - 1) * Math.exp(-4 * pos / decayFrames) * 0.3;
        }
        data[i] = (roomNoise * 0.35 + murmur * 1.2 + clink + hiss) * 0.75;
      }
    } else if (type === "library") {
      // Library: quiet hush + book stomps/thuds + occasional page turn
      let b0 = 0, b1 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        // Very quiet warm room hush
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.985 * b1 + white * 0.020;
        const hush = (b0 + b1) * 0.25;

        // Book stomp / heavy thud (book slammed on shelf or desk)
        const stompChance = 0.00012;
        let stomp = 0;
        if (Math.random() < stompChance) {
          const decayFrames = sampleRate * 0.22;
          const pos = i % decayFrames;
          // Low thud tone
          const thudFreq = 60 + Math.random() * 80;
          stomp = Math.sin((i / sampleRate) * Math.PI * 2 * thudFreq)
            * Math.exp(-8 * pos / decayFrames) * (0.7 + Math.random() * 0.4);
          // Add a woody knock on top
          stomp += (Math.random() * 2 - 1) * Math.exp(-20 * pos / decayFrames) * 0.5;
        }
        // Softer book set-down thud (more frequent)
        const softThudChance = 0.00025;
        let softThud = 0;
        if (Math.random() < softThudChance) {
          const decayFrames = sampleRate * 0.10;
          const pos = i % decayFrames;
          const thudFreq = 120 + Math.random() * 100;
          softThud = Math.sin((i / sampleRate) * Math.PI * 2 * thudFreq)
            * Math.exp(-15 * pos / decayFrames) * (0.4 + Math.random() * 0.3);
        }
        // Occasional paper/page rustle
        const rustleChance = 0.0003;
        let rustle = 0;
        if (Math.random() < rustleChance) {
          const decayFrames = sampleRate * 0.08;
          const pos = i % decayFrames;
          rustle = (Math.random() * 2 - 1) * Math.exp(-8 * pos / decayFrames) * 0.25;
        }
        data[i] = (hush + stomp + softThud + rustle) * 0.8;
      }
    } else if (type === "plane") {
      // Plane cabin: deep engine drone + cabin pressure hum + occasional turbulence bump
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        // Brown-ish noise for engine roar base
        b0 = 0.996 * b0 + white * 0.014;
        b1 = 0.988 * b1 + white * 0.026;
        b2 = 0.970 * b2 + white * 0.048;
        const engineNoise = (b0 + b1 + b2) * 0.9;

        // Engine fundamental tones (jet turbine harmonics)
        const eng1 = Math.sin(t * Math.PI * 2 * 95) * 0.22;
        const eng2 = Math.sin(t * Math.PI * 2 * 190) * 0.12;
        const eng3 = Math.sin(t * Math.PI * 2 * 285) * 0.06;
        // Slow cabin pressure swell
        const pressureSwell = 0.7 + 0.3 * Math.sin(t * Math.PI * 2 / 9.0);
        // Occasional turbulence bump
        const turbChance = 0.00008;
        let turb = 0;
        if (Math.random() < turbChance) {
          const decayFrames = sampleRate * 0.4;
          const pos = i % decayFrames;
          turb = (Math.random() * 2 - 1) * Math.exp(-5 * pos / decayFrames) * 0.35;
        }
        data[i] = ((engineNoise * 0.5 + (eng1 + eng2 + eng3)) * pressureSwell + turb) * 0.78;
      }
    } else if (type === "fan") {
      // Fan: steady white noise base + whistling tone that wobbles + periodic blade whoosh
      let b0 = 0, b1 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        // Steady mid-frequency fan hum (filtered noise)
        b0 = 0.992 * b0 + white * 0.022;
        b1 = 0.978 * b1 + white * 0.042;
        const fanNoise = (b0 + b1) * 0.6;

        // Whistle tone: ~800 Hz with gentle vibrato wobble
        const whistleFreq = 800 + 40 * Math.sin(t * Math.PI * 2 / 2.3);
        const whistle = Math.sin(t * Math.PI * 2 * whistleFreq) * 0.12
          * (0.6 + 0.4 * Math.sin(t * Math.PI * 2 / 5.7));
        // Secondary harmonic whistle
        const whistle2 = Math.sin(t * Math.PI * 2 * (whistleFreq * 1.5)) * 0.06
          * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 3.1 + 1.2));

        // Periodic blade whoosh (rotation rhythm ~3 Hz)
        const bladeRhythm = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 3.0);
        const whoosh = fanNoise * bladeRhythm * 0.3;

        data[i] = (fanNoise * 0.5 + whistle + whistle2 + whoosh) * 0.8;
      }
    } else if (type === "white" || type === "wind" || type === "_base_background") {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === "pink" || type === "stream") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      // Brown noise for fire, thunder, train, etc.
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }
  }

  return buffer;
}

// Get filter settings for each sound type
function getFilterSettings(soundId) {
  switch (soundId) {
    case "rain":
      return { type: "lowpass", frequency: 800, Q: 0.5 };
    case "ocean":
      return { type: "lowpass", frequency: 400, Q: 0.7 };
    case "wind":
      return { type: "bandpass", frequency: 600, Q: 0.3 };
    case "forest":
      return { type: "bandpass", frequency: 2000, Q: 0.5 };
    case "fire":
      return { type: "lowpass", frequency: 350, Q: 0.8 };
    case "birds":
      return { type: "highpass", frequency: 2500, Q: 0.4 };
    case "thunder":
      return { type: "lowpass", frequency: 180, Q: 1.8 };
    case "cafe":
      return { type: "bandpass", frequency: 500, Q: 0.3 };
    case "night":
      return { type: "bandpass", frequency: 3000, Q: 0.3 };
    case "train":
      return { type: "lowpass", frequency: 500, Q: 0.8 };
    case "stream":
      return { type: "highpass", frequency: 1500, Q: 0.4 };
    case "fan":
      return { type: "lowpass", frequency: 1000, Q: 0.3 };
    case "waterfall":
      return { type: "bandpass", frequency: 400, Q: 1.2 };
    case "leaves":
      return { type: "bandpass", frequency: 4500, Q: 0.5 };
    case "crickets":
      return { type: "highpass", frequency: 3000, Q: 0.6 };
    case "campfire":
      return { type: "bandpass", frequency: 800, Q: 0.4 };
    case "embers":
      return { type: "lowpass", frequency: 2200, Q: 0.5 };
    case "hearth":
      return { type: "highpass", frequency: 800, Q: 0.7 };
    case "plant_bass":
      return { type: "lowpass", frequency: 300, Q: 1.5 };
    case "library":
      return { type: "lowpass", frequency: 600, Q: 0.8 };
    case "binaural":
      return { type: "bandpass", frequency: 200, Q: 2.0 };
    case "bowl":
      return { type: "bandpass", frequency: 440, Q: 8.0 };
    case "faith":
      return { type: "bandpass", frequency: 520, Q: 0.6 };
    case "snow":
      return { type: "bandpass", frequency: 2200, Q: 0.35 };
    case "neuroharmony":
      return { type: "lowpass", frequency: 250, Q: 0.6 };
    case "calm":
      return { type: "lowpass", frequency: 320, Q: 0.6 };
    case "_base_background":
      return { type: "lowpass", frequency: 1200, Q: 0.4 };
    default:
      return { type: "lowpass", frequency: 1000, Q: 0.5 };
  }
}

// Update Media Session metadata for lock screen / notification controls
function updateMediaSession(isPlaying, soundNames = []) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: soundNames.length > 0 ? soundNames.join(" · ") : "FloraSonics",
    artist: "FloraSonics",
    album: "Nature Soundscape",
    artwork: [
      { src: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=512&h=512&fit=crop", sizes: "512x512", type: "image/jpeg" },
    ],
  });

  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

export default function useAudioEngine() {
  const nodesRef = useRef({});
  const masterGainRef = useRef(null);
  const masterEffectsRef = useRef(null);
  const isMutedRef = useRef(false);
  const masterVolumeRef = useRef(80);
  const activeSoundNamesRef = useRef([]);
  const generationAbortRef = useRef({}); // Map of soundId -> AbortController

  const createReverbImpulse = useCallback((ctx, duration = 2, decay = 2) => {
    const length = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }, []);

  const getMasterEffects = useCallback((ctx = null) => {
    if (!ctx) ctx = getAudioContext();
    // If cached nodes belong to a different (closed/replaced) context, reset them
    if (masterEffectsRef.current && masterEffectsRef.current.input.context !== ctx) {
      masterEffectsRef.current = null;
      masterGainRef.current = null;
    }
    if (!masterEffectsRef.current) {
      
      const reverb = ctx.createConvolver();
      reverb.buffer = createReverbImpulse(ctx);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0;

      const delay = ctx.createDelay(5);
      delay.delayTime.value = 0.3;
      const delayGain = ctx.createGain();
      delayGain.gain.value = 0;
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.3;

      const eq = {
        low: ctx.createBiquadFilter(),
        mid: ctx.createBiquadFilter(),
        high: ctx.createBiquadFilter(),
      };
      eq.low.type = "lowshelf";
      eq.low.frequency.value = 200;
      eq.low.gain.value = 0;
      eq.mid.type = "peaking";
      eq.mid.frequency.value = 1000;
      eq.mid.Q.value = 1;
      eq.mid.gain.value = 0;
      eq.high.type = "highshelf";
      eq.high.frequency.value = 3000;
      eq.high.gain.value = 0;

      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      
      masterEffectsRef.current = {
        reverb,
        reverbGain,
        delay,
        delayGain,
        delayFeedback,
        eq,
        input: ctx.createGain(),
        output: ctx.createGain(),
      };

      const { input, output, eq: eqNodes } = masterEffectsRef.current;
      
      input.connect(eqNodes.low);
      eqNodes.low.connect(eqNodes.mid);
      eqNodes.mid.connect(eqNodes.high);
      
      eqNodes.high.connect(output);
      
      eqNodes.high.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(output);
      
      eqNodes.high.connect(delayGain);
      delayGain.connect(delay);
      delay.connect(output);
    }
    return masterEffectsRef.current;
  }, [createReverbImpulse]);

  const getMasterGain = useCallback((ctx = null) => {
    if (!ctx) ctx = getAudioContext();
    // masterEffectsRef reset is handled inside getMasterEffects; masterGainRef is reset there too
    const masterEffects = getMasterEffects(ctx);
    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = isMutedRef.current ? 0 : masterVolumeRef.current / 100;
      masterEffects.output.connect(masterGainRef.current);
      masterGainRef.current.connect(ctx.destination);
    }
    return masterGainRef.current;
  }, [getMasterEffects]);

  const startSound = useCallback(
    (soundId, volume = 70, crossfadeDuration = 0.8) => {
      const ctx = getAudioContext();
      // If the context was replaced, stale nodes from old context must be cleared
      const firstNode = Object.values(nodesRef.current)[0];
      if (firstNode && firstNode.gain.context !== ctx) {
        nodesRef.current = {};
        activeSoundNamesRef.current = [];
        generationAbortRef.current = {};
      }
      const masterEffects = getMasterEffects(ctx);
      getMasterGain(ctx);

      // Cancel any existing buffer generation for this sound
      if (generationAbortRef.current[soundId]) {
        generationAbortRef.current[soundId].abort();
      }

      if (nodesRef.current[soundId]) {
        const existingNode = nodesRef.current[soundId];
        existingNode.gain.gain.cancelScheduledValues(ctx.currentTime);
        existingNode.gain.gain.setValueAtTime(existingNode.gain.gain.value, ctx.currentTime);
        existingNode.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + crossfadeDuration);
        delete nodesRef.current[soundId];
        setTimeout(() => {
          try {
            existingNode.source.stop();
            existingNode.source.disconnect();
            existingNode.filter.disconnect();
            existingNode.gain.disconnect();
            existingNode.reverb?.disconnect();
            existingNode.reverbGain?.disconnect();
            existingNode.delayNode?.disconnect();
            existingNode.delayGain?.disconnect();
          } catch (e) {}
        }, crossfadeDuration * 1000 + 100);
      }

      const noiseType =
        soundId === "rain" ? "rain"
        : soundId === "ocean" ? "ocean"
        : soundId === "waterfall" ? "drip"
        : soundId === "train" ? "train"
        : soundId === "night" ? "night"
        : soundId === "faith" ? "faith"
        : soundId === "birds" ? "birds"
        : soundId === "fire" ? "fire"
        : soundId === "campfire" ? "fire"
        : soundId === "embers" ? "embers"
        : soundId === "hearth" ? "hearth"
        : soundId === "plant_bass" ? "plant_bass"
        : soundId === "snow" ? "snow"
        : soundId === "neuroharmony" ? "neuroharmony"
        : soundId === "cafe" ? "cafe"
        : soundId === "library" ? "library"
        : soundId === "calm" ? "plane"
        : soundId === "fan" ? "fan"
        : soundId === "thunder" ? "thunder_roar"
        : soundId === "leaves" ? "leaves"
        : soundId === "stream" ? "pink"
        : "white";

      // Create abort controller for this generation
      const abortController = new AbortController();
      generationAbortRef.current[soundId] = abortController;

      // Generate buffer off main thread via WorkerPool with cancellation
      createNoiseBufferAsync(ctx, noiseType, soundId, abortController.signal).then((buffer) => {
        // Clean up abort controller reference
        delete generationAbortRef.current[soundId];
        
        // If cancelled, don't proceed
        if (!buffer) return;
        
        // Re-fetch context in case it changed during async generation
        const currentCtx = getAudioContext();
        const currentEffects = getMasterEffects(currentCtx);
        getMasterGain(currentCtx);

      const source = currentCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = currentCtx.createBiquadFilter();
      const filterSettings = getFilterSettings(soundId);
      filter.type = filterSettings.type;
      filter.frequency.value = filterSettings.frequency;
      filter.Q.value = filterSettings.Q;

      const reverb = currentCtx.createConvolver();
      reverb.buffer = createReverbImpulse(currentCtx, 1.5, 2);
      const reverbGain = currentCtx.createGain();
      reverbGain.gain.value = 0;

      const delayNode = currentCtx.createDelay(2);
      delayNode.delayTime.value = 0.2;
      const delayGain = currentCtx.createGain();
      delayGain.gain.value = 0;

      const gain = currentCtx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(volume / 100, currentCtx.currentTime + crossfadeDuration);

      source.connect(filter);
      filter.connect(gain);

      gain.connect(currentEffects.input);
      gain.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(currentEffects.input);
      gain.connect(delayGain);
      delayGain.connect(delayNode);
      delayNode.connect(currentEffects.input);

      source.start();

      nodesRef.current[soundId] = {
        source,
        gain,
        filter,
        reverb,
        reverbGain,
        delayNode,
        delayGain,
      };

      if (!activeSoundNamesRef.current.includes(soundId)) {
        activeSoundNamesRef.current = [...activeSoundNamesRef.current, soundId];
      }
      updateMediaSession(true, activeSoundNamesRef.current);
      }); // end createNoiseBufferAsync.then
    },
    [getMasterGain, getMasterEffects, createReverbImpulse]
  );

  const stopSound = useCallback((soundId, crossfadeDuration = 0.5) => {
    // Cancel any pending buffer generation for this sound
    if (generationAbortRef.current[soundId]) {
      generationAbortRef.current[soundId].abort();
      delete generationAbortRef.current[soundId];
    }

    const node = nodesRef.current[soundId];
    if (node) {
      const ctx = getAudioContext();
      // Remove from ref immediately so nothing can reference it again
      delete nodesRef.current[soundId];
      activeSoundNamesRef.current = activeSoundNamesRef.current.filter(id => id !== soundId);

      // Fade out then hard-stop
      node.gain.gain.cancelScheduledValues(ctx.currentTime);
      node.gain.gain.setValueAtTime(node.gain.gain.value, ctx.currentTime);
      node.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + crossfadeDuration);
      setTimeout(() => {
        try {
          node.source.stop();
          node.source.disconnect();
          node.filter.disconnect();
          node.gain.disconnect();
          node.reverb?.disconnect();
          node.reverbGain?.disconnect();
          node.delayNode?.disconnect();
          node.delayGain?.disconnect();
        } catch (e) {
          // Already stopped
        }
      }, crossfadeDuration * 1000 + 50);

      updateMediaSession(Object.keys(nodesRef.current).length > 0, activeSoundNamesRef.current);
    }
  }, []);

  const setVolume = useCallback((soundId, volume) => {
    const node = nodesRef.current[soundId];
    if (node) {
      const ctx = getAudioContext();
      node.gain.gain.linearRampToValueAtTime(volume / 100, ctx.currentTime + 0.1);
    }
  }, []);

  const setMasterVolume = useCallback(
    (volume) => {
      masterVolumeRef.current = volume;
      const masterGain = getMasterGain();
      const ctx = getAudioContext();
      masterGain.gain.linearRampToValueAtTime(volume / 100, ctx.currentTime + 0.1);
    },
    [getMasterGain]
  );

  const setMuted = useCallback(
    (muted) => {
      isMutedRef.current = muted;
      const masterGain = getMasterGain();
      const ctx = getAudioContext();
      masterGain.gain.linearRampToValueAtTime(
        muted ? 0 : masterVolumeRef.current / 100,
        ctx.currentTime + 0.15
      );
      updateMediaSession(!muted && Object.keys(nodesRef.current).length > 0, activeSoundNamesRef.current);
    },
    [getMasterGain]
  );

  const setSoundEffect = useCallback((soundId, effect, value) => {
    const node = nodesRef.current[soundId];
    if (!node) return;

    const ctx = getAudioContext();
    if (effect === "reverb" && node.reverbGain) {
      node.reverbGain.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
    } else if (effect === "delay" && node.delayGain) {
      node.delayGain.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
    }
  }, []);

  const setMasterEffect = useCallback((effect, value) => {
    const ctx = getAudioContext();
    const masterEffects = getMasterEffects(ctx);

    if (effect === "reverb") {
      masterEffects.reverbGain.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
    } else if (effect === "delay") {
      masterEffects.delayGain.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
    } else if (effect === "eq_low") {
      masterEffects.eq.low.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
    } else if (effect === "eq_mid") {
      masterEffects.eq.mid.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
    } else if (effect === "eq_high") {
      masterEffects.eq.high.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
    }
  }, [getMasterEffects]);

  const stopAll = useCallback(() => {
    // Cancel all pending generations
    Object.keys(generationAbortRef.current).forEach((soundId) => {
      generationAbortRef.current[soundId].abort();
    });
    generationAbortRef.current = {};
    
    Object.keys(nodesRef.current).forEach((id) => stopSound(id));
    activeSoundNamesRef.current = [];
    updateMediaSession(false, []);
  }, [stopSound]);

  // Register Media Session action handlers so lock screen controls work
  const registerMediaSessionHandlers = useCallback((onPlay, onPause) => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", onPlay);
    navigator.mediaSession.setActionHandler("pause", onPause);
    navigator.mediaSession.setActionHandler("stop", onPause);
  }, []);

  useEffect(() => {
    return () => {
      // Cancel all pending buffer generations
      Object.keys(generationAbortRef.current).forEach((soundId) => {
        try {
          generationAbortRef.current[soundId].abort();
        } catch (e) {}
      });
      generationAbortRef.current = {};

      // Stop all active sources
      Object.keys(nodesRef.current).forEach((id) => {
        try {
          nodesRef.current[id].source.stop();
          nodesRef.current[id].source.disconnect();
          nodesRef.current[id].filter.disconnect();
          nodesRef.current[id].gain.disconnect();
          nodesRef.current[id].reverb?.disconnect();
          nodesRef.current[id].reverbGain?.disconnect();
          nodesRef.current[id].delayNode?.disconnect();
          nodesRef.current[id].delayGain?.disconnect();
        } catch (e) {}
      });
      nodesRef.current = {};

      // Note: Worker pool is intentionally NOT terminated here
      // to persist across component lifecycle and reuse across components
    };
  }, []);

  return {
    startSound,
    stopSound,
    setVolume,
    setMasterVolume,
    setMuted,
    setSoundEffect,
    setMasterEffect,
    stopAll,
    registerMediaSessionHandlers,
  };
}