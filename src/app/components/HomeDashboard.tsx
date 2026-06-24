import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronRight, AlertCircle, Check, Zap, FlaskConical, ListChecks } from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import { MODULES, USER_NAME, USER_STREAK, getCurrentModule } from "../data/courseData";

// Deck carousel: chosen card slides aside & recedes back; the next card rises
// from behind on the opposite side to the front.
const deckVariants = {
  enter:  (d: number) => ({ x: d > 0 ? 64 : -64, scale: 0.92, opacity: 0 }),
  center: { x: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 30 } },
  exit:   (d: number) => ({ x: d > 0 ? -64 : 64, scale: 0.92, opacity: 0, transition: { duration: 0.26, ease: 'easeIn' } }),
};

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator' | 'review';

interface HomeDashboardProps {
  onNavigate: (v: View) => void;
  onOpenModulePath: (moduleIdx: number) => void;
  completedLessons: Set<string>;
  xp: number;
  mistakes: Set<string>;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FILLED = [true, true, true, true, true, false, false];

// featured selection: -1 = Module 0 (Phở), 0..3 = MODULES index
const PHO = -1;

export function HomeDashboard({ onNavigate, onOpenModulePath, completedLessons, xp, mistakes }: HomeDashboardProps) {
  const isMobile = useIsMobile();
  const { index: currentIdx } = getCurrentModule(completedLessons);
  const started = MODULES.some(m => m.lessons.some(l => completedLessons.has(l.id)));
  const [featured, setFeatured] = useState<number>(started ? currentIdx : PHO);
  const [dir, setDir] = useState(0);
  const selectFeatured = (target: number) => {
    if (target === featured) return;
    setDir(target > featured ? 1 : -1);
    setFeatured(target);
  };

  const openModule = (mi: number) => onOpenModulePath(mi);

  // ── pieces ────────────────────────────────────────────────────────
  const welcome = (
    <h2 style={{ fontFamily: 'var(--atl-font-display)', fontSize: isMobile ? '22px' : '24px', fontWeight: 800, color: 'var(--atl-ink)', margin: 0, letterSpacing: '-0.02em' }}>
      Welcome, {USER_NAME}
    </h2>
  );

  const streakCard = (
    <div style={{ background: 'var(--atl-surface)', borderRadius: 22, border: '1.5px solid var(--atl-hairline)', boxShadow: '0 1px 2px rgba(28,27,42,.05), 0 10px 28px rgba(28,27,42,.06)', padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '40px', fontWeight: 800, color: 'var(--atl-ink)', lineHeight: 1 }}>{USER_STREAK}</span>
            <Zap size={26} fill="var(--atl-streak)" color="var(--atl-streak)" strokeWidth={0} />
          </div>
          <p style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--atl-ink-soft)', margin: '8px 0 0' }}>
            day streak — keep it going
          </p>
        </div>
        <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 700, color: '#5A700A', background: 'linear-gradient(135deg,#F9FCE4,#F0FAB8)', border: '1.5px solid #D9EF6A', borderRadius: 100, padding: '5px 11px' }}>✦ {xp} XP</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {DAYS.map((d, i) => {
          const today = i === 4;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: '100%', aspectRatio: '1', maxWidth: 30, borderRadius: '50%', background: FILLED[i] ? (today ? 'linear-gradient(135deg,#B9E534,#8DC21A)' : '#EAF5C3') : 'var(--atl-sunken)', border: today ? '2px solid #A0C828' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {FILLED[i] && <Zap size={11} fill={today ? '#fff' : '#8DC21A'} color={today ? '#fff' : '#8DC21A'} strokeWidth={0} />}
              </div>
              <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '10px', fontWeight: 700, color: today ? '#5A700A' : 'var(--atl-ink-faint)' }}>{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const secondary = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <SecondaryTile icon={<ListChecks size={18} color="#fff" strokeWidth={2.4} />} grad="linear-gradient(135deg,#8B5CF6,#A78BFA)" title="Quiz" badge="Soon" />
      <SecondaryTile icon={<FlaskConical size={18} color="#fff" strokeWidth={2.4} />} grad="linear-gradient(135deg,#10B981,#34D399)" title="Lab" onClick={() => onNavigate('simulator')} />
    </div>
  );

  const mistakesAlert = mistakes.size > 0 && (
    <motion.button
      whileHover={{ x: 2 }} onClick={() => onNavigate('review')}
      style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer', background: 'var(--atl-error-bg)', border: '1.5px solid #FECDD3', borderRadius: 14, padding: '12px 16px', width: '100%' }}>
      <AlertCircle size={18} color="var(--atl-error)" strokeWidth={2.4} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--atl-ink)' }}>
        Review {mistakes.size} mistake{mistakes.size === 1 ? '' : 's'}
      </span>
      <ChevronRight size={16} color="#E11D48" style={{ flexShrink: 0 }} />
    </motion.button>
  );

  const jumpHeader = (
    <h2 style={{ fontFamily: 'var(--atl-font-display)', fontSize: isMobile ? '22px' : '24px', fontWeight: 800, color: 'var(--atl-ink)', margin: 0, letterSpacing: '-0.02em' }}>
      {featured === PHO ? 'Start here' : 'Jump back in'}
    </h2>
  );

  const featuredCard = (
    <FeaturedCard
      featured={featured} dir={dir} isMobile={isMobile} completedLessons={completedLessons}
      onStart={() => featured === PHO ? onNavigate('diagrams') : openModule(featured)}
    />
  );

  const tiles = (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, marginTop: 10 }}>
      <ModuleTile selected={featured === PHO} onClick={() => selectFeatured(PHO)} grad="linear-gradient(135deg,#F97316,#FB923C)" emblem="🍜" />
      {MODULES.map((m, mi) => (
        <ModuleTile key={m.id} selected={featured === mi} onClick={() => selectFeatured(mi)}
          grad={`linear-gradient(135deg,${m.nodeColor[0]},${m.nodeColor[1]})`} emblem={`${mi + 1}`}
          done={m.lessons.every(l => completedLessons.has(l.id))} />
      ))}
    </div>
  );

  // ── layout ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--atl-canvas)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {welcome}
          {jumpHeader}
          {featuredCard}
          {tiles}
          {streakCard}
          {secondary}
          {mistakesAlert}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--atl-canvas)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 24px 56px', display: 'grid', gridTemplateColumns: '330px 1fr', gap: 32, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {welcome}
          {streakCard}
          {secondary}
          {mistakesAlert}
        </div>
        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {jumpHeader}
          {featuredCard}
          {tiles}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Featured card — Brilliant "Jump back in" style, warm-paper light.
   Stacked-card depth, illustration, sub-lesson progress rows, big CTA.
   ──────────────────────────────────────────────────────────────────── */
