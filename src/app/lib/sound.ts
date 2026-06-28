// ── Tiny Web Audio "synth" for UI sound effects ───────────────────────────────
// We generate every sound on the fly with oscillators instead of bundling audio
// files: zero assets, no licensing, works offline, and stays in tune with the
// playful Brilliant-style feel. The AudioContext is created lazily on the first
// sound (which always rides a user gesture, satisfying the autoplay policy) and
// a mute preference is persisted to localStorage.
//
// The chain is: voices → master gain → soft compressor → speakers, with a small
// parallel reverb send so chimes feel rounded and "produced" rather than beepy.

import { useEffect, useState } from "react";

export type SoundName =
  | 'tap'       // generic button press
  | 'select'    // picking/placing an option or card
  | 'pop'       // a connection lands / a row runs
  | 'whoosh'    // a request flies out
  | 'ding'      // a response arrives
  | 'correct'   // right answer
  | 'wrong'     // wrong answer
  | 'reveal'    // answer revealed after misses
  | 'complete'; // module finished / celebration

const STORAGE_KEY = 'atl-sound-muted';
const MASTER_VOLUME = 0.95; // overall loudness (was 0.5)

let ctx: AudioContext | null = null;
let master: GainNode | null = null;   // all dry voices connect here
let reverbIn: GainNode | null = null; // parallel reverb send
let muted = readMuted();
const listeners = new Set<(m: boolean) => void>();

function readMuted(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

// A short decaying-noise impulse response → a cheap, pleasant room reverb.
function makeImpulse(c: AudioContext): AudioBuffer {
  const dur = 0.5;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(2, frames, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2.6);
    }
  }
  return buf;
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;

    // Soft compressor: lets us push the level up without harsh clipping.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 26;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    master.connect(comp);
    comp.connect(ctx.destination);

    // Parallel reverb send for a rounded, polished tail.
    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(ctx);
    reverbIn = ctx.createGain();
    reverbIn.gain.value = 1;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    reverbIn.connect(convolver);
    convolver.connect(wet);
    wet.connect(comp);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  dur?: number;
  delay?: number;
  gain?: number;
  attack?: number;
  sweepTo?: number; // glide the pitch to this frequency over the note
  reverb?: number;  // 0..1 amount sent to the reverb bus
}

// Single-oscillator voice — good for plucks and pitch sweeps.
function tone(o: ToneOpts) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0  = c.currentTime + (o.delay ?? 0);
  const dur = o.dur ?? 0.15;
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.sweepTo), t0 + dur);
  const peak = o.gain ?? 0.3;
  const atk  = o.attack ?? 0.006;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  if (o.reverb && reverbIn) { const s = c.createGain(); s.gain.value = o.reverb; g.connect(s); s.connect(reverbIn); }
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

interface BellOpts {
  freq: number;
  dur?: number;
  delay?: number;
  gain?: number;
  type?: OscillatorType;
  partials?: number[]; // harmonic multipliers stacked for a bell/marimba timbre
  reverb?: number;
}

// Layered-harmonic voice — warm, bell-like, the workhorse for "nice" chimes.
const PARTIAL_GAINS = [1, 0.42, 0.2, 0.12];
function bell(o: BellOpts) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0  = c.currentTime + (o.delay ?? 0);
  const dur = o.dur ?? 0.4;
  const base = o.gain ?? 0.3;
  const partials = o.partials ?? [1, 2, 3];
  partials.forEach((mult, idx) => {
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq * mult, t0);
    const peak = base * (PARTIAL_GAINS[idx] ?? 0.1);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    if ((o.reverb ?? 0.25) && reverbIn) { const s = c.createGain(); s.gain.value = o.reverb ?? 0.25; g.connect(s); s.connect(reverbIn); }
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  });
}

