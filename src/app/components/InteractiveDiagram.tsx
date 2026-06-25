import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X } from "lucide-react";
import confetti from "canvas-confetti";
import { useIsMobile } from "./ui/use-mobile";
import type { InteractiveNode } from "../data/courseData";

interface ConnectExerciseProps {
  prompt: string;
  source: InteractiveNode;
  sourceEmptyLabel?: string;
  sourceFilledLabel?: string;
  targets: InteractiveNode[];
  correctTargetId: string;
  reveal: { request: string; response: string };
  checkTrigger: number;
  onReadyChange: (ready: boolean) => void;
  onResult: (correct: boolean) => void;
  phase: 'answering' | 'correct' | 'wrong';
}

type RevealPhase = 'idle' | 'request' | 'response' | 'done';
type TargetState = 'default' | 'hover' | 'connected' | 'correct' | 'wrong' | 'dim';

const BRAND = '#2E5BFF';
const GREEN = '#22C55E';
const RED   = '#F43F5E';

interface Pt { x: number; y: number }

export function ConnectExercise({
  prompt, source, sourceEmptyLabel, sourceFilledLabel,
  targets, correctTargetId, reveal,
  checkTrigger, onReadyChange, onResult, phase,
}: ConnectExerciseProps) {
  const isMobile = useIsMobile();

  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef    = useRef<HTMLDivElement>(null);
  const targetRefs   = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverRef     = useRef<string | null>(null);
  const confettiFired = useRef(false);

  const [connected, setConnected] = useState<string | null>(null);
  const [dragging,  setDragging]  = useState(false);
  const [pointer,   setPointer]   = useState<Pt | null>(null);
  const [hover,     setHover]     = useState<string | null>(null);
  const [reveal_,   setReveal]    = useState<RevealPhase>('idle');
  const [, forceTick]             = useState(0);

  const isAnswering = phase === 'answering' && checkTrigger === 0;
  const isCorrect   = connected === correctTargetId;

  // ── Geometry helpers ──────────────────────────────────────────────
  const centerOf = (el: HTMLElement | null): Pt | null => {
    const c = containerRef.current;
    if (!el || !c) return null;
    const cr = c.getBoundingClientRect();
    const r  = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top };
  };

  // ── Re-measure on resize ──────────────────────────────────────────
  useEffect(() => {
    const onResize = () => forceTick(t => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Ready signal for the Check button ─────────────────────────────
  useEffect(() => { onReadyChange(connected !== null); }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Evaluate when Check is pressed ────────────────────────────────
  useEffect(() => {
    if (checkTrigger === 0) return;
    onResult(connected === correctTargetId);
  }, [checkTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reveal animation after a correct answer ───────────────────────
  useEffect(() => {
    if (phase !== 'correct') { setReveal('idle'); return; }
    setReveal('request');
    const t1 = setTimeout(() => setReveal('response'), 750);
    const t2 = setTimeout(() => {
      setReveal('done');
      if (!confettiFired.current) {
        confettiFired.current = true;
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.62 }, scalar: 0.9, disableForReducedMotion: true });
      }
    }, 1550);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // ── Wire dragging (pointer) ───────────────────────────────────────
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const c = containerRef.current; if (!c) return;
      const cr = c.getBoundingClientRect();
      setPointer({ x: e.clientX - cr.left, y: e.clientY - cr.top });
      let h: string | null = null;
      for (const t of targets) {
        const el = targetRefs.current[t.id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { h = t.id; break; }
      }
      hoverRef.current = h;
      setHover(h);
    };
    const up = () => {
      if (hoverRef.current) setConnected(hoverRef.current);
      setDragging(false); setPointer(null); setHover(null); hoverRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [dragging]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (e: React.PointerEvent) => {
    if (!isAnswering) return;
    e.preventDefault();
    const c = containerRef.current;
    if (c) { const cr = c.getBoundingClientRect(); setPointer({ x: e.clientX - cr.left, y: e.clientY - cr.top }); }
    setDragging(true);
  };

  const tapTarget = (id: string) => { if (isAnswering) setConnected(id); };

  // ── Wire endpoints ────────────────────────────────────────────────
  const src = centerOf(handleRef.current);
  let end: Pt | null = null;
  if (dragging && pointer) end = pointer;
  else if (connected)      end = centerOf(targetRefs.current[connected]);

  const tgt = connected ? centerOf(targetRefs.current[connected]) : null;

  const wireColor = phase === 'correct' ? GREEN : phase === 'wrong' ? RED : BRAND;
  const showWire  = !!(src && end);

  // ── Per-target visual state ───────────────────────────────────────
  const targetState = (id: string): TargetState => {
    if (isAnswering) {
      if (connected === id) return 'connected';
      if (hover === id)     return 'hover';
      return 'default';
    }
    if (id === correctTargetId) return 'correct';
    if (connected === id)       return 'wrong';
    return 'dim';
  };

  const sourceValue = reveal_ === 'done' && isCorrect
    ? (sourceFilledLabel ?? '')
    : (sourceEmptyLabel ?? '');

  return (
    <div>
      <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'19px', fontWeight:800, color:'#1C1B2A', margin:'0 0 6px', lineHeight:1.35, letterSpacing:'-0.01em' }}>
        {prompt}
      </p>
      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12.5px', fontWeight:600, color:'#A7A3AD', margin:'0 0 20px' }}>
        {isAnswering ? 'Drag the plug from the app — or tap a destination.' : isCorrect ? 'That request is an API call. ✨' : 'Follow the wire to the right source.'}
      </p>

      <div
        ref={containerRef}
        style={{
          position:'relative',
          display:'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 28 : 20,
          padding: '8px 4px',
        }}
      >
        {/* ── Wire overlay ── */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:2, overflow:'visible' }}>
          {showWire && src && end && (
            <>
              <motion.line
                x1={src.x} y1={src.y} x2={end.x} y2={end.y}
                stroke={wireColor} strokeWidth={3.5} strokeLinecap="round"
                strokeDasharray={dragging ? '7 7' : undefined}
                animate={{ x1: src.x, y1: src.y, x2: end.x, y2: end.y }}
                transition={{ type:'spring', stiffness:500, damping:34 }}
                style={{ filter:`drop-shadow(0 0 5px ${wireColor}55)` }}
              />
              {!dragging && (
                <circle cx={end.x} cy={end.y} r={5} fill={wireColor} />
              )}
            </>
          )}
        </svg>

        {/* ── Travelling packets (reveal) ── */}
        <AnimatePresence>
          {reveal_ === 'request' && src && tgt && (
            <motion.div key="req"
              initial={{ left: src.x, top: src.y, opacity: 0 }}
              animate={{ left: tgt.x, top: tgt.y, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              style={packetStyle(BRAND)}>
              {reveal.request}
            </motion.div>
          )}
          {reveal_ === 'response' && src && tgt && (
            <motion.div key="res"
              initial={{ left: tgt.x, top: tgt.y, opacity: 0 }}
              animate={{ left: src.x, top: src.y, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              style={packetStyle(GREEN)}>
              {reveal.response}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Source node ── */}
        <div style={{ flex: isMobile ? undefined : '0 0 184px', display:'flex', justifyContent: isMobile ? 'center' : 'flex-start', zIndex:1 }}>
          <motion.div
            animate={reveal_ === 'response' || reveal_ === 'done' ? { scale:[1,1.05,1], transition:{ duration:.4 } } : {}}
            style={{
              position:'relative', width:172, boxSizing:'border-box',
              background:'#FFF', border:`2px solid ${isCorrect && reveal_==='done' ? GREEN : '#ECE8E1'}`,
              borderRadius:18, padding:'16px 14px', textAlign:'center',
              boxShadow:'0 6px 20px rgba(28,27,42,.08)',
            }}>
            <div style={{ fontSize:34, lineHeight:1 }}>{source.emoji}</div>
            <div style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:700, color:'#1C1B2A', marginTop:6 }}>{source.label}</div>
            <div style={{
              marginTop:8, fontFamily:'var(--atl-font-display)', fontWeight:800,
              fontSize:'20px', color: reveal_==='done' && isCorrect ? '#15803D' : '#C4C0CA',
              transition:'color .3s',
            }}>
              {sourceValue}
            </div>

            {/* Drag handle / plug */}
            <div
              ref={handleRef}
              onPointerDown={startDrag}
              style={{
                position:'absolute',
                ...(isMobile
                  ? { bottom:-11, left:'50%', transform:'translateX(-50%)' }
                  : { right:-11, top:'50%', transform:'translateY(-50%)' }),
                width:22, height:22, borderRadius:'50%',
                background: isAnswering ? `linear-gradient(135deg,${BRAND},#5B7BFF)` : '#D7D3DC',
                border:'3px solid #FFF',
                boxShadow: isAnswering ? `0 0 0 3px ${BRAND}33` : 'none',
                cursor: isAnswering ? 'grab' : 'default',
                touchAction:'none', zIndex:3,
              }}>
              {isAnswering && (
                <motion.span
                  animate={{ scale:[1,1.7,1], opacity:[0.5,0,0.5] }}
                  transition={{ duration:1.6, repeat:Infinity, ease:'easeOut' }}
                  style={{ position:'absolute', inset:-3, borderRadius:'50%', background:BRAND, zIndex:-1 }}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Target nodes ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, zIndex:1 }}>
          {targets.map(t => {
            const st = targetState(t.id);
            const v = TARGET_STYLE[st];
            return (
              <motion.div
                key={t.id}
                ref={el => { targetRefs.current[t.id] = el; }}
                onClick={() => tapTarget(t.id)}
                animate={st === 'wrong' ? { x:[0,-7,7,-4,4,0], transition:{ duration:.45 } } : st === 'correct' && reveal_==='done' ? { scale:[1,1.03,1], transition:{ duration:.3 } } : {}}
                whileHover={isAnswering ? { y:-1 } : {}}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'13px 15px', borderRadius:16,
                  background:v.bg, border:`2px solid ${v.border}`,
                  boxShadow:v.shadow,
                  cursor: isAnswering ? 'pointer' : 'default',
                  opacity:v.opacity, userSelect:'none',
                  transition:'background .2s, border-color .2s, opacity .2s',
                }}>
                <div style={{ fontSize:26, lineHeight:1, flexShrink:0 }}>{t.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--atl-font-body)', fontSize:'15px', fontWeight:700, color:'#1C1B2A' }}>{t.label}</div>
                  {t.sub && <div style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:500, color:'#A7A3AD' }}>{t.sub}</div>}
                </div>
                {!isAnswering && st === 'correct' && (
                  <div style={badgeStyle(GREEN)}><Check size={15} strokeWidth={3} color="#fff"/></div>
                )}
                {!isAnswering && st === 'wrong' && (
                  <div style={badgeStyle(RED)}><X size={15} strokeWidth={3} color="#fff"/></div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function packetStyle(color: string): React.CSSProperties {
  return {
    position:'absolute', transform:'translate(-50%,-50%)', zIndex:4,
    background:'#FFF', border:`1.5px solid ${color}`, color,
    borderRadius:8, padding:'5px 9px',
    fontFamily:'var(--atl-font-mono, ui-monospace, monospace)', fontSize:'11px', fontWeight:700,
    whiteSpace:'nowrap', boxShadow:`0 4px 14px ${color}40`, pointerEvents:'none',
  };
}

function badgeStyle(color: string): React.CSSProperties {
  return { width:24, height:24, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
}

const TARGET_STYLE: Record<TargetState, { bg: string; border: string; shadow: string; opacity: number }> = {
  default:   { bg:'#FFF',     border:'#ECE8E1', shadow:'0 1px 3px rgba(28,27,42,.06)', opacity:1 },
  hover:     { bg:'#EEF2FF',  border:BRAND,     shadow:`0 0 0 3px ${BRAND}22`,         opacity:1 },
  connected: { bg:'#EEF2FF',  border:BRAND,     shadow:`0 0 0 3px ${BRAND}22`,         opacity:1 },
  correct:   { bg:'#ECFDF3',  border:GREEN,     shadow:`0 0 0 3px ${GREEN}22`,         opacity:1 },
  wrong:     { bg:'#FFF1F2',  border:RED,       shadow:`0 0 0 3px ${RED}1c`,           opacity:1 },
  dim:       { bg:'#FFF',     border:'#ECE8E1', shadow:'none',                          opacity:.5 },
};
