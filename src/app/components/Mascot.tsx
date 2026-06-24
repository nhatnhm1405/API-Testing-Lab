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

// ── Clawd — Claude's friendly mascot ───────────────────────────────
// A rounded little critter in Anthropic's signature orange, with the
// Claude "spark" hovering above. Same props/states as before so it
// drops in everywhere the old pixel critter was used.
export function Mascot({ state = 'idle', size = 'md', showBubble, bubbleText }: MascotProps) {
  const px = PX[size];
  const id = `clawd-${size}`;
  const EYE = '#3A2218';

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
        <svg viewBox="0 0 64 64" width={px} height={px} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-body`} x1="32" y1="14" x2="32" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8956B" />
              <stop offset="0.55" stopColor="#D97757" />
              <stop offset="1" stopColor="#C2613F" />
            </linearGradient>
            <radialGradient id={`${id}-cheek`} cx="0.5" cy="0.5" r="0.5">
              <stop stopColor="#F6A883" stopOpacity="0.9" />
              <stop offset="1" stopColor="#F6A883" stopOpacity="0" />
            </radialGradient>
            <filter id={`${id}-shadow`} x="-30%" y="-20%" width="160%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#C2613F" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* ground shadow */}
          <ellipse cx="32" cy="57" rx="16" ry="3.4" fill="#1C1B2A" opacity="0.12" />

          {/* the Claude spark, hovering above the head */}
          <motion.g
            style={{ transformOrigin: '46px 13px' }}
            animate={state === 'thinking'
              ? { rotate: [0, 360], scale: 1 }
              : state === 'correct'
                ? { rotate: 0, scale: [1, 1.5, 1] }
                : { rotate: 0, scale: [1, 1.15, 1] }}
            transition={state === 'thinking'
              ? { duration: 4, repeat: Infinity, ease: 'linear' }
              : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Spark cx={46} cy={13} r={5} fill="#D97757" />
          </motion.g>

          {/* feet */}
          <rect x="22" y="50" width="8" height="7" rx="3.5" fill="#C2613F" />
          <rect x="34" y="50" width="8" height="7" rx="3.5" fill="#C2613F" />

          {/* arms */}
          <ellipse cx="13.5" cy="38" rx="4" ry="6" fill="#CE6C4B" />
          <ellipse cx="50.5" cy="38" rx="4" ry="6" fill="#CE6C4B" />

          {/* body */}
          <g filter={`url(#${id}-shadow)`}>
            <path
              d="M32 13
                 C20 13 14 21 14 33
                 C14 46 21 53 32 53
                 C43 53 50 46 50 33
                 C50 21 44 13 32 13 Z"
              fill={`url(#${id}-body)`}
            />
          </g>
          {/* soft top highlight */}
          <ellipse cx="26" cy="23" rx="7" ry="4.5" fill="#FFFFFF" opacity="0.18" />

          {/* cheeks */}
          <ellipse cx="22" cy="38" rx="4.5" ry="3" fill={`url(#${id}-cheek)`} />
          <ellipse cx="42" cy="38" rx="4.5" ry="3" fill={`url(#${id}-cheek)`} />

          {/* face */}
          {state === 'correct' ? (
            <g stroke={EYE} strokeWidth={2.6} strokeLinecap="round" fill="none">
              <path d="M21 31 Q25 26 29 31" />
              <path d="M35 31 Q39 26 43 31" />
              <path d="M27 39 Q32 44 37 39" />
            </g>
          ) : state === 'wrong' ? (
            <g stroke={EYE} strokeWidth={2.6} strokeLinecap="round" fill="none">
              <path d="M22 29 L28 35" /><path d="M28 29 L22 35" />
              <path d="M36 29 L42 35" /><path d="M42 29 L36 35" />
              <path d="M27 42 Q32 38 37 42" />
            </g>
          ) : state === 'thinking' ? (
            <>
              <circle cx="25" cy="30" r="2.6" fill={EYE} />
              <circle cx="39" cy="30" r="2.6" fill={EYE} />
              <path d="M28 40 Q32 38 36 40" stroke={EYE} strokeWidth={2.2} strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="25" cy="31" r="3" fill={EYE} />
              <circle cx="39" cy="31" r="3" fill={EYE} />
              {/* eye sparkle */}
              <circle cx="26.1" cy="30" r="0.9" fill="#FFFFFF" />
              <circle cx="40.1" cy="30" r="0.9" fill="#FFFFFF" />
              <path d="M28 39 Q32 42 36 39" stroke={EYE} strokeWidth={2.2} strokeLinecap="round" fill="none" />
            </>
          )}
        </svg>
      </motion.div>
    </div>
  );
}

// The Claude four-point spark / sunburst.
function Spark({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const w = r * 0.42; // waist half-width of each petal
  return (
    <path
      d={`M ${cx} ${cy - r}
          C ${cx + w} ${cy - w}, ${cx + w} ${cy - w}, ${cx + r} ${cy}
          C ${cx + w} ${cy + w}, ${cx + w} ${cy + w}, ${cx} ${cy + r}
          C ${cx - w} ${cy + w}, ${cx - w} ${cy + w}, ${cx - r} ${cy}
          C ${cx - w} ${cy - w}, ${cx - w} ${cy - w}, ${cx} ${cy - r} Z`}
      fill={fill}
    />
  );
}
