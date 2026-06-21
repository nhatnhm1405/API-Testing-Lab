// ── Tiny WebAudio sound kit ────────────────────────────────────────────────────
// Synthesizes short feedback blips on the fly — no audio asset files needed.
// The mute preference persists in localStorage. AudioContext is created lazily and
// resumed on demand (so it works after the first user gesture / autoplay policy).

const MUTE_KEY = 'atl.muted';

let ctx: AudioContext | null = null;
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } })();

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  const a = ctx;
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = a.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function play(notes: () => void) {
  if (muted || !ac()) return;
  notes();
}

export function isMuted() { return muted; }
export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch { /* ignore */ }
}
export function toggleMuted() { setMuted(!muted); return muted; }

export const playCorrect = () => play(() => { tone(523.25, 0, .14, 'triangle'); tone(659.25, .09, .14, 'triangle'); tone(783.99, .18, .24, 'triangle'); });
export const playWrong   = () => play(() => { tone(196.00, 0, .18, 'sawtooth', .05); tone(146.83, .12, .28, 'sawtooth', .05); });
export const playSend    = () => play(() => { tone(440, 0, .07, 'sine', .05); tone(660, .06, .10, 'sine', .05); });
export const playPop     = () => play(() => { tone(880, 0, .06, 'sine', .045); });
export const playClick   = () => play(() => { tone(330, 0, .05, 'square', .03); });
