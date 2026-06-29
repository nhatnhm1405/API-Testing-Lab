import { motion } from "motion/react";

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
// A little terminal window with a face: a title bar with three
// "traffic-light" dots, a dark screen, a command prompt, two eyes and
// a blinking cursor. Same props/states as before so it drops in
// everywhere the old mascot was used. State is shown by the body
// animation (bounce / shake / hover) plus the eyes + screen accent:
//   idle/thinking → square eyes, orange cursor
//   correct       → happy "^ ^" eyes, green accent
//   wrong         → "x x" eyes, red accent
const ORANGE  = '#D97757';
const SCREEN  = '#1C1B2A';
const FRAME   = '#3A3850';
const GREEN   = '#3FB950';
const RED     = '#E5534B';
const YELLOW  = '#E3B341';

export function Mascot({ state = 'idle', size = 'md', showBubble, bubbleText }: MascotProps) {
  const px = PX[size];

  // Screen accent colour by state.
  const accent = state === 'correct' ? GREEN : state === 'wrong' ? RED : ORANGE;
  // The blinking cursor only blinks while idle/thinking; on a result it stays solid.
  const cursorBlinks = state === 'idle' || state === 'thinking';

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
          {bubbleText}
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

          {/* command prompt chevron ">" */}
          <polyline points="19,46 25,52 19,58" fill="none" stroke={accent} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />

          {/* eyes */}
          {state === 'correct' ? (
            <>
              <polyline points="42,56 48,49 54,56" fill="none" stroke={GREEN} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="62,56 68,49 74,56" fill="none" stroke={GREEN} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : state === 'wrong' ? (
            <>
              <line x1={42} y1={49} x2={52} y2={59} stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
              <line x1={52} y1={49} x2={42} y2={59} stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
              <line x1={64} y1={49} x2={74} y2={59} stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
              <line x1={74} y1={49} x2={64} y2={59} stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
            </>
          ) : (
            <>
              <rect x={43} y={49} width={9} height={9} rx={1.5} fill="#fff" />
              <rect x={64} y={49} width={9} height={9} rx={1.5} fill="#fff" />
            </>
          )}

          {/* blinking cursor / mouth */}
          <motion.rect
            x={42} y={66} width={20} height={7} rx={1.5} fill={accent}
            animate={cursorBlinks ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
            transition={cursorBlinks ? { duration: 1.1, repeat: Infinity, ease: 'linear' } : undefined}
          />
        </svg>
      </motion.div>
    </div>
  );
}
