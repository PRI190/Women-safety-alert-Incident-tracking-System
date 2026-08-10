// Web Audio API Emergency Siren Synthesizer
let audioCtx: AudioContext | null = null;
let mainGain: GainNode | null = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;
let sirenInterval: any = null;
let isPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Starts an authentic high-decibel dual-tone police/ambulance siren sound
 */
export function startEmergencySiren(): boolean {
  if (isPlaying) return true;

  try {
    const ctx = getAudioContext();

    // Create Gain Node for volume control
    mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.7, ctx.currentTime);
    mainGain.connect(ctx.destination);

    // Primary High Frequency Oscillator (Emergency Siren Wail)
    osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(650, ctx.currentTime);
    osc1.connect(mainGain);
    osc1.start();

    // Secondary Harmonics Oscillator
    osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(950, ctx.currentTime);
    osc2.connect(mainGain);
    osc2.start();

    isPlaying = true;

    // Siren Pitch Modulation Effect (650Hz <-> 1250Hz frequency modulation every 800ms)
    let highPitch = false;
    sirenInterval = setInterval(() => {
      if (!isPlaying || !osc1 || !ctx) return;
      const targetFreq1 = highPitch ? 650 : 1200;
      const targetFreq2 = highPitch ? 900 : 1450;
      highPitch = !highPitch;

      osc1.frequency.exponentialRampToValueAtTime(targetFreq1, ctx.currentTime + 0.35);
      if (osc2) {
        osc2.frequency.exponentialRampToValueAtTime(targetFreq2, ctx.currentTime + 0.35);
      }
    }, 450);

    return true;
  } catch (err) {
    console.error('Audio Context Error during Emergency Siren activation:', err);
    return false;
  }
}

/**
 * Stops the emergency siren immediately
 */
export function stopEmergencySiren(): void {
  isPlaying = false;

  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }

  try {
    if (mainGain && audioCtx) {
      mainGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    }
    setTimeout(() => {
      if (osc1) {
        try { osc1.stop(); osc1.disconnect(); } catch (e) {}
        osc1 = null;
      }
      if (osc2) {
        try { osc2.stop(); osc2.disconnect(); } catch (e) {}
        osc2 = null;
      }
      if (mainGain) {
        try { mainGain.disconnect(); } catch (e) {}
        mainGain = null;
      }
    }, 150);
  } catch (e) {
    console.error('Error stopping siren audio:', e);
  }
}

/**
 * Checks if the siren is currently playing
 */
export function isSirenPlaying(): boolean {
  return isPlaying;
}

/**
 * Plays a short alert test sound (for user audio test button)
 */
export function playTestBeep(): void {
  try {
    const ctx = getAudioContext();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 pitch
    osc.connect(g);

    osc.start();
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    setTimeout(() => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    }, 450);
  } catch (e) {
    console.error('Audio test beep error:', e);
  }
}
