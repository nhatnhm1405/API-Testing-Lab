import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";

export interface TourStep {
  anchor: string; // matches a [data-tour="..."] element on screen
  title: string;
  body: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  run: boolean;
  onFinish: () => void;
}

interface Box { top: number; left: number; width: number; height: number; }
type Place = 'bottom' | 'top' | 'right' | 'left';

const ACCENT = '#2E5BFF', ACCENT2 = '#5B7BFF';
const TIP_W = 300;   // tooltip width
const EST_H = 176;   // estimated tooltip height (for side placement maths)
const GAP = 16;      // gap between spotlight and tooltip

export function GuidedTour({ steps, run, onFinish }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  // Restart from the first step whenever a fresh run begins.
  useEffect(() => { if (run) setIndex(0); }, [run]);

  const step = run ? steps[index] : undefined;

  // Measure the current anchor and keep it in sync with scroll / resize.
  useEffect(() => {
    if (!run || !step) return;

    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
      if (!el) { setBox(null); return; }
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });

    // Measure once the smooth-scroll settles, then on every scroll/resize.
    let raf = 0;
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    const settle = setTimeout(measure, 360);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      clearTimeout(settle); cancelAnimationFrame(raf);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [run, index, step]);

  if (!run || !step) return null;

  const last = index >= steps.length - 1;
  const next = () => last ? onFinish() : setIndex(i => i + 1);

  const PAD = 8;
  const spot = box && {
    top: box.top - PAD, left: box.left - PAD,
    width: box.width + PAD * 2, height: box.height + PAD * 2,
  };

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const tipW = Math.min(TIP_W, vw - 32);

  // Choose the side with the most room so the tooltip never sits over the
  // spotlighted component. Prefer below → above → right → left.
  let place: Place = 'bottom';
  let tipTop = vh / 2, tipLeft = vw / 2, shiftUp = false;
  let arrow: React.CSSProperties = { display: 'none' };

  if (spot) {
    const spaceBelow = vh - (spot.top + spot.height);
    const spaceAbove = spot.top;
    const spaceRight = vw - (spot.left + spot.width);
    const spaceLeft  = spot.left;
    const cx = spot.left + spot.width / 2;
    const cy = spot.top + spot.height / 2;

    place = spaceBelow >= EST_H + GAP ? 'bottom'
          : spaceAbove >= EST_H + GAP ? 'top'
          : spaceRight >= tipW + GAP  ? 'right'
          : spaceLeft  >= tipW + GAP  ? 'left'
          : 'bottom';

    if (place === 'bottom' || place === 'top') {
      tipLeft = Math.max(16, Math.min(cx - tipW / 2, vw - tipW - 16));
      const ax = Math.max(14, Math.min(cx - tipLeft - 7, tipW - 30));
      if (place === 'bottom') { tipTop = spot.top + spot.height + GAP; arrow = { top: -7, left: ax }; }
      else { tipTop = spot.top - GAP; shiftUp = true; arrow = { bottom: -7, left: ax }; }
    } else {
      tipTop = Math.max(16, Math.min(cy - EST_H / 2, vh - EST_H - 16));
      const ay = Math.max(14, Math.min(cy - tipTop - 7, EST_H - 30));
      if (place === 'right') { tipLeft = spot.left + spot.width + GAP; arrow = { left: -7, top: ay }; }
      else { tipLeft = spot.left - GAP - tipW; arrow = { right: -7, top: ay }; }
    }
  }

  const arrowStyle: React.CSSProperties = {
    position: 'absolute', width: 14, height: 14,
    background: 'var(--atl-surface)', transform: 'rotate(45deg)', borderRadius: 3,
    ...arrow,
  };

  // Slide-in direction matches the placement.
  const enter = place === 'bottom' ? { y: -8 } : place === 'top' ? { y: 8 } : place === 'right' ? { x: -8 } : { x: 8 };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Transparent catcher — clicking anywhere advances the tour. */}
      <div onClick={next} style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />

      {/* Spotlight: a hole punched in the dim via a huge box-shadow. */}
      {spot ? (
        <motion.div
          initial={false}
          animate={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          style={{
            position: 'absolute', borderRadius: 18, pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(15,12,30,0.66)',
            border: `2.5px solid ${ACCENT2}`,
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,12,30,0.66)', pointerEvents: 'none' }} />
      )}

      {/* Positioner (handles top/left + the top-placement shift) — no transform
          animation here so it never fights framer's transforms. */}
      <div style={{ position: 'absolute', top: tipTop, left: tipLeft, width: tipW, transform: shiftUp ? 'translateY(-100%)' : undefined }}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: .97, ...enter }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          style={{ position: 'relative', background: 'var(--atl-surface)', borderRadius: 16, padding: 16, boxShadow: '0 16px 48px rgba(15,12,30,.4)' }}
        >
          <div style={arrowStyle} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: ACCENT }}>
              STEP {index + 1} / {steps.length}
            </span>
            <button onClick={onFinish} aria-label="Skip tour"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--atl-ink-faint)', display: 'flex', padding: 2 }}>
              <X size={16} />
            </button>
          </div>

          <h4 style={{ fontFamily: 'var(--atl-font-display)', fontSize: 17, fontWeight: 800, color: 'var(--atl-ink)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            {step.title}
          </h4>
          <p style={{ fontFamily: 'var(--atl-font-body)', fontSize: 13.5, fontWeight: 500, color: 'var(--atl-ink-soft)', margin: '0 0 14px', lineHeight: 1.5 }}>
            {step.body}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onFinish}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--atl-font-body)', fontSize: 13, fontWeight: 700, color: 'var(--atl-ink-faint)', padding: 4 }}>
              Skip
            </button>
            <div style={{ display: 'flex', gap: 5 }}>
              {steps.map((_, i) => (
                <div key={i} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 100, background: i === index ? ACCENT : 'var(--atl-hairline)', transition: 'width .2s' }} />
              ))}
            </div>
            <button onClick={next}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg,${ACCENT},${ACCENT2})`, color: '#fff', border: 'none', borderRadius: 12, padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--atl-font-body)', fontSize: 14, fontWeight: 800, boxShadow: `0 4px 12px ${ACCENT}59` }}>
              {last ? 'Got it' : 'Next'} {!last && <ArrowRight size={15} />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
