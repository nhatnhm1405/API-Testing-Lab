import { motion } from "motion/react";
import { CheckCircle2, Play, ChevronLeft, ArrowRight, RotateCcw, Target } from "lucide-react";
import { Mascot } from "./Mascot";
import { emojify } from "../lib/emoji";
import { useIsMobile } from "./ui/use-mobile";
import { MODULES } from "../data/courseData";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator' | 'review';

interface LearningPathProps {
  onNavigate: (v: View) => void;
  onOpenLesson: (moduleIdx: number, lessonIdx: number) => void;
  completedLessons: Set<string>;
  onRestartModule: (moduleIdx: number) => void;
  moduleIdx: number;
}

type NodeStatus = 'completed' | 'current' | 'upcoming';

export function LearningPath({ onNavigate, onOpenLesson, completedLessons, onRestartModule, moduleIdx }: LearningPathProps) {
  const isMobile = useIsMobile();
  const mod = MODULES[moduleIdx];
  const doneCount = mod.lessons.filter(l => completedLessons.has(l.id)).length;
  const firstUndone = mod.lessons.findIndex(l => !completedLessons.has(l.id));
  const moduleDone = firstUndone === -1;
  const nextIdx = moduleDone ? 0 : firstUndone;
  const totalXP = mod.lessons.reduce((s, l) => s + l.xp, 0);

  // ── summary card (left / top) ─────────────────────────────────────
  const summary = (
    <div style={{ background: 'var(--atl-surface)', borderRadius: 24, border: `1.5px solid ${mod.accent}33`, boxShadow: `0 1px 2px rgba(28,27,42,.05), 0 18px 42px ${mod.accent}22`, padding: 26 }}>
      <div style={{ width: 92, height: 92, borderRadius: 24, background: `linear-gradient(140deg,${mod.nodeColor[0]},${mod.nodeColor[1]})`, boxShadow: `inset 0 2px 0 rgba(255,255,255,.3), 0 14px 30px ${mod.accent}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: '44px', fontWeight: 800, color: '#fff' }}>{moduleIdx + 1}</span>
      </div>
      <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '11px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: mod.accent }}>Module {moduleIdx + 1}</span>
      <h2 style={{ fontFamily: 'var(--atl-font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--atl-ink)', margin: '4px 0 8px', letterSpacing: '-0.025em', lineHeight: 1.1 }}>{mod.title}</h2>
      <p style={{ fontFamily: 'var(--atl-font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--atl-ink-soft)', margin: '0 0 14px', lineHeight: 1.5 }}>{mod.subtitle}</p>
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: `${mod.accent}0D`, border: `1.5px solid ${mod.accent}26`, borderRadius: 13, padding: '11px 13px', margin: '0 0 18px' }}>
        <Target size={15} color={mod.accent} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '10px', fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: mod.accent }}>You'll be able to</div>
          <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--atl-ink)', lineHeight: 1.4, marginTop: 2 }}>{mod.outcome}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Stat value={`${mod.lessons.length}`} label="lessons" />
        <div style={{ width: 1, height: 28, background: 'var(--atl-hairline)' }} />
        <Stat value={`${totalXP}`} label="XP" />
        <div style={{ width: 1, height: 28, background: 'var(--atl-hairline)' }} />
        <Stat value={`${doneCount}/${mod.lessons.length}`} label="done" accent={mod.accent} />
      </div>
      {moduleDone && (
        <button onClick={() => onRestartModule(moduleIdx)}
          style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--atl-sunken)', border: '1.5px solid var(--atl-hairline)', borderRadius: 100, padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--atl-ink-soft)' }}>
          <RotateCcw size={14} /> Restart module
        </button>
      )}
    </div>
  );

  // ── node path (right) ─────────────────────────────────────────────
  const path = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* level pill */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
        style={{ alignSelf: 'stretch', textAlign: 'center', background: `linear-gradient(135deg,${mod.accent}1A,${mod.accent}0A)`, border: `2px solid ${mod.accent}45`, borderRadius: 18, padding: '14px 18px', marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '11px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: mod.accent }}>Level 1</div>
        <div style={{ fontFamily: 'var(--atl-font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--atl-ink)', marginTop: 2, letterSpacing: '-0.02em' }}>{mod.title}</div>
      </motion.div>

      {mod.lessons.map((lesson, li) => {
        const isDone = completedLessons.has(lesson.id);
        const status: NodeStatus = isDone ? 'completed' : li === nextIdx ? 'current' : 'upcoming';
        return (
          <motion.div key={lesson.id} initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: .35, delay: li * .07, type: 'spring', stiffness: 380, damping: 26 }}
            style={{ width: '100%' }}>
            <PathNode status={status} accent={mod.accent} grad={mod.nodeColor} title={lesson.title} index={li}
              total={mod.lessons.length} onClick={() => onOpenLesson(moduleIdx, li)} />
          </motion.div>
        );
      })}
    </div>
  );

  // floating start / continue card
  const startCard = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, delay: .15 }}
      style={{ background: 'var(--atl-surface)', borderRadius: 22, border: '1.5px solid var(--atl-hairline)', boxShadow: '0 2px 8px rgba(28,27,42,.06), 0 18px 44px rgba(28,27,42,.12)', padding: 22 }}>
      <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '11px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--atl-ink-faint)', marginBottom: 4 }}>
        {emojify(moduleDone ? 'Module complete 🎉' : doneCount > 0 ? 'Up next' : 'Begin')}
      </div>
      <h3 style={{ fontFamily: 'var(--atl-font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--atl-ink)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
        {mod.lessons[nextIdx].title}
      </h3>
      <BigButton accent={mod.accent} accent2={mod.nodeColor[1]} onClick={() => onOpenLesson(moduleIdx, nextIdx)}>
        {moduleDone ? 'Review' : doneCount > 0 ? 'Continue' : 'Start'}
      </BigButton>
    </motion.div>
  );

  return (
    <div style={{ minHeight: '100%', background: 'var(--atl-canvas)' }}>
      {/* slim back row */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '16px 16px 0' : '20px 24px 0' }}>
        <button onClick={() => onNavigate('home')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--atl-surface)', border: '1.5px solid var(--atl-hairline)', borderRadius: 100, padding: '8px 14px 8px 10px', cursor: 'pointer', fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--atl-ink-soft)', boxShadow: '0 1px 3px rgba(28,27,42,.05)' }}>
          <ChevronLeft size={16} strokeWidth={2.5} /> Home
        </button>
      </div>

      {isMobile ? (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {summary}
          {path}
          {startCard}
        </div>
      ) : (
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 24px 64px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: 36, alignItems: 'start' }}>
          {/* LEFT — sticky summary */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {summary}
            {startCard}
          </div>
          {/* RIGHT — node path */}
          <div style={{ maxWidth: 440, margin: '0 auto', width: '100%' }}>
            {path}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--atl-font-display)', fontSize: '20px', fontWeight: 800, color: accent ?? 'var(--atl-ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--atl-ink-soft)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

/* one node in the vertical path — candy disc + label, zigzag offset */
function PathNode({ status, accent, grad, title, index, total, onClick }: {
  status: NodeStatus; accent: string; grad: [string, string]; title: string; index: number; total: number; onClick: () => void;
}) {
  const shift = [0, 64, 110, 64][index % 4] - 60; // gentle left-right wander
  const isCurrent = status === 'current';
  const isDone = status === 'completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, transform: `translateX(${shift}px)` }}>
        {isCurrent && <div style={{ marginBottom: -4, zIndex: 2 }}><Mascot state="idle" size="sm" /></div>}

        <motion.button
          whileHover={{ scale: 1.07 }} whileTap={{ scale: .94 }}
          animate={isCurrent ? { y: [0, -4, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } } : {}}
          onClick={onClick}
          style={{
            position: 'relative', width: 78, height: 78, borderRadius: '50%', border: 'none', cursor: 'pointer', outline: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDone || isCurrent ? `linear-gradient(140deg,${grad[0]},${grad[1]})` : 'var(--atl-sunken)',
            boxShadow: isDone ? `inset 0 2px 0 rgba(255,255,255,.35), 0 8px 20px ${accent}45`
              : isCurrent ? `inset 0 2px 0 rgba(255,255,255,.4), 0 12px 28px ${accent}55, 0 0 0 5px ${accent}22`
              : 'inset 0 -3px 6px rgba(28,27,42,.06), 0 4px 10px rgba(28,27,42,.08)',
          }}>
          {(isDone || isCurrent) && <div style={{ position: 'absolute', top: 9, left: '26%', right: '26%', height: 5, borderRadius: 100, background: 'rgba(255,255,255,.55)' }} />}
          <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
            {isDone ? <CheckCircle2 size={30} color="#fff" strokeWidth={2.5} />
              : isCurrent ? <Play size={26} fill="#fff" color="#fff" style={{ marginLeft: 3 }} />
              : <span style={{ fontFamily: 'var(--atl-font-display)', fontSize: 24, fontWeight: 800, color: 'var(--atl-ink-faint)' }}>{index + 1}</span>}
          </span>
        </motion.button>

        <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: isCurrent ? 800 : 600, color: status === 'upcoming' ? 'var(--atl-ink-faint)' : 'var(--atl-ink)', textAlign: 'center', maxWidth: 130, lineHeight: 1.3 }}>
          {title}
        </span>
      </div>

      {index < total - 1 && <div style={{ width: 3, height: 34, borderRadius: 100, background: isDone ? `${accent}66` : 'var(--atl-hairline)', margin: '12px 0' }} />}
    </div>
  );
}

function BigButton({ children, accent, accent2, onClick }: { children: React.ReactNode; accent: string; accent2: string; onClick: () => void }) {
  const rest = `inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 0 rgba(0,0,0,0.18), 0 10px 26px ${accent}55`;
  const press = `inset 0 1px 0 rgba(255,255,255,0.15), 0 0px 0 rgba(0,0,0,0.18), 0 4px 10px ${accent}44`;
  return (
    <motion.button
      initial="rest" whileHover="hover" whileTap="press"
      variants={{ rest: { y: 0, boxShadow: rest, filter: 'brightness(1)' }, hover: { y: -1, boxShadow: rest, filter: 'brightness(1.05)' }, press: { y: 4, boxShadow: press, filter: 'brightness(.97)', transition: { duration: .08 } } }}
      transition={{ type: 'spring', stiffness: 600, damping: 32 }}
      onClick={onClick}
      style={{ width: '100%', height: 54, borderRadius: 16, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${accent},${accent2})`, color: '#fff', fontFamily: 'var(--atl-font-body)', fontSize: '17px', fontWeight: 800, letterSpacing: '.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {children} <ArrowRight size={19} />
    </motion.button>
  );
}
