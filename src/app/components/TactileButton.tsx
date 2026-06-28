import { motion } from "motion/react";
import { ReactNode } from "react";
import { playSound } from "../lib/sound";

export type ButtonVariant = 'primary' | 'check' | 'continue' | 'disabled' | 'danger' | 'ghost';

interface TactileButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

const CONFIGS: Record<string, { bg: string; ledge: string; ambient: string; text: string }> = {
  primary: { bg: 'linear-gradient(135deg, #2E5BFF 0%, #5B7BFF 100%)', ledge: '#1E3FCC', ambient: 'rgba(46,91,255,0.28)', text: '#fff' },
  check:   { bg: '#1C1B2A', ledge: 'rgba(0,0,0,0.5)', ambient: 'rgba(28,27,42,0.22)', text: '#fff' },
  continue:{ bg: 'linear-gradient(135deg, #2BD46B 0%, #8FE34A 100%)', ledge: '#1FA854', ambient: 'rgba(43,212,107,0.28)', text: '#fff' },
  disabled:{ bg: '#EDE9E2', ledge: 'transparent', ambient: 'transparent', text: '#A7A3AD' },
  danger:  { bg: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)', ledge: '#C1132F', ambient: 'rgba(244,63,94,0.28)', text: '#fff' },
  ghost:   { bg: 'rgba(28,27,42,0.07)', ledge: 'rgba(28,27,42,0.12)', ambient: 'rgba(28,27,42,0.05)', text: '#1C1B2A' },
};

const SIZES = {
  sm: { h: '40px', px: '16px', fs: '13px' },
  md: { h: '48px', px: '24px', fs: '15px' },
  lg: { h: '56px', px: '32px', fs: '16px' },
};

export function TactileButton({ children, variant = 'primary', onClick, disabled = false, fullWidth = false, size = 'lg', icon }: TactileButtonProps) {
  const isDisabled = disabled || variant === 'disabled';
  const cfg = CONFIGS[isDisabled ? 'disabled' : variant];
  const sz = SIZES[size];

  const restShadow  = isDisabled ? 'none' : `inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 ${cfg.ledge}, 0 8px 24px ${cfg.ambient}`;
  const pressShadow = `inset 0 1px 0 rgba(255,255,255,0.1), 0 0px 0 ${cfg.ledge}, 0 3px 8px ${cfg.ambient}`;

  return (
    <motion.button
      initial="rest"
      whileHover={isDisabled ? 'rest' : 'hover'}
      whileTap={isDisabled ? 'rest' : 'press'}
      variants={{
        rest:  { y: 0, boxShadow: restShadow,  filter: 'brightness(1)' },
        hover: { y: -1, boxShadow: restShadow,  filter: 'brightness(1.05)' },
        press: { y: 4,  boxShadow: pressShadow, filter: 'brightness(0.96)', transition: { duration: 0.08 } },
      }}
      transition={{ type: 'spring', stiffness: 600, damping: 32 }}
      onPointerDown={isDisabled ? undefined : () => playSound('tap')}
      onClick={isDisabled ? undefined : onClick}
      style={{
        background: cfg.bg, color: cfg.text,
        width: fullWidth ? '100%' : undefined,
        height: sz.h, paddingLeft: sz.px, paddingRight: sz.px, fontSize: sz.fs,
        borderRadius: '100px', border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--atl-font-body)', fontWeight: 700, letterSpacing: '0.01em',
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap',
        userSelect: 'none', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
      }}
    >
      {!isDisabled && (
        <span style={{
          position: 'absolute', top: 0, left: '15%', right: '15%',
          height: '1px', background: 'rgba(255,255,255,0.3)',
          borderRadius: '100px', pointerEvents: 'none',
        }} />
      )}
      {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}
