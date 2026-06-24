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

// ── Clawd — Claude Code's pixel mascot ─────────────────────────────
// A 12×8 pixel-grid critter in Anthropic's signature orange, with two
// dark eye pixels. Same props/states as before so it drops in
// everywhere the old mascot was used. State is conveyed by the body
// animation (bounce / shake / hover) plus a happy eye-squint on a
// correct answer.
const ORANGE = '#D97757';
const EYE    = '#1A1A1A';

// Orange body pixels as [col, row] on a 12-wide × 8-tall grid.
const BODY: ReadonlyArray<readonly [number, number]> = [
  // row 0 — top of head
  [2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  // row 1 — head (eyes carved out at col 3 & 9)
  [2,1],[4,1],[5,1],[6,1],[7,1],[8,1],
  // rows 2-3 — outstretched arms (full width)
  [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],
  [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],
  // rows 4-5 — lower body
  [2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],
  [2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],
  // rows 6-7 — legs
  [2,6],[4,6],[7,6],[9,6],
  [2,7],[4,7],[7,7],[9,7],
];

// Eye pixel positions (col, row).
const EYES: ReadonlyArray<readonly [number, number]> = [[3,1],[9,1]];

export function Mascot({ state = 'idle', size = 'md', showBubble, bubbleText }: MascotProps) {
  const px = PX[size];

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
        {/* 12×8 grid letterboxed inside the square footprint */}
        <svg viewBox="0 0 12 8" width={px} height={px} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
          {BODY.map(([c, r]) => (
            <rect key={`b${c}-${r}`} x={c} y={r} width={1} height={1} fill={ORANGE} />
          ))}
          {EYES.map(([c, r]) =>
            state === 'correct' ? (
              // happy squint — a short bar at the bottom of the eye cell
              <rect key={`e${c}-${r}`} x={c} y={r + 0.5} width={1} height={0.3} fill={EYE} />
            ) : (
              <rect key={`e${c}-${r}`} x={c} y={r} width={1} height={1} fill={EYE} />
            )
          )}
        </svg>
      </motion.div>
    </div>
  );
}