function FeaturedCard({ featured, dir, isMobile, completedLessons, onStart }: {
  featured: number; dir: number; isMobile: boolean; completedLessons: Set<string>; onStart: () => void;
}) {
  const isPho = featured === -1;
  const mod = isPho ? null : MODULES[featured];
  const accent = isPho ? '#F97316' : mod!.accent;
  const accent2 = isPho ? '#FB923C' : mod!.nodeColor[1];

  const eyebrow = isPho ? 'Module 0 · Introduction' : `Module ${featured + 1}`;
  const title = isPho ? 'The Phở Protocol' : mod!.title;

  // sub-steps shown inside the card
  const steps = isPho
    ? [{ id: 's1', text: 'The story', done: false }, { id: 's2', text: 'Be the waiter', done: false }]
    : mod!.lessons.slice(0, 3).map(l => ({ id: l.id, text: l.title, done: completedLessons.has(l.id) }));
  const firstUndone = steps.findIndex(s => !s.done);

  const ctaLabel = isPho
    ? 'Start here'
    : (mod!.lessons.some(l => completedLessons.has(l.id)) ? 'Continue' : 'Start');

  // Horizontal deck: the previous/next module cards peek out on the sides.
  // First item (Phở) → cards stacked on the right; last → on the left.
  const order = [-1, 0, 1, 2, 3];
  const pos = order.indexOf(featured);
  const accentOf = (f: number) => (f === -1 ? '#F97316' : MODULES[f].accent);
  const sideGhost = (key: string, side: 'left' | 'right', far: boolean, hint: string) => {
    const inset = far ? 20 : 12;
    const out = far ? 36 : 22;   // how far it peeks past the front card
    const into = far ? 56 : 34;  // how far it tucks behind the front card
    const horiz = side === 'right' ? { left: into, right: -out } : { right: into, left: -out };
    return <div key={key} style={{ position: 'absolute', top: inset, bottom: inset, borderRadius: 24, background: 'var(--atl-surface)', border: `1.5px solid ${hint}45`, boxShadow: '0 10px 26px rgba(28,27,42,.06)', opacity: far ? .5 : .85, zIndex: 0, ...horiz }} />;
  };
  const ghosts = [
    pos >= 2                 && sideGhost('lf', 'left',  true,  accentOf(order[pos - 2])),
    pos >= 1                 && sideGhost('ln', 'left',  false, accentOf(order[pos - 1])),
    pos <= order.length - 3  && sideGhost('rf', 'right', true,  accentOf(order[pos + 2])),
    pos <= order.length - 2  && sideGhost('rn', 'right', false, accentOf(order[pos + 1])),
  ];

  return (
    <div style={{ position: 'relative' }}>
      {ghosts}
      <AnimatePresence custom={dir} mode="popLayout" initial={false}>
        <motion.div
          key={featured} custom={dir} variants={deckVariants} initial="enter" animate="center" exit="exit"
          style={{
            position: 'relative', zIndex: 1, overflow: 'hidden', borderRadius: 24,
            display: 'flex', flexDirection: 'column', minHeight: isMobile ? 460 : 492,
            border: `1.5px solid ${isPho ? '#F8C99B' : 'var(--atl-hairline)'}`,
            background: isPho ? 'linear-gradient(140deg,#FFF3E4 0%,#FFE7CE 50%,#FFEFDB 100%)' : 'var(--atl-surface)',
            boxShadow: '0 2px 8px rgba(28,27,42,.05), 0 22px 56px rgba(28,27,42,.12)',
            padding: isMobile ? 22 : 28,
          }}>
        {/* eyebrow + title */}
        <div style={{ textAlign: 'center', marginBottom: isPho ? 10 : 18 }}>
          <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '11px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: accent }}>{eyebrow}</span>
          <h3 style={{ fontFamily: 'var(--atl-font-display)', fontSize: isPho ? (isMobile ? '32px' : '42px') : (isMobile ? '24px' : '28px'), fontWeight: 800, color: isPho ? '#7C2D12' : 'var(--atl-ink)', margin: '6px 0 0', letterSpacing: '-0.03em', lineHeight: 1.05, textShadow: isPho ? '0 2px 0 rgba(255,255,255,.4)' : undefined }}>{title}</h3>
        </div>

        {/* illustration */}
        {isPho
          ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, margin: '4px 0 18px' }}>
              <motion.img src="/pho-bowl.png" alt="Bowl of phở"
                animate={{ y: [0, -7, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 188, height: 188, objectFit: 'contain', filter: 'drop-shadow(0 14px 22px rgba(124,45,18,.28))' }} />
            </div>
          )
          : (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 22px' }}>
              <div style={{ width: 116, height: 116, borderRadius: 28, background: `linear-gradient(140deg,${accent},${accent2})`, boxShadow: `inset 0 2px 0 rgba(255,255,255,.3), 0 16px 34px ${accent}45`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '52px', fontWeight: 800, color: '#fff' }}>{featured + 1}</span>
              </div>
            </div>
          )}

        {/* sub-step rows (skipped for the minimal Phở intro card) */}
        {!isPho && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
            {steps.map((s, i) => {
              const isCurrent = i === firstUndone;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.done ? accent : isCurrent ? '#fff' : 'var(--atl-sunken)',
                    border: isCurrent ? `2.5px solid ${accent}` : s.done ? 'none' : `2px solid var(--atl-hairline)`,
                    boxShadow: isCurrent ? `0 0 0 4px ${accent}22` : 'none' }}>
                    {s.done && <Check size={14} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ flex: 1, fontFamily: 'var(--atl-font-body)', fontSize: '15px', fontWeight: s.done || isCurrent ? 700 : 600, color: s.done ? 'var(--atl-ink-soft)' : isCurrent ? 'var(--atl-ink)' : 'var(--atl-ink-faint)' }}>{s.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* big CTA — pinned to the bottom so every card is the same height */}
        <div style={{ marginTop: 'auto' }}>
          <BigButton accent={accent} accent2={accent2} onClick={onStart}>{ctaLabel}</BigButton>
        </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function BigButton({ children, accent, accent2, onClick }: { children: React.ReactNode; accent: string; accent2: string; onClick: () => void }) {
  // derive a darker "ledge" by overlaying; keep it simple with a fixed dark tint
  const rest = `inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 0 rgba(0,0,0,0.18), 0 10px 26px ${accent}55`;
  const press = `inset 0 1px 0 rgba(255,255,255,0.15), 0 0px 0 rgba(0,0,0,0.18), 0 4px 10px ${accent}44`;
  return (
    <motion.button
      initial="rest" whileHover="hover" whileTap="press"
      variants={{ rest: { y: 0, boxShadow: rest, filter: 'brightness(1)' }, hover: { y: -1, boxShadow: rest, filter: 'brightness(1.05)' }, press: { y: 4, boxShadow: press, filter: 'brightness(.97)', transition: { duration: .08 } } }}
      transition={{ type: 'spring', stiffness: 600, damping: 32 }}
      onClick={onClick}
      style={{ width: '100%', height: 56, borderRadius: 16, border: 'none', cursor: 'pointer',
        background: `linear-gradient(135deg,${accent},${accent2})`, color: '#fff',
        fontFamily: 'var(--atl-font-body)', fontSize: '17px', fontWeight: 800, letterSpacing: '.01em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {children} <ArrowRight size={19} />
    </motion.button>
  );
}

/* Client → Server flow with a packet that travels out (request) and back (response). */
function FlowPreview() {
  const Node = ({ label, sub, grad }: { label: string; sub: string; grad: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0 }}>
      <div style={{ width: 54, height: 54, borderRadius: 17, background: grad, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 8px 18px rgba(124,45,18,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '20px', fontWeight: 800, color: '#fff' }}>{label[0]}</span>
      </div>
      <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
        <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 800, color: '#7C2D12' }}>{label}</div>
        <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '10px', fontWeight: 600, color: '#B47C50' }}>{sub}</div>
      </div>
    </div>
  );
  return (
    <div style={{ margin: '4px 0 20px', background: 'rgba(255,255,255,.55)', border: '1.5px solid #FBD9B9', borderRadius: 20, padding: '20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
      <Node label="Client" sub="waiter" grad="linear-gradient(135deg,#2E5BFF,#5B7BFF)" />
      <div style={{ position: 'relative', flex: 1, height: 54, display: 'flex', alignItems: 'center', margin: '0 4px' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, transform: 'translateY(-50%)', background: 'repeating-linear-gradient(90deg,#F8C99B 0 6px,transparent 6px 12px)', borderRadius: 100 }} />
        <motion.div aria-hidden
          animate={{ left: ['2%', '88%', '88%', '2%', '2%'], background: ['#F97316', '#F97316', '#22C55E', '#22C55E', '#F97316'] }}
          transition={{ duration: 3.2, times: [0, .35, .5, .85, 1], repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '50%', width: 14, height: 14, borderRadius: '50%', transform: 'translateY(-50%)', boxShadow: '0 2px 8px rgba(124,45,18,.35)' }} />
      </div>
      <Node label="Server" sub="kitchen" grad="linear-gradient(135deg,#F97316,#FB923C)" />
    </div>
  );
}

/* small module selector tile (Brilliant's tile row) */
function ModuleTile({ selected, onClick, grad, emblem, done }: { selected: boolean; onClick: () => void; grad: string; emblem: string; done?: boolean }) {
  return (
    <motion.button whileHover={{ y: -3 }} whileTap={{ scale: .95 }} onClick={onClick}
      style={{ position: 'relative', flexShrink: 0, width: 64, height: 64, borderRadius: 18, cursor: 'pointer',
        background: 'var(--atl-surface)', border: `2px solid ${selected ? 'var(--atl-ink)' : 'var(--atl-hairline)'}`,
        boxShadow: selected ? '0 6px 16px rgba(28,27,42,.14)' : '0 2px 6px rgba(28,27,42,.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, transition: 'border-color .15s' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 12, background: grad, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--atl-font-display)', fontSize: emblem.length > 1 ? 24 : 18, fontWeight: 800, color: '#fff' }}>
        {emblem}
      </div>
      {done && (
        <div style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: '50%', background: 'var(--atl-success)', border: '2px solid var(--atl-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={11} color="#fff" strokeWidth={3.5} />
        </div>
      )}
    </motion.button>
  );
}

/* compact secondary entry (Quiz / Lab) */
function SecondaryTile({ icon, grad, title, badge, onClick }: { icon: React.ReactNode; grad: string; title: string; badge?: string; onClick?: () => void }) {
  const disabled = !onClick;
  return (
    <motion.button whileHover={disabled ? {} : { y: -3 }} whileTap={disabled ? {} : { scale: .97 }} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: disabled ? 'default' : 'pointer',
        background: 'var(--atl-surface)', border: '1.5px solid var(--atl-hairline)', borderRadius: 16, padding: '14px 14px',
        boxShadow: '0 1px 2px rgba(28,27,42,.05), 0 6px 14px rgba(28,27,42,.05)', opacity: disabled ? .72 : 1 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: disabled ? '#D9D5E0' : grad, boxShadow: disabled ? 'none' : 'inset 0 1px 0 rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--atl-ink)', letterSpacing: '-0.01em' }}>{title}</span>
          {badge && <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '9px', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8B5CF6', background: '#F3EFFF', border: '1.5px solid #E4D9FF', borderRadius: 100, padding: '2px 7px' }}>{badge}</span>}
        </div>
      </div>
    </motion.button>
  );
}
