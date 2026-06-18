import { X, Zap } from "lucide-react";
import { motion } from "motion/react";

interface ProgressBarProps {
  total: number;
  current: number;
  streak: number;
  onClose?: () => void;
}

export function ProgressBar({ total, current, streak, onClose }: ProgressBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '44px' }}>
      <button
        onClick={onClose}
        style={{
          width: 36, height: 36, border: 'none', background: 'transparent',
          cursor: 'pointer', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#A7A3AD', transition: 'background .15s, color .15s', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F2EFEA'; (e.currentTarget as HTMLButtonElement).style.color = '#1C1B2A'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A7A3AD'; }}
      >
        <X size={20} strokeWidth={2.5}/>
      </button>

      <div style={{ flex: 1, display: 'flex', gap: '5px', alignItems: 'center' }}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < current;
          const active  = i === current;
          return (
            <div key={i} style={{
              flex: 1, height: '10px', borderRadius: '100px',
              background: filled ? 'linear-gradient(90deg,#2BD46B,#8FE34A)' : '#ECE8E1',
              overflow: 'hidden', position: 'relative',
            }}>
              {active && (
                <motion.div
                  initial={{ width: '0%' }} animate={{ width: '40%' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    background: 'linear-gradient(90deg,#2BD46B,#8FE34A)',
                    borderRadius: '100px', opacity: 0.5,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        background: '#FAF2D0', border: '1.5px solid #F0E090',
        borderRadius: '100px', padding: '4px 10px', flexShrink: 0,
      }}>
        <Zap size={13} fill="#B9E534" color="#B9E534" strokeWidth={0}/>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#7A6A00', fontFamily: 'var(--atl-font-body)', lineHeight: 1 }}>{streak}</span>
      </div>
    </div>
  );
}
