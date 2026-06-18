import { motion, AnimatePresence } from "motion/react";
import { X, Lightbulb } from "lucide-react";
import { TactileButton } from "./TactileButton";

interface WhyModalProps {
  isOpen: boolean;
  explanation: string;
  onClose: () => void;
  onContinue: () => void;
}

export function WhyModal({ isOpen, explanation, onClose, onContinue }: WhyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(28,27,42,0.45)',
              backdropFilter: 'blur(4px)', zIndex: 100,
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 101, width: '90%', maxWidth: '480px',
              background: '#FFF', borderRadius: '24px',
              boxShadow: '0 2px 4px rgba(28,27,42,.06), 0 24px 64px rgba(28,27,42,.18)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lightbulb size={18} color="#D97706"/>
                </div>
                <span style={{ fontFamily: 'var(--atl-font-display)', fontWeight: 700, fontSize: '18px', color: '#1C1B2A' }}>
                  Explanation
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, border: 'none', background: '#F2EFEA',
                  borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6B6A7B', transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#ECE8E1')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F2EFEA')}
              >
                <X size={16} strokeWidth={2.5}/>
              </button>
            </div>

            <div style={{ height: '1px', background: '#F2EFEA', margin: '16px 24px' }}/>

            <div style={{ padding: '0 24px 24px' }}>
              {/* Mini concept chip */}
              <div style={{
                background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
                borderRadius: '14px', padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: 38, height: 38, flexShrink: 0,
                  background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                </div>
                <p style={{
                  fontFamily: 'var(--atl-font-body)', fontSize: '13px',
                  fontWeight: 500, color: '#3730A3', margin: 0, lineHeight: 1.5,
                }}>
                  Think of this as a conversation between computers!
                </p>
              </div>

              <p style={{
                fontFamily: 'var(--atl-font-body)', fontSize: '15px',
                color: '#1C1B2A', lineHeight: 1.7, margin: '0 0 24px', fontWeight: 400,
              }}>
                {explanation}
              </p>

              <TactileButton variant="continue" fullWidth onClick={onContinue}>
                Continue
              </TactileButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