// Short filtered-noise burst — used for the "whoosh" of a request leaving.
function noiseBurst(o: { dur?: number; delay?: number; gain?: number; from?: number; to?: number }) {
  const c = ensureCtx();
  if (!c || !master) return;
  const dur = o.dur ?? 0.18;
  const t0  = c.currentTime + (o.delay ?? 0);
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(o.from ?? 700, t0);
  filter.frequency.exponentialRampToValueAtTime(o.to ?? 2200, t0 + dur);
  filter.Q.value = 0.7;
  const g = c.createGain();
  const peak = o.gain ?? 0.12;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
}

// Note frequencies used by the chimes (equal temperament).
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.51, G6 = 1567.98;

const RECIPES: Record<SoundName, () => void> = {
  // Crisp pluck with a hint of body.
  tap:    () => tone({ freq: 400, type: 'triangle', dur: 0.07, gain: 0.34, sweepTo: 320, reverb: 0.06 }),
  // Soft wooden tick.
  select: () => bell({ freq: 600, dur: 0.18, gain: 0.34, partials: [1, 2], reverb: 0.2 }),
  // Bright upward blip.
  pop:    () => tone({ freq: 520, type: 'triangle', dur: 0.11, gain: 0.4, sweepTo: 960, reverb: 0.18 }),
  // Air moving — louder, sweeping up.
  whoosh: () => noiseBurst({ dur: 0.24, gain: 0.26, from: 480, to: 2800 }),
  // Friendly two-tone arrival.
  ding:   () => { bell({ freq: A5, dur: 0.5, gain: 0.38, partials: [1, 2, 3], reverb: 0.35 }); bell({ freq: E6, dur: 0.4, gain: 0.16, delay: 0.03, partials: [1, 2], reverb: 0.3 }); },
  // Rising major arpeggio C5–E5–G5 with a C6 sparkle on top.
  correct: () => {
    [C5, E5, G5].forEach((f, i) => bell({ freq: f, dur: 0.5, delay: i * 0.085, gain: 0.42, partials: [1, 2, 3], reverb: 0.32 }));
    bell({ freq: C6, dur: 0.62, delay: 0.26, gain: 0.26, partials: [1, 2], reverb: 0.4 });
  },
  // Gentle descending "aww" — clear but never harsh.
  wrong: () => {
    tone({ freq: 233, type: 'triangle', dur: 0.2,  gain: 0.4,  sweepTo: 175, reverb: 0.12 });
    tone({ freq: 175, type: 'triangle', dur: 0.28, gain: 0.32, sweepTo: 130, delay: 0.12, reverb: 0.12 });
  },
  // Two-note "here it is" lift (G4 → D5).
  reveal: () => [392, D5].forEach((f, i) => bell({ freq: f, dur: 0.36, delay: i * 0.1, gain: 0.36, partials: [1, 2, 3], reverb: 0.3 })),
  // Full celebratory fanfare: bass root + chord arpeggio + high sparkles.
  complete: () => {
    bell({ freq: 130.81, dur: 0.8, gain: 0.22, partials: [1, 2], reverb: 0.3 }); // C3 body
    [C5, E5, G5, C6].forEach((f, i) => bell({ freq: f, dur: 0.6, delay: i * 0.1, gain: 0.44, partials: [1, 2, 3], reverb: 0.4 }));
    [E6, G6].forEach((f, i) => bell({ freq: f, dur: 0.55, delay: 0.46 + i * 0.09, gain: 0.22, partials: [1, 2], reverb: 0.5 }));
  },
};

/** Play a UI sound effect (no-op when muted or audio is unavailable). */
export function playSound(name: SoundName) {
  if (muted) return;
  try { RECIPES[name](); } catch { /* audio not available — ignore */ }
}

export function isSoundMuted() { return muted; }

export function setSoundMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
  listeners.forEach(l => l(next));
}

export function toggleSoundMuted() { setSoundMuted(!muted); }

/** React hook: `[muted, toggle]`, kept in sync across components. */
export function useSoundMuted(): [boolean, () => void] {
  const [m, setM] = useState(muted);
  useEffect(() => {
    listeners.add(setM);
    return () => { listeners.delete(setM); };
  }, []);
  return [m, toggleSoundMuted];
}
