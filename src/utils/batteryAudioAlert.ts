/**
 * Synthesizes acoustic alerts for drone battery health inspection reminders
 * using the Web Audio API. Safe for all modern browsers without external asset dependencies.
 */

export function playBatteryAlertSound(
  type: 'CHIME' | 'BEEP' | 'SIREN' | 'PULSE' = 'CHIME',
  volume: number = 0.7
): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Ensure context is running if suspended by browser autoplay policy
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'CHIME') {
      // Pleasant 3-note ascending chime (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        noteGain.gain.setValueAtTime(0, now + idx * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.5, now + idx * 0.12 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    } else if (type === 'BEEP') {
      // Double diagnostic beep
      [0, 0.18].forEach((timeOffset) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now + timeOffset);

        noteGain.gain.setValueAtTime(0, now + timeOffset);
        noteGain.gain.linearRampToValueAtTime(0.6, now + timeOffset + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.12);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.14);
      });
    } else if (type === 'SIREN') {
      // Pulsing frequency sweep (attention grabbing)
      const osc = ctx.createOscillator();
      const sirenGain = ctx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);
      osc.frequency.linearRampToValueAtTime(600, now + 0.3);
      osc.frequency.linearRampToValueAtTime(950, now + 0.45);

      sirenGain.gain.setValueAtTime(0.4, now);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(sirenGain);
      sirenGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'PULSE') {
      // Gentle triple pulse
      [0, 0.15, 0.3].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 + idx * 110, now + offset);

        noteGain.gain.setValueAtTime(0.4, now + offset);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    }
  } catch (err) {
    console.warn('Não foi possível tocar o alerta sonoro de bateria:', err);
  }
}
