// Web Worker: generates audio buffer data off the main thread
// Returns Float32Array data for both channels
// Supports AbortController for task cancellation
// Works with WorkerPool for persistent reuse

const activeTasks = new Map();

self.onmessage = function(e) {
  const { command, taskId, type, sampleRate, durationSec } = e.data;
  
  // Handle cancel command
  if (command === 'cancel') {
    const abortController = activeTasks.get(taskId);
    if (abortController) {
      abortController.abort();
      activeTasks.delete(taskId);
    }
    return;
  }

  // Handle generate command
  if (command !== 'generate') return;
  
  // Create new abort controller for this task
  const abortController = new AbortController();
  activeTasks.set(taskId, abortController);
  
  const duration = durationSec ?? (type === "embers" ? 8 : 4);
  const length = sampleRate * duration;

  const ch0 = new Float32Array(length);
  const ch1 = new Float32Array(length);

  try {
    for (let channel = 0; channel < 2; channel++) {
      const data = channel === 0 ? ch0 : ch1;

    if (type === "rain") {
       for (let i = 0; i < length; i++) {
         // Periodic abort check (every 22050 samples ~500ms at 44.1kHz)
         if (i % 22050 === 0 && abortController.signal.aborted) {
           throw new Error('Synthesis cancelled');
         }
         if (Math.random() < 0.12) {
           const decayFrames = sampleRate * 0.08;
           const pos = i % decayFrames;
           data[i] = (Math.random() * 2 - 1) * Math.exp(-4 * pos / decayFrames);
         } else {
           data[i] *= 0.3;
         }
       }
     } else if (type === "ocean") {
      for (let i = 0; i < length; i++) {
        const waveFreq = 0.4 + 0.3 * Math.sin(i / (sampleRate * 2));
        const baseSine = Math.sin((i / sampleRate) * Math.PI * waveFreq * 2);
        const noise = Math.random() * 2 - 1;
        data[i] = baseSine * 0.5 + noise * 0.5;
      }
    } else if (type === "train") {
      for (let i = 0; i < length; i++) {
        const beatFreq = i / (sampleRate * 1.5);
        const beat = Math.sin(beatFreq * Math.PI * 2) * 0.4;
        const rumble = Math.sin((i / sampleRate) * Math.PI * 0.3) * 0.3;
        const noise = Math.random() * 2 - 1;
        data[i] = beat + rumble + noise * 0.3;
      }
    } else if (type === "birds") {
      for (let i = 0; i < length; i++) {
        const chirpFreq = 2 + Math.sin(i / (sampleRate * 0.5)) * 1.5;
        let sample = 0;
        if (Math.random() < 0.08) {
          const decayFrames = sampleRate * 0.15;
          const pos = i % decayFrames;
          sample = Math.sin((i / sampleRate) * Math.PI * chirpFreq * 2) * Math.exp(-3 * pos / decayFrames);
        }
        data[i] = sample * 0.6 + (Math.random() * 2 - 1) * 0.15;
      }
    } else if (type === "embers") {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        const root = Math.sin(t * Math.PI * 2 * 55) * 0.40;
        const h2 = Math.sin(t * Math.PI * 2 * 110) * 0.22;
        const h3 = Math.sin(t * Math.PI * 2 * 165) * 0.12;
        const h4 = Math.sin(t * Math.PI * 2 * 220) * 0.06;
        const bassBreath = 0.65 + 0.35 * Math.sin(t * Math.PI * 2 / 5.5);
        const plantBass = (root + h2 + h3 + h4) * bassBreath;
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.990 * b1 + white * 0.020;
        b2 = 0.978 * b2 + white * 0.035;
        const coldWind = (b0 + b1 + b2) * 0.5;
        const gustSwell = 0.25 + 0.75 * Math.abs(Math.sin(t * Math.PI * 2 / 9.0));
        let crackle = 0;
        if (Math.random() < 0.055) {
          const decayFrames = sampleRate * 0.012;
          const pos = i % decayFrames;
          crackle = (Math.random() * 2 - 1) * Math.exp(-15 * pos / decayFrames) * (0.7 + Math.random() * 0.5);
        }
        let drip = 0;
        if (Math.random() < 0.005) {
          const decayFrames = sampleRate * 0.20;
          const pos = i % decayFrames;
          const dripFreq = 400 + Math.random() * 300;
          drip = Math.sin((i / sampleRate) * Math.PI * 2 * dripFreq) * Math.exp(-6 * pos / decayFrames) * (0.65 + Math.random() * 0.35);
        }
        let groan = 0;
        if (Math.random() < 0.0015) {
          const decayFrames = sampleRate * 0.35;
          const pos = i % decayFrames;
          groan = Math.sin((i / sampleRate) * Math.PI * 2 * 65) * Math.exp(-4 * pos / decayFrames) * 0.80;
        }
        let snap = 0;
        if (Math.random() < 0.003) {
          const decayFrames = sampleRate * 0.035;
          const pos = i % decayFrames;
          snap = (Math.random() * 2 - 1) * Math.exp(-25 * pos / decayFrames) * 0.95;
        }
        const caveHum = Math.sin(t * Math.PI * 2 * 38) * 0.12 * (0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 2 / 7.2)));
        data[i] = (plantBass * 0.48 + coldWind * gustSwell * 0.14 + crackle + drip + groan + snap + caveHum) * 0.88;
      }
    } else if (type === "hearth") {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.990 * b1 + white * 0.020;
        b2 = 0.978 * b2 + white * 0.035;
        const coldWind = (b0 + b1 + b2) * 0.85;
        const gust = 0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI * 2 / 8.0));
        let crackle = 0;
        if (Math.random() < 0.022) {
          const decayFrames = sampleRate * 0.018;
          const pos = i % decayFrames;
          crackle = (Math.random() * 2 - 1) * Math.exp(-9 * pos / decayFrames) * (0.7 + Math.random() * 0.5);
        }
        let groan = 0;
        if (Math.random() < 0.0003) {
          const decayFrames = sampleRate * 0.25;
          const pos = i % decayFrames;
          groan = Math.sin((i / sampleRate) * Math.PI * 2 * 80) * Math.exp(-6 * pos / decayFrames) * 0.6;
        }
        let chime = 0;
        if (Math.random() < 0.0004) {
          const decayFrames = sampleRate * 2.0;
          const pos = i % decayFrames;
          const chimeFreqs = [1568, 2093, 2637, 3136];
          const cf = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
          chime = Math.sin(t * Math.PI * 2 * cf) * Math.exp(-3.5 * pos / decayFrames) * 0.35;
        }
        data[i] = (coldWind * gust * 0.35 + crackle + groan + chime) * 0.82;
      }
    } else if (type === "plant_bass") {
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
      let lastOut = 0;
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.04 * white) / 1.04;
        let crackle = 0;
        if (Math.random() < 0.20) {
          const intensity = Math.random();
          crackle = (Math.random() * 2 - 1) * (0.6 + intensity * 0.35);
        }
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.988 * b1 + white * 0.022;
        b2 = 0.972 * b2 + white * 0.040;
        const windNoise = (b0 + b1 + b2) * 0.7;
        const gustSwell = 0.2 + 0.8 * Math.abs(Math.sin(t * Math.PI * 2 / 9.5));
        const wind = windNoise * gustSwell * 0.45;
        let snap = 0;
        if (Math.random() < 0.0003) {
          const decayFrames = sampleRate * 0.04;
          const pos = i % decayFrames;
          snap = (Math.random() * 2 - 1) * Math.exp(-25 * pos / decayFrames) * 0.8;
        }
        const nightHum = Math.sin(t * Math.PI * 2 * 3200) * 0.012 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 4.1));
        data[i] = (lastOut * 2.5 + crackle + wind + snap + nightHum) * 0.62;
      }
    } else if (type === "night") {
      let lastVal = 0;
      for (let i = 0; i < length; i++) {
        const windModulation = 0.5 + 0.5 * Math.sin(i / (sampleRate * 2.5));
        let sample = 0;
        if (Math.random() < 0.06) {
          sample = Math.sin((i / sampleRate) * Math.PI * 4) * 0.5;
        }
        const noise = Math.random() * 2 - 1;
        lastVal = lastVal * 0.9 + noise * windModulation * 0.1;
        data[i] = sample + lastVal * 0.4;
      }
    } else if (type === "faith") {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const root = Math.sin(t * Math.PI * 2 * 220) * 0.28;
        const fifth = Math.sin(t * Math.PI * 2 * 330) * 0.20;
        const octave = Math.sin(t * Math.PI * 2 * 440) * 0.14;
        const third = Math.sin(t * Math.PI * 2 * 528) * 0.10;
        const high = Math.sin(t * Math.PI * 2 * 660) * 0.06;
        const breathSlow = 0.55 + 0.45 * Math.sin(t * Math.PI * 2 / 7.5);
        const breathFast = 0.85 + 0.15 * Math.sin(t * Math.PI * 2 / 2.1);
        let bell = 0;
        if (Math.random() < 0.0004) {
          const decayFrames = sampleRate * 2.2;
          const pos = i % decayFrames;
          const bellFreq = [528, 660, 792, 880][Math.floor(Math.random() * 4)];
          bell = Math.sin((i / sampleRate) * Math.PI * 2 * bellFreq) * Math.exp(-3 * pos / decayFrames) * 0.45;
        }
        const breathNoise = (Math.random() * 2 - 1) * 0.035;
        const choir = (root + fifth + octave + third + high) * breathSlow * breathFast;
        data[i] = (choir + bell + breathNoise) * 0.78;
      }
    } else if (type === "snow") {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.998 * b0 + white * 0.012;
        b1 = 0.991 * b1 + white * 0.022;
        b2 = 0.975 * b2 + white * 0.038;
        const windBase = (b0 + b1 + b2) * 0.9;
        const gustSlow = 0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 2 / 11.0));
        const gustFast = 0.7 + 0.3 * Math.sin(t * Math.PI * 2 / 3.3);
        let chime = 0;
        if (Math.random() < 0.0005) {
          const decayFrames = sampleRate * 1.8;
          const pos = i % decayFrames;
          const chimeFreqs = [1047, 1319, 1568, 2093];
          const cf = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
          chime = Math.sin(t * Math.PI * 2 * cf) * Math.exp(-4 * pos / decayFrames) * 0.3;
        }
        let crunch = 0;
        if (Math.random() < 0.0001) {
          crunch = (Math.random() * 2 - 1) * 0.25;
        }
        data[i] = (windBase * gustSlow * gustFast * 0.55 + chime + crunch) * 0.7;
      }
    } else if (type === "neuroharmony") {
      let b0 = 0, b1 = 0, b2 = 0;
      const bpm = 65;
      const beatInterval = sampleRate * (60 / bpm);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.995 * b0 + white * 0.016;
        b1 = 0.989 * b1 + white * 0.028;
        b2 = 0.970 * b2 + white * 0.055;
        const pinkBase = (b0 + b1 + b2) * 0.95;
        const harmonic1 = Math.sin(t * Math.PI * 2 * 40) * 0.10;
        const harmonic2 = Math.sin(t * Math.PI * 2 * 88) * 0.07;
        const harmonic3 = Math.sin(t * Math.PI * 2 * 136) * 0.05;
        const harmonic4 = Math.sin(t * Math.PI * 2 * 52) * 0.06 * (0.7 + 0.3 * Math.sin(t * Math.PI * 2 / 8.0));
        const ambientSwell = Math.sin(t * Math.PI * 2 * 18) * 0.08 * (0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 2 / 6.5)));
        const breathEnv = 0.50 + 0.50 * Math.sin(t * Math.PI * 2 / 12.0);
        const posInBeat = i % beatInterval;
        const lub = posInBeat < sampleRate * 0.08 ? Math.sin((posInBeat / sampleRate) * Math.PI * 2 * 55) * Math.exp(-10 * posInBeat / (sampleRate * 0.08)) * 0.95 : 0;
        const dubOffset = sampleRate * 0.14;
        const dubPos = posInBeat - dubOffset;
        const dub = dubPos > 0 && dubPos < sampleRate * 0.07 ? Math.sin((dubPos / sampleRate) * Math.PI * 2 * 65) * Math.exp(-11 * dubPos / (sampleRate * 0.07)) * 0.70 : 0;
        const subThud = posInBeat < sampleRate * 0.05 ? Math.sin((posInBeat / sampleRate) * Math.PI * 2 * 30) * Math.exp(-8 * posInBeat / (sampleRate * 0.05)) * 0.50 : 0;
        const heartbeat = (lub + dub + subThud);
        data[i] = ((pinkBase * 0.30 + (harmonic1 + harmonic2 + harmonic3 + harmonic4) * 0.20 + ambientSwell) * breathEnv + heartbeat) * 0.88;
      }
    } else if (type === "drip") {
      let i = 0;
      while (i < length) {
        const gap = Math.floor(sampleRate * (0.3 + Math.random() * 2.2));
        i += gap;
        if (i >= length) break;
        const dropFreq = 120 + Math.random() * 280;
        const dropAmp = 0.4 + Math.random() * 0.5;
        const dropDecay = sampleRate * (0.04 + Math.random() * 0.08);
        for (let j = 0; j < dropDecay && i + j < length; j++) {
          const env = Math.exp(-6 * j / dropDecay);
          const tone = Math.sin((j / sampleRate) * Math.PI * 2 * dropFreq);
          const click = j < 5 ? (Math.random() * 2 - 1) * 0.3 : 0;
          data[i + j] += (tone * env * dropAmp + click) * 0.7;
        }
        const echoOffset = Math.floor(sampleRate * 0.08);
        const echoDecay = sampleRate * 0.04;
        for (let j = 0; j < echoDecay && i + echoOffset + j < length; j++) {
          const env = Math.exp(-8 * j / echoDecay);
          const tone = Math.sin((j / sampleRate) * Math.PI * 2 * dropFreq * 0.95);
          data[i + echoOffset + j] += tone * env * dropAmp * 0.2;
        }
      }
      let b0 = 0, b1 = 0;
      for (let k = 0; k < length; k++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.992 * b0 + w * 0.025;
        b1 = 0.975 * b1 + w * 0.045;
        data[k] += (b0 + b1) * 0.08;
      }
    } else if (type === "leaves") {
      let b0 = 0, b1 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.990 * b0 + white * 0.030;
        b1 = 0.970 * b1 + white * 0.060;
        const rustleBase = (b0 + b1) * 0.6;
        let tap = 0;
        if (Math.random() < 0.18) {
          const decayFrames = sampleRate * 0.025;
          const pos = i % decayFrames;
          const tapFreq = 3000 + Math.random() * 3000;
          tap = Math.sin((i / sampleRate) * Math.PI * 2 * tapFreq) * Math.exp(-10 * pos / decayFrames) * (0.3 + Math.random() * 0.4);
        }
        let burst = 0;
        if (Math.random() < 0.003) {
          const decayFrames = sampleRate * 0.12;
          const pos = i % decayFrames;
          burst = (Math.random() * 2 - 1) * Math.exp(-5 * pos / decayFrames) * 0.5;
        }
        const windSwell = 0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI * 2 / 6.0));
        data[i] = (rustleBase * windSwell * 0.4 + tap + burst) * 0.72;
      }
    } else if (type === "thunder_roar") {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.025 * white) / 1.025;
        const rumble = Math.sin(t * Math.PI * 2 * 22) * 0.55;
        const subRumble = Math.sin(t * Math.PI * 2 * 14) * 0.45;
        const midRumble = Math.sin(t * Math.PI * 2 * 48) * 0.25;
        const highRumble = Math.sin(t * Math.PI * 2 * 80) * 0.15;
        const roarSwell = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 2 / 3.2));
        const boomInterval = sampleRate * 4.0;
        const posInBoom = i % boomInterval;
        const boomEnv = posInBoom < sampleRate * 2.5 ? Math.exp(-1.2 * posInBoom / (sampleRate * 2.5)) * (0.8 + Math.random() * 0.2) : 0;
        const crack = posInBoom < sampleRate * 0.04 ? (Math.random() * 2 - 1) * Math.exp(-18 * posInBoom / (sampleRate * 0.04)) * 1.2 : 0;
        data[i] = ((lastOut * 4.5 + (rumble + subRumble + midRumble + highRumble) * roarSwell) * (0.5 + boomEnv * 0.5) + crack) * 0.82;
      }
    } else if (type === "cafe") {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.994 * b0 + white * 0.018;
        b1 = 0.986 * b1 + white * 0.032;
        b2 = 0.960 * b2 + white * 0.058;
        const roomNoise = (b0 + b1 + b2) * 0.7;
        const voice1 = Math.sin(t * Math.PI * 2 * 180) * 0.06 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.7));
        const voice2 = Math.sin(t * Math.PI * 2 * 240) * 0.05 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 2.3 + 1.1));
        const voice3 = Math.sin(t * Math.PI * 2 * 310) * 0.04 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.4 + 2.5));
        const voice4 = Math.sin(t * Math.PI * 2 * 420) * 0.035 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 3.1 + 0.7));
        const chatterNoise = (Math.random() * 2 - 1) * 0.12 * (0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI * 2 / 0.35)));
        const murmur = voice1 + voice2 + voice3 + voice4 + chatterNoise;
        let clink = 0;
        if (Math.random() < 0.00015) {
          const decayFrames = sampleRate * 0.12;
          const pos = i % decayFrames;
          const clinkFreq = 2200 + Math.random() * 1800;
          clink = Math.sin((i / sampleRate) * Math.PI * 2 * clinkFreq) * Math.exp(-12 * pos / decayFrames) * (0.35 + Math.random() * 0.25);
        }
        let hiss = 0;
        if (Math.random() < 0.00005) {
          const decayFrames = sampleRate * 0.6;
          const pos = i % decayFrames;
          hiss = (Math.random() * 2 - 1) * Math.exp(-4 * pos / decayFrames) * 0.3;
        }
        data[i] = (roomNoise * 0.35 + murmur * 1.2 + clink + hiss) * 0.75;
      }
    } else if (type === "library") {
      let b0 = 0, b1 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.010;
        b1 = 0.985 * b1 + white * 0.020;
        const hush = (b0 + b1) * 0.25;
        let stomp = 0;
        if (Math.random() < 0.00012) {
          const decayFrames = sampleRate * 0.22;
          const pos = i % decayFrames;
          const thudFreq = 60 + Math.random() * 80;
          stomp = Math.sin((i / sampleRate) * Math.PI * 2 * thudFreq) * Math.exp(-8 * pos / decayFrames) * (0.7 + Math.random() * 0.4);
          stomp += (Math.random() * 2 - 1) * Math.exp(-20 * pos / decayFrames) * 0.5;
        }
        let softThud = 0;
        if (Math.random() < 0.00025) {
          const decayFrames = sampleRate * 0.10;
          const pos = i % decayFrames;
          const thudFreq = 120 + Math.random() * 100;
          softThud = Math.sin((i / sampleRate) * Math.PI * 2 * thudFreq) * Math.exp(-15 * pos / decayFrames) * (0.4 + Math.random() * 0.3);
        }
        let rustle = 0;
        if (Math.random() < 0.0003) {
          const decayFrames = sampleRate * 0.08;
          const pos = i % decayFrames;
          rustle = (Math.random() * 2 - 1) * Math.exp(-8 * pos / decayFrames) * 0.25;
        }
        data[i] = (hush + stomp + softThud + rustle) * 0.8;
      }
    } else if (type === "plane") {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.996 * b0 + white * 0.014;
        b1 = 0.988 * b1 + white * 0.026;
        b2 = 0.970 * b2 + white * 0.048;
        const engineNoise = (b0 + b1 + b2) * 0.9;
        const eng1 = Math.sin(t * Math.PI * 2 * 95) * 0.22;
        const eng2 = Math.sin(t * Math.PI * 2 * 190) * 0.12;
        const eng3 = Math.sin(t * Math.PI * 2 * 285) * 0.06;
        const pressureSwell = 0.7 + 0.3 * Math.sin(t * Math.PI * 2 / 9.0);
        let turb = 0;
        if (Math.random() < 0.00008) {
          const decayFrames = sampleRate * 0.4;
          const pos = i % decayFrames;
          turb = (Math.random() * 2 - 1) * Math.exp(-5 * pos / decayFrames) * 0.35;
        }
        data[i] = ((engineNoise * 0.5 + (eng1 + eng2 + eng3)) * pressureSwell + turb) * 0.78;
      }
    } else if (type === "fan") {
      let b0 = 0, b1 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        b0 = 0.992 * b0 + white * 0.022;
        b1 = 0.978 * b1 + white * 0.042;
        const fanNoise = (b0 + b1) * 0.6;
        const whistleFreq = 800 + 40 * Math.sin(t * Math.PI * 2 / 2.3);
        const whistle = Math.sin(t * Math.PI * 2 * whistleFreq) * 0.12 * (0.6 + 0.4 * Math.sin(t * Math.PI * 2 / 5.7));
        const whistle2 = Math.sin(t * Math.PI * 2 * (whistleFreq * 1.5)) * 0.06 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 3.1 + 1.2));
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
      // Brown noise fallback
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }
  } catch (error) {
    // Synthesis was aborted or errored
    activeTasks.delete(taskId);
    self.postMessage({
      taskId,
      success: false,
      error: error.message || 'Synthesis failed',
    });
    return;
  }

  // Final abort check before sending result
  const wasAborted = abortController.signal.aborted;
  activeTasks.delete(taskId);
  
  if (wasAborted) {
    self.postMessage({
      taskId,
      success: false,
      error: 'Task was cancelled',
    });
    return;
  }
  
  // Send result with transferable objects for zero-copy
  self.postMessage({
    taskId,
    success: true,
    result: { type, ch0, ch1 },
  }, [ch0.buffer, ch1.buffer]);
};