import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, Hand } from "lucide-react";
import confetti from "canvas-confetti";
import { TactileButton } from "./TactileButton";
import { Emoji, emojify } from "../lib/emoji";
import {
  Waiter, Chef, Customer, Bowl, Ticket, SteamPuffs, Mood,
  TableProp, Chair, WindowProp, Picture, Lantern,
} from "./pixel/characters";

// ── Phở Protocol · waiter mini-game ────────────────────────────────
// The learner is the waiter who walks left↔right between a guest
// (client) seated at a table and the kitchen (server), tracing one
// full request → response round-trip per order. Pixel art + animation.

const BLUE = '#2563EB';   // guest · client
const PURPLE = '#7C3AED'; // waiter · API
const GREEN = '#059669';  // kitchen · server / success
const RED = '#DC2626';    // 404 · sold out

interface Order {
  dish: string;
  endpoint: string;
  available: boolean;
  cookMs: number;
  patienceMs: number;
  flaky?: boolean; // the kitchen burns the first attempt → 500, must retry
}

const ORDERS: Order[] = [
  { dish: 'Beef Phở',        endpoint: 'GET /pho/beef',    available: true,  cookMs: 3000, patienceMs: 26000 },
  { dish: 'Chicken Phở',     endpoint: 'GET /pho/chicken', available: true,  cookMs: 3000, patienceMs: 24000, flaky: true },
  { dish: 'Wine-stewed Phở', endpoint: 'GET /pho/wine',    available: false, cookMs: 1200, patienceMs: 21000 },
];

// Scene geometry, in % of the corridor width.
const DOOR_X = 7;
const TABLES = [28, 45, 62];  // table centres; each order seats at one
const KITCHEN_X = 86;
const MIN_X = 14;
const MAX_X = 80;
const NEAR = 14;        // how close counts as "at a station"
const SPEED = 44;       // % of width per second

type Phase = 'placing' | 'taken' | 'cooking' | 'error' | 'ready' | 'picked' | 'served' | 'failed' | 'win';
type Carry = null | 'ticket' | 'bowl' | 'sorry';
type Action = null | 'take' | 'give' | 'pickup' | 'serve' | 'apologize' | 'retry';

const ACTIVE: Phase[] = ['placing', 'taken', 'cooking', 'error', 'ready', 'picked'];

interface LogEntry { id: number; icon: string; text: string; tag: string | null; tone: string }

