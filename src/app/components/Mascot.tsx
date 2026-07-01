import { motion } from "motion/react";
import { emojify } from "../lib/emoji";

export type MascotState = 'idle' | 'correct' | 'wrong' | 'thinking';
export type MascotSize  = 'xs' | 'sm' | 'md' | 'lg';

interface MascotProps {
  state?: MascotState;
  size?: MascotSize;
  showBubble?: boolean;
  bubbleText?: string;
}

const PX: Record<MascotSize, number> = { xs: 40, sm: 56, md: 80, lg: 110 };

const getAnim = (s: MascotState) => {
  switch (s) {
    case 'correct':  return { y: [0,-18,4,-10,2,0], rotate: [0,-6,6,-3,3,0], transition: { duration: 0.7, ease: 'easeOut' } };
    case 'wrong':    return { x: [0,-9,9,-6,6,-3,3,0], transition: { duration: 0.55 } };
    case 'thinking': return { y: [0,-4,0], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } };
    default:         return { y: [0,-6,0], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } };
  }
};

// ── Termy — Claude Code's CLI terminal mascot ──────────────────────
// A little terminal window with a CUTE face: a title bar with three
// rounded "traffic-light" dots, a dark screen, a command prompt, big
// round eyes, blush cheeks and a rounded mouth. Same props/states as
// before so it drops in everywhere the old mascot was used. State is
// shown by the body animation (bounce / shake / hover) plus the face:
//   idle/thinking → round blinking eyes, gentle smile, orange accent
//   correct       → happy "∩ ∩" eyes + big smile, green accent
//   wrong         → ">  <" eyes + little "o" mouth, red accent
const ORANGE  = '#D97757';
const SCREEN  = '#1C1B2A';
const FRAME   = '#3A3850';
const GREEN   = '#3FB950';
const RED      = '#E5534B';
const YELLOW  = '#E3B341';
const PINK     = '#FF9BB3';
const WHITE    = '#FBFAFF';

export function Mascot({ state = 'idle', size = 'md', showBubble, bubbleText }: MascotProps) {
  const px = PX[size];

  // Screen accent colour by state.
  const accent = state === 'correct' ? GREEN : state === 'wrong' ? RED : ORANGE;
  // Eyes only blink (and the body idly hovers) while idle/thinking.
  const blinks = state === 'idle' || state === 'thinking';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      {showBubble && bubbleText && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          style={{
            background: '#1C1B2A', color: '#fff',
            padding: '5px 14px', borderRadius: '100px',
            fontSize: '13px', fontWeight: 700,
            fontFamily: 'var(--atl-font-body)',
            whiteSpace: 'nowrap', marginBottom: '8px', position: 'relative',
          }}
        >
          {emojify(bubbleText)}
          <span style={{
            position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #1C1B2A',
          }} />
        </motion.div>
      )}
      <motion.div animate={getAnim(state)} style={{ width: px, height: px }}>
        {/* Terminal window letterboxed inside the square footprint. */}
        <svg viewBox="0 0 100 100" width={px} height={px} xmlns="http://www.w3.org/2000/svg">
          {/* window body */}
          <rect x={8} y={16} width={84} height={68} rx={10} fill={SCREEN} stroke={accent} strokeWidth={3} />

          {/* title bar */}
          <rect x={8} y={16} width={84} height={18} rx={10} fill={FRAME} />
          <rect x={8} y={26} width={84} height={8} fill={FRAME} />
          <circle cx={20} cy={25} r={3} fill={RED} />
          <circle cx={31} cy={25} r={3} fill={YELLOW} />
          <circle cx={42} cy={25} r={3} fill={GREEN} />

          {/* command prompt chevron ">" — subtle terminal cue, top-left of screen */}
          <polyline points="14,40 17.5,43.5 14,47" fill="none" stroke={accent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />

          {/* blush cheeks */}
          <ellipse cx={31} cy={60} rx={5.5} ry={3.2} fill={PINK} opacity={0.65} />
          <ellipse cx={69} cy={60} rx={5.5} ry={3.2} fill={PINK} opacity={0.65} />

          {/* eyes */}
          {state === 'correct' ? (
            <>
              {/* happy ∩ ∩ eyes */}
              <path d="M29 54 Q36 45 43 54" fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" />
              <path d="M57 54 Q64 45 71 54" fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" />
            </>
          ) : state === 'wrong' ? (
            <>
              {/* x x eyes */}
              <path d="M31 46 L41 56 M41 46 L31 56" fill="none" stroke={RED} strokeWidth={3.8} strokeLinecap="round" />
              <path d="M59 46 L69 56 M69 46 L59 56" fill="none" stroke={RED} strokeWidth={3.8} strokeLinecap="round" />
            </>
          ) : (
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              animate={blinks ? { scaleY: [1, 1, 0.1, 1] } : { scaleY: 1 }}
              transition={blinks ? { duration: 3.4, times: [0, 0.92, 0.96, 1], repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              {/* round glossy eyes */}
              <circle cx={36} cy={51} r={7.5} fill={WHITE} />
              <circle cx={64} cy={51} r={7.5} fill={WHITE} />
              <circle cx={37} cy={52.5} r={4} fill={SCREEN} />
              <circle cx={65} cy={52.5} r={4} fill={SCREEN} />
              {/* big + tiny sparkle highlights */}
              <circle cx={38.6} cy={49.4} r={1.8} fill={WHITE} />
              <circle cx={66.6} cy={49.4} r={1.8} fill={WHITE} />
              <circle cx={35} cy={54} r={0.9} fill={WHITE} opacity={0.8} />
              <circle cx={63} cy={54} r={0.9} fill={WHITE} opacity={0.8} />
            </motion.g>
          )}

          {/* mouth */}
          {state === 'correct' ? (
            // wide open happy smile
            <path d="M39 65 Q50 80 61 65 Q50 71 39 65 Z" fill={GREEN} />
          ) : state === 'wrong' ? (
            // sad frown :(
            <path d="M40 72 Q50 62 60 72" fill="none" stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
          ) : (
            // simple smile :)
            <path d="M40 64 Q50 74 60 64" fill="none" stroke={accent} strokeWidth={3.4} strokeLinecap="round" />
          )}
        </svg>
      </motion.div>
    </div>
  );
}
