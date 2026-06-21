import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { ReactNode } from "react";
import { playClick } from "../lib/sound";

export type OptionState = 'default' | 'selected' | 'correct' | 'wrong' | 'correct-unselected';

interface OptionCardProps {
  index: number;
  children: ReactNode;
  state?: OptionState;
  onClick?: () => void;
  disabled?: boolean;
  // Suppress the built-in click blip when the parent plays its own outcome sound.
  silent?: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];

const S: Record<OptionState, { border: string; bg: string; badgeBg: string; badgeText: string; shadow: string }> = {
  'default':           { border: '1.5px solid #ECE8E1', bg: '#FFF', badgeBg: '#F2EFEA', badgeText: '#1C1B2A', shadow: '0 1px 2px rgba(28,27,42,.05), 0 6px 18px rgba(28,27,42,.06)' },
  'selected':          { border: '2px solid #2E5BFF',   bg: 'linear-gradient(135deg,rgba(46,91,255,.04),rgba(91,123,255,.07))', badgeBg: 'linear-gradient(135deg,#2E5BFF,#5B7BFF)', badgeText: '#fff', shadow: '0 0 0 3px rgba(46,91,255,.14), 0 6px 18px rgba(46,91,255,.12)' },
  'correct':           { border: '2px solid #22C55E',   bg: '#ECFDF3', badgeBg: '#22C55E', badgeText: '#fff', shadow: '0 0 0 3px rgba(34,197,94,.18), 0 6px 18px rgba(34,197,94,.14)' },
  'wrong':             { border: '2px solid #F43F5E',   bg: '#FFF1F2', badgeBg: '#F43F5E', badgeText: '#fff', shadow: '0 0 0 3px rgba(244,63,94,.14), 0 6px 18px rgba(244,63,94,.10)' },
  'correct-unselected':{ border: '2px solid #22C55E',   bg: '#ECFDF3', badgeBg: '#22C55E', badgeText: '#fff', shadow: '0 0 0 2px rgba(34,197,94,.12), 0 4px 12px rgba(34,197,94,.1)' },
};

function Badge({ letter, state, bg, color }: { letter: string; state: OptionState; bg: string; color: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontWeight: 700, fontSize: '14px',
      fontFamily: 'var(--atl-font-body)',
    }}>
      {(state === 'correct' || state === 'correct-unselected')
        ? <Check size={18} strokeWidth={3}/>
        : state === 'wrong'
        ? <X size={18} strokeWidth={3}/>
        : letter
      }
    </div>
  );
}

export function OptionCard({ index, children, state = 'default', onClick, disabled, silent }: OptionCardProps) {
  const s = S[state];
  const letter = LETTERS[index] ?? String.fromCharCode(65 + index);
  const interactive = !disabled && (state === 'default' || state === 'selected');

  return (
    <motion.div
      animate={
        state === 'wrong'    ? { x: [0,-8,8,-5,5,-2,2,0], transition: { duration: 0.5 } } :
        state === 'correct'  ? { scale: [1,1.025,1], transition: { duration: 0.3, ease: 'easeOut' } } : {}
      }
      whileHover={interactive ? { y: -2, boxShadow: '0 0 0 2px rgba(46,91,255,.2), 0 8px 24px rgba(46,91,255,.1)', transition: { duration: 0.15 } } : {}}
      whileTap={interactive ? { scale: 0.99, transition: { duration: 0.08 } } : {}}
      onClick={interactive ? () => { if (!silent) playClick(); onClick?.(); } : undefined}
      style={{
        background: s.bg, border: s.border, borderRadius: '16px',
        boxShadow: s.shadow, padding: '14px 16px', minHeight: '64px',
        display: 'flex', alignItems: 'center', gap: '14px',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        userSelect: 'none', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Badge letter={letter} state={state} bg={s.badgeBg} color={s.badgeText}/>
      <span style={{
        fontFamily: 'var(--atl-font-body)', fontSize: '16px',
        fontWeight: 500, color: '#1C1B2A', lineHeight: 1.4, flex: 1,
      }}>
        {children}
      </span>
    </motion.div>
  );
}
