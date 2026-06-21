import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Menu, Code2, Volume2, VolumeX } from "lucide-react";
import { GitHubLink } from "./GitHubLink";
import { useIsMobile } from "./ui/use-mobile";
import { isMuted, toggleMuted, playClick } from "../lib/sound";

interface NavBarProps {
  streak?: number;
  xp?: number;
  combo?: number;
  onMenu?: () => void;
  onLogoClick?: () => void;
}

export function NavBar({ streak = 15, xp = 340, combo = 0, onMenu, onLogoClick }: NavBarProps) {
  const isMobile = useIsMobile();
  const [muted, setMutedState] = useState(isMuted());

  // Floating "+N" when XP increases.
  const [floatXp, setFloatXp] = useState<number | null>(null);
  const prevXp = useRef(xp);
  useEffect(() => {
    if (xp > prevXp.current) {
      setFloatXp(xp - prevXp.current);
      const t = setTimeout(() => setFloatXp(null), 1100);
      prevXp.current = xp;
      return () => clearTimeout(t);
    }
    prevXp.current = xp;
  }, [xp]);

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 14px' : '0 24px', height: '60px',
      background: '#FFFFFF', borderBottom: '1.5px solid #F2EFEA',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <button
        onClick={() => { playClick(); onLogoClick?.(); }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg,#2E5BFF,#5B7BFF)',
          borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(46,91,255,.3)',
        }}>
          <Code2 size={16} color="white" strokeWidth={2.5}/>
        </div>
        <span style={{ fontFamily: 'var(--atl-font-display)', fontWeight: 800, fontSize: isMobile ? '15px' : '17px', color: '#1C1B2A', letterSpacing: '-0.02em' }}>
          API Testing Lab
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
        {/* Combo badge — consecutive correct answers */}
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div key="combo"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(135deg,#FFEDD5,#FED7AA)', border: '1.5px solid #FDBA74', borderRadius: '100px', padding: '5px 10px' }}>
              <span style={{ fontSize: '13px' }}>🔥</span>
              <motion.span key={combo} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                style={{ fontSize: '13px', fontWeight: 800, color: '#C2410C', fontFamily: 'var(--atl-font-body)' }}>
                x{combo}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isMobile && (
          <div style={{ position: 'relative' }}>
            <motion.div key={xp} initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: '#F2EFEA', borderRadius: '100px', padding: '5px 12px',
                fontSize: '13px', fontWeight: 600, color: '#6B6A7B', fontFamily: 'var(--atl-font-body)',
              }}>
              <span style={{ color: '#E0A815' }}>✦</span>
              <span>{xp} XP</span>
            </motion.div>
            <AnimatePresence>
              {floatXp !== null && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: -22 }} exit={{ opacity: 0 }}
                  transition={{ duration: .5 }}
                  style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 800, color: '#16A34A', pointerEvents: 'none' }}>
                  +{floatXp}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'linear-gradient(135deg,#F9FCE4,#F0FAB8)',
          border: '1.5px solid #D9EF6A', borderRadius: '100px', padding: '5px 12px',
        }}>
          <Zap size={14} fill="#B9E534" color="#B9E534" strokeWidth={0}/>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#5A700A', fontFamily: 'var(--atl-font-body)' }}>{streak}</span>
        </div>

        <button
          onClick={() => { const m = toggleMuted(); setMutedState(m); if (!m) playClick(); }}
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          style={{
            width: 36, height: 36, border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: muted ? '#C4BDB0' : '#6B6A7B', transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F2EFEA')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {muted ? <VolumeX size={18} strokeWidth={2}/> : <Volume2 size={18} strokeWidth={2}/>}
        </button>

        <GitHubLink variant="icon" />

        <button
          onClick={() => { playClick(); onMenu?.(); }}
          style={{
            width: 36, height: 36, border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B6A7B', transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F2EFEA')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Menu size={20} strokeWidth={2}/>
        </button>
      </div>
    </nav>
  );
}
