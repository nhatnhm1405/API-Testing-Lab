import { Zap, Menu, Code2 } from "lucide-react";
import { GitHubLink } from "./GitHubLink";
import { useIsMobile } from "./ui/use-mobile";

interface NavBarProps {
  streak?: number;
  xp?: number;
  onMenu?: () => void;
  onLogoClick?: () => void;
}

export function NavBar({ streak = 15, xp = 340, onMenu, onLogoClick }: NavBarProps) {
  const isMobile = useIsMobile();
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 14px' : '0 24px', height: '60px',
      background: '#FFFFFF', borderBottom: '1.5px solid #F2EFEA',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <button
        onClick={onLogoClick}
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
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: '#F2EFEA', borderRadius: '100px', padding: '5px 12px',
            fontSize: '13px', fontWeight: 600, color: '#6B6A7B', fontFamily: 'var(--atl-font-body)',
          }}>
            <span style={{ color: '#E0A815' }}>✦</span>
            <span>{xp} XP</span>
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

        <GitHubLink variant="icon" />

        <button
          onClick={onMenu}
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