export function PhoWaiterGame({ onContinue }: { onContinue?: () => void }) {
  const [orderIdx, setOrderIdx] = useState(0);
  const [round, setRound]   = useState(0);
  const [phase, setPhase]   = useState<Phase>('placing');
  const [carry, setCarry]   = useState<Carry>(null);
  const [patience, setPatience] = useState(1);
  const [cook, setCook]     = useState(0);
  const [served, setServed] = useState(0);
  const [seated, setSeated] = useState(false);
  const [retried, setRetried] = useState(false);
  // Shift scoring — tips grow with speed & combo; stars rate each serve.
  const [stars,     setStars]     = useState(0);
  const [tips,      setTips]      = useState(0);
  const [combo,     setCombo]     = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lastStars, setLastStars] = useState<number | null>(null);
  const [log, setLog]       = useState<LogEntry[]>([]);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [moving, setMoving] = useState(false);
  const [x, setX]           = useState(48);

  const dirRef = useRef(0);
  const xRef   = useRef(48);
  const logId  = useRef(0);
  const interactRef = useRef<() => void>(() => {});

  const order = ORDERS[orderIdx];
  const tableX = TABLES[orderIdx % TABLES.length];
  const playable = ACTIVE.includes(phase);
  const lastLog = log.length ? log[log.length - 1] : null;

  const pushLog = useCallback((icon: string, text: string, tag: string | null, tone: string) => {
    setLog(l => [...l, { id: logId.current++, icon, text, tag, tone }]);
  }, []);

  // ── proximity + the one action currently available ──────────────
  const nearGuest   = Math.abs(x - tableX) < NEAR;
  const nearKitchen = Math.abs(x - KITCHEN_X) < NEAR;
  let action: Action = null;
  if (nearGuest) {
    if (phase === 'placing' && seated) action = 'take';
    else if (phase === 'picked') action = carry === 'bowl' ? 'serve' : 'apologize';
  } else if (nearKitchen) {
    if (phase === 'taken') action = 'give';
    else if (phase === 'ready') action = 'pickup';
    else if (phase === 'error') action = 'retry';
  }

  const ACTION_LABEL: Record<Exclude<Action, null>, string> = {
    take: 'Take order',
    give: 'To kitchen',
    pickup: order.available ? 'Pick up phở' : 'Get reply',
    serve: 'Serve guest',
    apologize: 'Apologize',
    retry: 'Retry order',
  };

  // where the waiter should head next (for the floor target marker)
  const destX =
    phase === 'placing' ? tableX :
    phase === 'taken' ? KITCHEN_X :
    phase === 'ready' ? KITCHEN_X :
    phase === 'error' ? KITCHEN_X :
    phase === 'picked' ? tableX : null;

  // ── interaction ────────────────────────────────────────────────
  const doInteract = useCallback(() => {
    if (!action) return;
    switch (action) {
      case 'take':
        setCarry('ticket'); setPhase('taken');
        pushLog('📝', `Took order: ${order.dish}`, order.endpoint, BLUE);
        break;
      case 'give':
        setCarry(null);
        if (order.available) {
          setCook(0); setPhase('cooking');
          pushLog('🔥', 'Sent the order to the kitchen — cooking', 'request → server', GREEN);
        } else {
          setPhase('ready');
          pushLog('⚠️', 'Kitchen says: sold out!', '404 Not Found', RED);
        }
        break;
      case 'pickup':
        if (order.available) { setCarry('bowl'); pushLog('🍜', 'Carrying the hot phở', null, GREEN); }
        else { setCarry('sorry'); pushLog('🙏', 'Carrying the message to the guest', null, RED); }
        setPhase('picked');
        break;
      case 'serve': {
        // Faster serve (more patience left) = more stars & a bigger tip; a live
        // combo streak rewards keeping every guest happy.
        const s = patience > .6 ? 3 : patience > .3 ? 2 : 1;
        const newCombo = combo + 1;
        const gained = s * 5 + (newCombo - 1) * 3;
        setStars(v => v + s);
        setCombo(newCombo);
        setBestCombo(b => Math.max(b, newCombo));
        setTips(t => t + gained);
        setLastStars(s);
        setCarry(null); setServed(x => x + 1); setPhase('served');
        pushLog('✅', `Served — ${'⭐'.repeat(s)}  +${gained} tip`, '200 OK', GREEN);
        break;
      }
      case 'apologize':
        setCarry(null); setPhase('served');
        pushLog('🙇', 'Told the guest & handled the error', '404 Not Found', RED);
        break;
      case 'retry':
        setCook(0); setRetried(true); setPhase('cooking');
        pushLog('🔧', 'Kitchen recovering — re-cooking the order', 'retry request', PURPLE);
        break;
    }
  }, [action, order, pushLog, patience, combo]);

  interactRef.current = doInteract;

  // ── movement loop (held direction) ─────────────────────────────
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last; last = t;
      if (dirRef.current !== 0 && ACTIVE.includes(phase)) {
        let nx = xRef.current + dirRef.current * SPEED * (dt / 1000);
        nx = Math.max(MIN_X, Math.min(MAX_X, nx));
        xRef.current = nx;
        setX(nx);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ── keyboard controls ──────────────────────────────────────────
  useEffect(() => {
    const press = (d: number, f: 'left' | 'right') => { dirRef.current = d; setFacing(f); setMoving(true); };
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { press(-1, 'left'); e.preventDefault(); }
      else if (e.key === 'ArrowRight' || e.key === 'd') { press(1, 'right'); e.preventDefault(); }
      else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') {
        if (!e.repeat) interactRef.current();
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a') && dirRef.current === -1) { dirRef.current = 0; setMoving(false); }
      if ((e.key === 'ArrowRight' || e.key === 'd') && dirRef.current === 1) { dirRef.current = 0; setMoving(false); }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── patience drain ─────────────────────────────────────────────
  useEffect(() => {
    if (!ACTIVE.includes(phase)) return;
    // Rush hour: each later guest is a little more impatient than the last.
    const rush = 1 + orderIdx * 0.15;
    const id = setInterval(() => {
      setPatience(p => Math.max(0, p - (100 / order.patienceMs) * rush));
    }, 100);
    return () => clearInterval(id);
  }, [phase, order.patienceMs, orderIdx]);

  useEffect(() => {
    if (patience <= 0 && ACTIVE.includes(phase)) {
      setPhase('failed');
      setCombo(0); // an angry walk-out breaks the streak
      dirRef.current = 0; setMoving(false);
    }
  }, [patience, phase]);

  // ── cooking timer ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'cooking') return;
    const id = setInterval(() => {
      setCook(c => {
        const nc = c + 100 / order.cookMs;
        if (nc >= 1) {
          clearInterval(id);
          if (order.flaky && !retried) {
            setPhase('error');
            pushLog('🔥', 'Kitchen caught fire — the order failed!', '500 Server Error', RED);
          } else {
            setPhase('ready');
            pushLog('🛎️', 'Kitchen done — phở is ready', 'response 200', GREEN);
          }
          return 1;
        }
        return nc;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase, order.cookMs, order.flaky, retried, pushLog]);

  // ── advance after a delivery (let the guest eat & leave) ───────
  useEffect(() => {
    if (phase !== 'served') return;
    const t = setTimeout(() => {
      if (orderIdx < ORDERS.length - 1) startOrder(orderIdx + 1);
      else {
        setPhase('win');
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
      }
    }, 2300);
    return () => clearTimeout(t);
  }, [phase, orderIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const startOrder = (i: number) => {
    setOrderIdx(i);
    setRound(r => r + 1);
    setPhase('placing');
    setCarry(null);
    setCook(0);
    setPatience(1);
    setSeated(false);
    setRetried(false);
    setLastStars(null);
  };

  const retryOrder = () => startOrder(orderIdx);

  const replayAll = () => {
    setLog([]);
    setServed(0);
    setStars(0); setTips(0); setCombo(0); setBestCombo(0);
    xRef.current = 48; setX(48);
    startOrder(0);
  };

  // ── on-screen movement buttons ─────────────────────────────────
  const hold = (d: number, f: 'left' | 'right') => () => { dirRef.current = d; setFacing(f); setMoving(true); };
  const release = () => { dirRef.current = 0; setMoving(false); };

  const hint =
    phase === 'placing' ? '← Go to the guest and take the order' :
    phase === 'taken'   ? 'Carry the ticket to the kitchen →' :
    phase === 'cooking' ? '⏳ Wait for the kitchen…' :
    phase === 'error'   ? '500! Retry the order at the kitchen →' :
    phase === 'ready'   ? (order.available ? 'Pick up the phở at the kitchen →' : "Get the kitchen's reply →") :
    phase === 'picked'  ? (order.available ? '← Serve the phở to the guest' : '← Tell the guest (sold out)') : '';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
      style={{ background: '#FFF', borderRadius: 24, padding: 'clamp(16px,4vw,24px)', border: '1.5px solid #ECE8E1', boxShadow: '0 1px 2px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.07)' }}>

      {/* ── HUD ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F5F3FF', borderRadius: 100, padding: '5px 12px' }}>
          <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '13px', fontWeight: 800, color: PURPLE }}>
            Order {orderIdx + 1}/{ORDERS.length}
          </span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF7ED', borderRadius: 100, padding: '5px 12px' }}>
          <Emoji e="🍜" size={15} />
          <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 700, color: '#C2410C' }}>{order.dish}</span>
        </div>

        {/* tips + combo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 100, padding: '4px 11px' }}>
          <Emoji e="🪙" size={14} />
          <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 800, color: '#B45309' }}>{tips}</span>
        </div>
        {combo >= 2 && (
          <motion.div key={combo} initial={{ scale: .7 }} animate={{ scale: 1 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 100, padding: '4px 11px' }}>
            <Emoji e="🔥" size={14} />
            <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 800, color: '#DC2626' }}>x{combo}</span>
          </motion.div>
        )}

        {/* guests still waiting this shift */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          {ORDERS.map((_, i) => (
            <span key={i} style={{ opacity: i < orderIdx ? .28 : i === orderIdx ? 1 : .6, filter: i < orderIdx ? 'grayscale(1)' : 'none' }}>
              <Emoji e="🧑" size={i === orderIdx ? 17 : 14} />
            </span>
          ))}
        </div>

        {/* patience meter */}
        <div style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Emoji e={patience > .35 ? '🙂' : '😣'} size={14} />
          <div style={{ flex: 1, height: 9, borderRadius: 100, background: '#F1EEE9', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${Math.max(0, patience) * 100}%` }}
              transition={{ duration: .12, ease: 'linear' }}
              style={{ height: '100%', borderRadius: 100, background: patience > .5 ? '#22C55E' : patience > .25 ? '#F59E0B' : '#EF4444' }}
            />
          </div>
          <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '11px', fontWeight: 700, color: '#A7A3AD', whiteSpace: 'nowrap' }}>Patience</span>
        </div>
      </div>

      {/* ── scene ───────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(240px,48vw,300px)', borderRadius: 18, overflow: 'hidden', border: '1.5px solid #E4D6BF', background: 'linear-gradient(180deg,#F6E9D2 0%,#F1E0C4 58%,#E7C79A 58%,#DDB985 100%)' }}>

        {/* ── wall decor (background) ───────────────────────── */}
        {/* lantern string */}
        {[18, 34, 66, 82].map(lx => (
          <div key={lx} style={{ position: 'absolute', left: `${lx}%`, top: 6, transform: 'translateX(-50%)', zIndex: 1 }}>
            <div style={{ width: 1, height: 8, background: '#7c5a33', margin: '0 auto' }} />
            <Lantern scale={2} />
          </div>
        ))}
        {/* hanging lamp + PHỞ sign */}
        <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <div style={{ width: 2, height: 12, background: '#7c5a33' }} />
          <div style={{ width: 20, height: 12, borderRadius: '0 0 10px 10px', background: 'linear-gradient(180deg,#3a2c18,#6b4a25)', boxShadow: '0 8px 22px rgba(245,180,60,.45)' }} />
        </div>
        <div style={{ position: 'absolute', left: '50%', top: 26, transform: 'translateX(-50%)', background: '#7a2410', border: '2px solid #b8431e', borderRadius: 4, padding: '2px 10px', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '13px', fontWeight: 800, color: '#ffd9a8', letterSpacing: '.12em' }}>PHỞ</span>
        </div>
        {/* window + picture */}
        <div style={{ position: 'absolute', left: '24%', top: 30, transform: 'translateX(-50%)', zIndex: 1 }}><WindowProp scale={2.4} /></div>
        <div style={{ position: 'absolute', left: '70%', top: 34, transform: 'translateX(-50%)', zIndex: 1 }}><Picture scale={2.4} /></div>

        {/* floor */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '58%', bottom: 0, background: 'repeating-linear-gradient(90deg,#E7C79A,#E7C79A 26px,#E0BC8B 26px,#E0BC8B 28px)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '58%', height: 2, background: '#C9A26B' }} />

        {/* ── tables + chairs (chairs behind, tables in front) ─ */}
        {TABLES.map((tx, i) => (
          <div key={i}>
            <div style={{ position: 'absolute', left: `${tx + 4}%`, bottom: '13%', transform: 'translateX(-50%)', zIndex: 3 }}><Chair scale={3} flip /></div>
            <div style={{ position: 'absolute', left: `${tx}%`, bottom: '12%', transform: 'translateX(-50%)', zIndex: 5 }}>
              <TableProp scale={3} />
              {/* a bowl appears on the active table while the guest eats */}
              {i === orderIdx % TABLES.length && phase === 'served' && order.available && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ position: 'absolute', left: '40%', top: -10, transform: 'translateX(-50%)' }}>
                  <Bowl scale={2} steam />
                </motion.div>
              )}
            </div>
          </div>
        ))}

        {/* floor target marker */}
        {destX != null && phase !== 'cooking' && (
          <motion.div
            animate={{ left: `${destX}%`, opacity: nearGuest && destX === tableX ? 0.25 : nearKitchen && destX === KITCHEN_X ? 0.25 : 1 }}
            transition={{ left: { duration: .3 } }}
            style={{ position: 'absolute', bottom: '13%', transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'none' }}>
            <motion.div animate={{ scale: [1, 1.25, 1], opacity: [.5, .9, .5] }} transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 30, height: 10, borderRadius: '50%', border: `2px solid ${PURPLE}`, background: `${PURPLE}22` }} />
          </motion.div>
        )}

        {/* hint banner */}
        <AnimatePresence mode="wait">
          {hint && (
            <motion.div key={hint}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}
              style={{ position: 'absolute', top: 8, left: 14, background: 'rgba(255,255,255,.92)', border: '1.5px solid #E4D6BF', borderRadius: 100, padding: '4px 12px', zIndex: 8 }}>
              <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 700, color: '#6B6A7B', whiteSpace: 'nowrap' }}>{hint}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── guest (walks in, sits, eats, leaves) ────────────── */}
        <CustomerActor
          round={round} phase={phase} doorX={DOOR_X} tableX={tableX}
          dish={order.dish} available={order.available} seated={seated}
          onSeated={() => setSeated(true)}
        />

        {/* ── kitchen station (right) ─────────────────────────── */}
        <div style={{ position: 'absolute', left: `${KITCHEN_X}%`, bottom: '16%', transform: 'translateX(-50%)', zIndex: 4 }}>
          <Label title="Kitchen" sub="Server" color={GREEN} />
          <div style={{ position: 'relative' }}>
            <Chef scale={4} flip cooking={phase === 'cooking'} />
            {phase === 'cooking' && (
              <div style={{ position: 'absolute', left: '8%', bottom: 6 }}><SteamPuffs scale={3} /></div>
            )}
          </div>
          {/* counter in front of the chef */}
          <div style={{ position: 'absolute', left: '-34%', right: '-34%', bottom: -6, height: 22, background: 'linear-gradient(180deg,#9c6b3a,#7c5328)', borderTop: '3px solid #b9844f', borderRadius: 3, zIndex: 5 }}>
            <div style={{ position: 'absolute', left: 10, top: -8, width: 18, height: 12, background: '#33363f', borderRadius: '2px 2px 4px 4px', border: '1px solid #1d1b29' }} />
          </div>

          {/* cooking progress */}
          <AnimatePresence>
            {phase === 'cooking' && (
              <motion.div key="cook" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', width: 80, zIndex: 7 }}>
                <div style={{ textAlign: 'center', marginBottom: 3 }}><Emoji e="🔥" size={13} /></div>
                <div style={{ height: 7, borderRadius: 100, background: 'rgba(255,255,255,.6)', overflow: 'hidden' }}>
                  <div style={{ width: `${cook * 100}%`, height: '100%', background: 'linear-gradient(90deg,#F59E0B,#22C55E)', borderRadius: 100, transition: 'width .1s linear' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ready bowl / sold-out bubble */}
          <AnimatePresence>
            {phase === 'ready' && order.available && (
              <motion.div key="rdy" initial={{ scale: 0, y: 6 }} animate={{ scale: 1, y: [0, -3, 0] }} exit={{ opacity: 0 }}
                transition={{ scale: { type: 'spring', stiffness: 480, damping: 16 }, y: { duration: 1, repeat: Infinity } }}
                style={{ position: 'absolute', bottom: 'calc(100% + 2px)', left: '50%', transform: 'translateX(-50%)', zIndex: 7 }}>
                <Bowl scale={3} steam />
              </motion.div>
            )}
            {phase === 'ready' && !order.available && (
              <motion.div key="oos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 7 }}>
                <SpeechBubble tone={RED}>We're sold out! <Emoji e="🚫" /></SpeechBubble>
              </motion.div>
            )}
            {phase === 'error' && (
              <motion.div key="err" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 7 }}>
                <SpeechBubble tone={RED}>Fire! 500 error <Emoji e="🔥" /></SpeechBubble>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── waiter ──────────────────────────────────────────── */}
        <motion.div
          animate={{ left: `${x}%`, y: moving ? [0, -3, 0] : 0 }}
          transition={{ left: { duration: 0 }, y: moving ? { duration: .3, repeat: Infinity, ease: 'easeInOut' } : { duration: .2 } }}
          style={{ position: 'absolute', bottom: '16%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
          {/* carried item */}
          <div style={{ height: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <AnimatePresence>
              {carry && (
                <motion.div key={carry} initial={{ scale: 0, y: 6 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
                  style={{ position: 'relative', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.2))' }}>
                  {carry === 'ticket' && <Ticket scale={2.5} />}
                  {carry === 'bowl' && <Bowl scale={2.5} steam />}
                  {carry === 'sorry' && <Emoji e="🙏" size={18} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Waiter scale={4} flip={facing === 'left'} moving={moving} />
          <div style={{ width: 34, height: 7, borderRadius: '50%', background: 'rgba(28,27,42,.18)', marginTop: -3, filter: 'blur(1px)' }} />

          {/* interact prompt */}
          <AnimatePresence>
            {action && (
              <motion.div initial={{ opacity: 0, scale: .6, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .6 }}
                style={{ position: 'absolute', bottom: -20, whiteSpace: 'nowrap' }}>
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: .9, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: PURPLE, color: '#FFF', borderRadius: 100, padding: '3px 10px', boxShadow: `0 4px 12px ${PURPLE}55` }}>
                  <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '11px', fontWeight: 800 }}>E · {ACTION_LABEL[action]}</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* serve star rating popup */}
        <AnimatePresence>
          {phase === 'served' && order.available && lastStars != null && (
            <motion.div key={`stars-${round}`}
              initial={{ opacity: 0, y: 10, scale: .8 }} animate={{ opacity: 1, y: -6, scale: 1 }} exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.95)', border: '1.5px solid #FDE68A', borderRadius: 100, padding: '5px 14px', boxShadow: '0 8px 20px rgba(180,83,9,.22)' }}>
              {Array.from({ length: lastStars }).map((_, i) => <Emoji key={i} e="⭐" size={16} />)}
              <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '13px', fontWeight: 800, color: '#B45309' }}>
                {lastStars === 3 ? 'Perfect serve!' : lastStars === 2 ? 'Nice & quick!' : 'Served!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* failed overlay */}
        <AnimatePresence>
          {phase === 'failed' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(28,27,42,.55)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10, padding: 20, textAlign: 'center' }}>
              <Emoji e="😞" size={40} />
              <p style={{ fontFamily: 'var(--atl-font-display)', fontSize: '17px', fontWeight: 800, color: '#FFF', margin: 0 }}>The guest got tired of waiting!</p>
              <TactileButton variant="primary" size="sm" onClick={retryOrder} icon={<RotateCcw size={14} />}>Retry this order</TactileButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── controls ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <MoveButton dir="left" onHold={hold(-1, 'left')} onRelease={release} disabled={!playable} />
          <MoveButton dir="right" onHold={hold(1, 'right')} onRelease={release} disabled={!playable} />
        </div>

        <button
          onClick={doInteract}
          disabled={!action}
          style={{
            flex: 1, minWidth: 150, height: 52, borderRadius: 14, border: 'none', cursor: action ? 'pointer' : 'not-allowed',
            background: action ? PURPLE : '#EDE9E2', color: action ? '#FFF' : '#A7A3AD',
            fontFamily: 'var(--atl-font-body)', fontSize: '15px', fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: action ? `0 4px 0 #5B21B6, 0 8px 20px ${PURPLE}40` : 'none',
            transition: 'all .15s', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
          }}>
          <Hand size={18} />
          {action ? ACTION_LABEL[action] : 'Interact (E)'}
        </button>
      </div>

      {/* ── current step (one at a time) ────────────────────── */}
      {lastLog && (
        <div style={{ marginTop: 16, background: '#FAF8F5', border: '1.5px solid #F0EAE0', borderRadius: 14, padding: '12px 14px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={lastLog.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .25 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Emoji e={lastLog.icon} size={18} />
              <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 600, color: '#1C1B2A', flex: 1 }}>{emojify(lastLog.text)}</span>
              {lastLog.tag && (
                <code style={{ fontFamily: 'monospace', fontSize: '11.5px', fontWeight: 700, color: lastLog.tone, background: `${lastLog.tone}14`, borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>{lastLog.tag}</code>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── win banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'win' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px', background: '#ECFDF3', border: '1.5px solid #BBF7D0', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <CheckCircle2 size={22} color="#22C55E" style={{ flexShrink: 0 }} />
              <p style={{ flex: 1, minWidth: 200, fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 600, color: '#15803D', margin: 0, lineHeight: 1.45 }}>
                Shift complete! Each order was a full <b>client → API → server → response</b> round-trip.
              </p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <TactileButton variant="ghost" size="sm" onClick={replayAll} icon={<RotateCcw size={14} />}>Replay</TactileButton>
                {onContinue && <TactileButton variant="continue" size="sm" onClick={onContinue}>Continue →</TactileButton>}
              </div>
            </div>
            {/* shift scorecard */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ScorePill emoji="⭐" label="Stars" value={`${stars}/${ORDERS.filter(o => o.available).length * 3}`} />
              <ScorePill emoji="🪙" label="Tips" value={`${tips}`} />
              <ScorePill emoji="🔥" label="Best combo" value={`x${bestCombo}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── guest that walks in from the door, sits, eats, then leaves ─────
function CustomerActor({ round, phase, doorX, tableX, dish, available, seated, onSeated }: {
  round: number; phase: Phase; doorX: number; tableX: number; dish: string; available: boolean; seated: boolean; onSeated: () => void;
}) {
  const [mode, setMode] = useState<'in' | 'seated' | 'eat' | 'out'>('in');

  // walk in on every new round
  useEffect(() => {
    setMode('in');
    const t = setTimeout(() => { setMode('seated'); onSeated(); }, 780);
    return () => clearTimeout(t);
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  // react to the order outcome
  useEffect(() => {
    if (phase === 'failed') { setMode('out'); return; }
    if (phase === 'served') {
      if (available) {
        setMode('eat');
        const t = setTimeout(() => setMode('out'), 1100);
        return () => clearTimeout(t);
      }
      setMode('out');
    }
  }, [phase, available]);

  const walking = mode === 'in' || mode === 'out';
  const sit = mode === 'seated' || mode === 'eat';
  const facing: 'left' | 'right' = mode === 'out' ? 'left' : 'right';
  const mood: Mood = walking ? 'idle'
    : mode === 'eat' ? 'happy'
    : phase === 'placing' ? 'wave'
    : (phase === 'served' && !available) || phase === 'failed' ? 'sad'
    : 'idle';

  const left = mode === 'out' ? doorX : mode === 'in' ? tableX : tableX;

  return (
    <motion.div key={round}
      initial={{ left: `${doorX}%`, opacity: 0 }}
      animate={{ left: `${left}%`, opacity: mode === 'out' ? 0 : 1 }}
      transition={{ left: { duration: walking ? 0.74 : 0, ease: 'linear' }, opacity: { duration: 0.3 } }}
      style={{ position: 'absolute', bottom: '15%', transform: 'translateX(-50%)', zIndex: 4, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* speech (only once seated) */}
      <div style={{ position: 'absolute', bottom: 'calc(100% + 2px)', left: '50%', transform: 'translateX(-50%)' }}>
        <AnimatePresence mode="wait">
          {seated && phase === 'placing' && <SpeechBubble key="ask" tone={BLUE}>One {dish}, please! <Emoji e="🙌" /></SpeechBubble>}
          {mode === 'eat' && <SpeechBubble key="yum" tone={GREEN}>Thank you! <Emoji e="😋" /></SpeechBubble>}
          {phase === 'served' && !available && <SpeechBubble key="sad" tone={RED}>Aw, what a pity… <Emoji e="🙁" /></SpeechBubble>}
        </AnimatePresence>
      </div>
      <Customer scale={4} mood={mood} moving={walking} sit={sit} flip={facing === 'left'} />
      {!walking && <Label title="Guest" sub="Client" color={BLUE} />}
    </motion.div>
  );
}

// ── a compact scorecard stat (shift summary) ───────────────────────
function ScorePill({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FFF', border: '1.5px solid #BBF7D0', borderRadius: 100, padding: '5px 12px' }}>
      <Emoji e={emoji} size={15} />
      <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 600, color: '#15803D' }}>{label}</span>
      <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '13px', fontWeight: 800, color: '#166534' }}>{value}</span>
    </div>
  );
}

// ── a small station name tag (sits under the sprite) ───────────────
function Label({ title, sub, color }: { title: string; sub: string; color: string }) {
  return (
    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1, whiteSpace: 'nowrap', zIndex: 8 }}>
      <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '12px', fontWeight: 800, color: '#1C1B2A' }}>{title}</span>
      <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '10px', fontWeight: 700, color }}>{sub}</span>
    </div>
  );
}

// ── a speech bubble ────────────────────────────────────────────────
function SpeechBubble({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: .8, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .8 }} transition={{ type: 'spring', stiffness: 460, damping: 22 }}
      style={{ whiteSpace: 'nowrap', zIndex: 8 }}>
      <div style={{ position: 'relative', background: '#FFF', border: `1.5px solid ${tone}40`, borderRadius: 12, padding: '6px 11px', boxShadow: `0 6px 16px ${tone}26` }}>
        <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 700, color: '#1C1B2A' }}>{children}</span>
        <div style={{ position: 'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%) rotate(45deg)', width: 10, height: 10, background: '#FFF', borderRight: `1.5px solid ${tone}40`, borderBottom: `1.5px solid ${tone}40` }} />
      </div>
    </motion.div>
  );
}

// ── a press-and-hold movement button ───────────────────────────────
function MoveButton({ dir, onHold, onRelease, disabled }: {
  dir: 'left' | 'right'; onHold: () => void; onRelease: () => void; disabled: boolean;
}) {
  return (
    <button
      onPointerDown={(e) => { if (!disabled) { e.currentTarget.setPointerCapture(e.pointerId); onHold(); } }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
      disabled={disabled}
      style={{
        width: 56, height: 52, borderRadius: 14, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#EDE9E2' : '#1C1B2A', color: disabled ? '#A7A3AD' : '#FFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: disabled ? 'none' : '0 4px 0 rgba(0,0,0,.45)',
        touchAction: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
      }}>
      {dir === 'left' ? <ArrowLeft size={22} strokeWidth={2.5} /> : <ArrowRight size={22} strokeWidth={2.5} />}
    </button>
  );
}
