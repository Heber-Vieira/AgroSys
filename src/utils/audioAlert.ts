// Web Audio API Synthesizer for Operator Weather Alerts (Zero external assets needed)

let audioCtx: AudioContext | null = null;
let activeOscillators: { osc: OscillatorNode; gain: GainNode; intervalId?: number }[] = [];

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSingleBeep(frequency = 880, duration = 0.2, volume = 0.5) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    // Exponential decay
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Failed to play audio alert:', error);
  }
}

export function startSirenAlert(volume = 0.5) {
  try {
    stopAllAlerts();
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume * 0.4, ctx.currentTime); // keep sawtooth slightly quieter

    osc.start();

    // Frequency sweep effect (siren oscillation)
    let up = true;
    const intervalId = window.setInterval(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      if (up) {
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      } else {
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
      }
      up = !up;
    }, 500);

    activeOscillators.push({ osc, gain: gainNode, intervalId });
  } catch (error) {
    console.warn('Failed to start siren alert:', error);
  }
}

export function startPulseAlert(volume = 0.5) {
  try {
    stopAllAlerts();
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    
    osc.start();

    // Pulse volume effect
    let isMuted = false;
    const intervalId = window.setInterval(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      gainNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.3, now);
      isMuted = !isMuted;
    }, 250);

    activeOscillators.push({ osc, gain: gainNode, intervalId });
  } catch (error) {
    console.warn('Failed to start pulse alert:', error);
  }
}

export function startChimeAlert(volume = 0.5) {
  try {
    stopAllAlerts();
    const ctx = getAudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    osc1.start();
    osc2.start();

    // Periodic dual chime repeat
    let active = true;
    const intervalId = window.setInterval(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      if (active) {
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      }
      active = !active;
    }, 1200);

    activeOscillators.push({ osc: osc1, gain: gainNode, intervalId });
    // Also push second oscillator just in case so we can stop it
    activeOscillators.push({ osc: osc2, gain: gainNode });
  } catch (error) {
    console.warn('Failed to start chime alert:', error);
  }
}

export function stopAllAlerts() {
  activeOscillators.forEach(({ osc, gain, intervalId }) => {
    try {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    } catch (e) {
      // already stopped or disconnected
    }
  });
  activeOscillators = [];
}
