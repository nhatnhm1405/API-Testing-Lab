import { motion } from "motion/react";
import { ReactNode } from "react";

type FrameState = 'default' | 'correct' | 'wrong';

interface FocusFrameProps {
  children: ReactNode;
  state?: FrameState;
}

export function FocusFrame({ children, state = 'default' }: FocusFrameProps) {
  const styles = {
    correct: { border: '2px solid #22C55E', boxShadow: '0 0 0 6px rgba(34,197,94,.12), 0 1px 2px rgba(28,27,42,.05), 0 16px 48px rgba(28,27,42,.08)' },
    wrong:   { border: '2px solid #F43F5E', boxShadow: '0 0 0 6px rgba(244,63,94,.1), 0 1px 2px rgba(28,27,42,.05), 0 16px 48px rgba(28,27,42,.08)' },
    default: { border: '1.5px solid #ECE8E1', boxShadow: '0 1px 2px rgba(28,27,42,.05), 0 16px 48px rgba(28,27,42,.07)' },
  };
  const { border, boxShadow } = styles[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, border, boxShadow }}
      transition={{
        opacity: { duration: 0.3 }, y: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
        border: { duration: 0.25 }, boxShadow: { duration: 0.3 },
      }}
      style={{ background: '#FFF', borderRadius: '24px', padding: '32px', width: '100%', boxSizing: 'border-box' }}
    >
      {children}
    </motion.div>
  );
}
