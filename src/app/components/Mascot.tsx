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

export function Mascot({ state = 'idle', size = 'md', showBubble, bubbleText }: MascotProps) {
  const px = PX[size];
  const id = `m${size}`;

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
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width={px} height={px}>
          <defs>
            <linearGradient id={`${id}b`} x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2BD46B"/><stop offset="1" stopColor="#8FE34A"/>
            </linearGradient>
            <linearGradient id={`${id}s`} x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1FA855"/><stop offset="1" stopColor="#5CC830"/>
            </linearGradient>
            <radialGradient id={`${id}g`} cx="35%" cy="28%" r="48%">
              <stop stopColor="rgba(255,255,255,0.55)"/><stop offset="1" stopColor="rgba(255,255,255,0)"/>
            </radialGradient>
            <filter id={`${id}f`} x="-20%" y="-10%" width="140%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1C1B2A" floodOpacity="0.16"/>
            </filter>
          </defs>

          {/* Body */}
          <rect x="8" y="5" width="64" height="58" rx="18" fill={`url(#${id}b)`} filter={`url(#${id}f)`}/>
          {/* Gloss */}
          <ellipse cx="32" cy="20" rx="16" ry="9" fill={`url(#${id}g)`} transform="rotate(-10 32 20)"/>
          {/* Screen emblem */}
          <rect x="24" y="22" width="32" height="26" rx="7" fill="#0D2010" opacity="0.25"/>

          {/* Eyes */}
          <circle cx="30" cy="37" r="6" fill="white"/>
          <circle cx="50" cy="37" r="6" fill="white"/>
          {state === 'wrong' ? (
            <>
              <path d="M27 34 L33 40" stroke="#1C1B2A" strokeWidth="2.8" strokeLinecap="round"/>
              <path d="M33 34 L27 40" stroke="#1C1B2A" strokeWidth="2.8" strokeLinecap="round"/>
              <path d="M47 34 L53 40" stroke="#1C1B2A" strokeWidth="2.8" strokeLinecap="round"/>
              <path d="M53 34 L47 40" stroke="#1C1B2A" strokeWidth="2.8" strokeLinecap="round"/>
            </>
          ) : (
            <>
              <circle cx="31" cy="38" r="3" fill="#1C1B2A"/>
              <circle cx="51" cy="38" r="3" fill="#1C1B2A"/>
              <circle cx="32.5" cy="36.5" r="1.2" fill="white"/>
              <circle cx="52.5" cy="36.5" r="1.2" fill="white"/>
            </>
          )}

          {/* Mouth */}
          {state === 'correct'
            ? <path d="M27 51 Q40 62 53 51" stroke="#1C1B2A" strokeWidth="3" strokeLinecap="round" fill="none"/>
            : state === 'wrong'
            ? <path d="M31 55 Q40 49 49 55" stroke="#1C1B2A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            : <path d="M29 51 Q40 59 51 51" stroke="#1C1B2A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          }

          {/* Legs */}
          <rect x="17" y="61" width="20" height="10" rx="5" fill={`url(#${id}s)`}/>
          <rect x="43" y="61" width="20" height="10" rx="5" fill={`url(#${id}s)`}/>
          <rect x="13" y="69" width="54" height="5" rx="2.5" fill="#197840" opacity="0.45"/>
        </svg>
      </motion.div>
    </div>
  );
}
