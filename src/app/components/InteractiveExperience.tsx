import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles, Lightbulb, Check, X } from "lucide-react";
import { TactileButton } from "./TactileButton";
import { Mascot } from "./Mascot";
import { OptionCard, OptionState } from "./OptionCard";
import { ConnectExercise } from "./InteractiveDiagram";
import { useIsMobile } from "./ui/use-mobile";
import type { InteractiveData, ExploreQuery, PredictExperience } from "../data/courseData";

interface Props {
  data: InteractiveData;
  xp: number;
  accent: string;
  onMistake: () => void;
  onComplete: (correct: boolean) => void;
}

type Step = 0 | 1 | 2;
type Phase = 'answering' | 'correct' | 'wrong';

const BRAND = '#2E5BFF';
const STEP_LABELS = ['Experience', 'Concept', 'Check'];

export function InteractiveExperience({ data, xp, accent, onMistake, onComplete }: Props) {
  const [step, setStep] = useState<Step>(0);

  // EXPERIENCE
  const [tried, setTried] = useState<Set<string>>(new Set());

  // CHECK
  const [ready,        setReady]        = useState(false);
  const [checkTrigger, setCheckTrigger] = useState(0);
  const [phase,        setPhase]        = useState<Phase>('answering');
  // Wrong answers don't advance — the learner retries. `attempt` remounts the
  // check so it resets; `revealed` shows the answer + explanation once earned.
  const [wrongCount,   setWrongCount]   = useState(0);
  const [attempt,      setAttempt]      = useState(0);
  const [revealed,     setRevealed]     = useState(false);

  const isCorrect = phase === 'correct';
  const isWrong   = phase === 'wrong';
  const canReveal = wrongCount >= 2;
  // The explanation (and the answer) appear only once earned.
  const showOutcome = isCorrect || revealed;

  const handleCheckResult = (correct: boolean) => {
    if (!correct) { onMistake(); setWrongCount(c => c + 1); }
    setPhase(correct ? 'correct' : 'wrong');
  };

  const goCheck    = () => setCheckTrigger(t => t + 1);
  const tryAgain   = () => { setPhase('answering'); setReady(false); setCheckTrigger(0); setAttempt(a => a + 1); };
  const finish     = () => onComplete(isCorrect);

  const checkHint  = data.check.mode === 'connect'
    ? 'Trace the wire — match the job to the method that performs it.'
    : 'Re-read the statements and pick the one that matches the concept.';

  return (
    <>
      {/* Step indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
        {STEP_LABELS.map((label, i) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'4px 11px 4px 6px', borderRadius:100,
              background: i === step ? `${accent}16` : 'transparent',
              transition:'background .2s',
            }}>
              <span style={{
                width:20, height:20, borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:800,
                background: i < step ? accent : i === step ? accent : '#ECE8E1',
                color: i <= step ? '#fff' : '#A7A3AD',
              }}>{i < step ? '✓' : i + 1}</span>
              <span style={{
                fontFamily:'var(--atl-font-body)', fontSize:'11.5px', fontWeight:700,
                color: i === step ? accent : '#A7A3AD',
                textTransform:'uppercase', letterSpacing:'.04em',
              }}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <span style={{ color:'#D7D3DC', fontSize:'11px' }}>›</span>}
          </div>
        ))}
      </div>

      <div style={{
        background:'#FFF', borderRadius:24, padding:'28px 26px',
        border:'1.5px solid #ECE8E1',
        boxShadow:'0 1px 2px rgba(28,27,42,.05), 0 16px 48px rgba(28,27,42,.07)',
      }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="explore" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }} transition={{ duration:.22 }}>
              {data.explore.predict ? (
                <PredictScene predict={data.explore.predict} ex={data.explore} accent={accent} onTried={id => setTried(prev => new Set(prev).add(id))} />
              ) : (
                <ExploreScene ex={data.explore} accent={accent} onTried={id => setTried(prev => new Set(prev).add(id))} />
              )}
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="insight" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }} transition={{ duration:.22 }}>
              <InsightCard insight={data.insight} accent={accent} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="check" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }} transition={{ duration:.22 }}>
              {data.check.mode === 'connect' ? (
                <ConnectExercise
                  key={attempt}
                  prompt={data.check.prompt}
                  source={data.check.source}
                  sourceEmptyLabel={data.check.sourceEmptyLabel}
                  sourceFilledLabel={data.check.sourceFilledLabel}
                  targets={data.check.targets}
                  correctTargetId={data.check.correctTargetId}
                  reveal={data.check.reveal}
                  checkTrigger={checkTrigger}
                  onReadyChange={setReady}
                  onResult={handleCheckResult}
                  phase={phase}
                  revealed={revealed}
                />
              ) : (
                <ChoiceCheck
                  key={attempt}
                  prompt={data.check.prompt}
                  options={data.check.options}
                  correctIndex={data.check.correctIndex}
                  checkTrigger={checkTrigger}
                  onReadyChange={setReady}
                  onResult={handleCheckResult}
                  phase={phase}
                  revealed={revealed}
                />
              )}

              {/* Explanation — shown once the learner earns it (right or revealed) */}
              <AnimatePresence>
                {showOutcome && (
                  <motion.div key="expl"
                    initial={{ opacity:0, height:0, marginTop:0 }}
                    animate={{ opacity:1, height:'auto', marginTop:22 }}
                    exit={{ opacity:0, height:0, marginTop:0 }}
                    transition={{ duration:.32 }}
                    style={{ overflow:'hidden' }}>
                    <div style={{ display:'flex', gap:12, padding:'15px 16px', background:'#FAF9F7', border:'1px solid #F2EFEA', borderRadius:16 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: isCorrect ? '#DCFCE7' : '#FEF3C7' }}>
                        <Lightbulb size={16} color={isCorrect ? '#16A34A' : '#D97706'} />
                      </div>
                      <div>
                        <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'.06em', color:'#A7A3AD', margin:'0 0 4px' }}>
                          What it means
                        </p>
                        <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'14px', fontWeight:500, color:'#3A3947', lineHeight:1.55, margin:0 }}>
                          {data.check.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom CTA bar ── */}
      <AnimatePresence>
        {step === 2 && phase !== 'answering' ? (
          <motion.div key="feedback"
            initial={{ y:80, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:60, opacity:0 }}
            transition={{ type:'spring', stiffness:400, damping:32 }}
            style={{ position:'fixed', bottom:0, left:0, right:0, background:isCorrect?'#ECFDF3':'#FFF1F2', borderTop:`2px solid ${isCorrect?'#BBF7D0':'#FECDD3'}`, padding:'16px 20px 28px', zIndex:30 }}>
            <div style={{ maxWidth:640, margin:'0 auto', display:'flex', alignItems:'center', gap:16 }}>
              <Mascot state={isCorrect?'correct':'wrong'} size="md" showBubble bubbleText={isCorrect?'Correct! 🎉':revealed?'Here\'s the answer':'Not quite!'}/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'17px', fontWeight:800, color:isCorrect?'#15803D':'#BE123C', margin:'0 0 3px' }}>
                  {isCorrect ? 'Correct!' : revealed ? 'The answer' : 'Not quite!'}
                </p>
                <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:isCorrect?'#166534':'#9F1239', margin:0, fontWeight:500, lineHeight:1.4 }}>
                  {isCorrect ? `+${xp} XP earned!` : revealed ? 'See what it means below, then continue.' : `💡 ${checkHint}`}
                </p>
              </div>
              {isCorrect || revealed ? (
                <TactileButton variant="continue" onClick={finish} size="md">Continue</TactileButton>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                  <TactileButton variant="check" onClick={tryAgain} size="md">Try again</TactileButton>
                  {canReveal && (
                    <button onClick={() => setRevealed(true)}
                      style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:700, color:'#E11D48', textDecoration:'underline', padding:0, whiteSpace:'nowrap' }}>
                      Reveal answer
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="advance"
            initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:20, opacity:0 }}
            transition={{ duration:.2 }}
            style={{ position:'fixed', bottom:0, left:0, right:0, background:'linear-gradient(to top,var(--atl-canvas) 70%,transparent)', padding:'20px 20px 28px', zIndex:30 }}>
            <div style={{ maxWidth:640, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
              <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:600, color:'#A7A3AD' }}>
                {step === 0 ? (tried.size > 0 ? `Nice — ${tried.size} ${tried.size === 1 ? 'try' : 'tries'} done.` : (data.explore.hint ?? 'Try one to see what happens.')) : ''}
              </span>
              {step === 0 && (
                <TactileButton variant={tried.size > 0 ? 'continue' : 'disabled'} disabled={tried.size === 0} onClick={() => setStep(1)} size="md" icon={<ArrowRight size={18}/>}>
                  Next
                </TactileButton>
              )}
              {step === 1 && (
                <TactileButton variant="primary" onClick={() => setStep(2)} size="md" icon={<ArrowRight size={18}/>}>
                  Got it
                </TactileButton>
              )}
              {step === 2 && (
                <div style={{ flex:1 }}>
                  <TactileButton variant={ready ? 'check' : 'disabled'} disabled={!ready} fullWidth onClick={goCheck}>
                    Check
                  </TactileButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── EXPERIENCE: a tappable mini-app that really fetches from a service ─────────
type Travel = 'idle' | 'out' | 'flash' | 'in' | 'done';
type Tone   = 'good' | 'bad' | 'neutral';

const TONE: Record<Tone, { text: string; glow: string; glowShadow: string }> = {
  good:    { text:'#15803D', glow:'#34D399', glowShadow:'rgba(16,185,129,.4)' },
  bad:     { text:'#DC2626', glow:'#F87171', glowShadow:'rgba(239,68,68,.38)' },
  neutral: { text:'#1C1B2A', glow:'#34D399', glowShadow:'rgba(16,185,129,.35)' },
};

function ExploreScene({ ex, accent, onTried }: { ex: InteractiveData['explore']; accent: string; onTried: (id: string) => void }) {
  const isMobile = useIsMobile();
  const [active,      setActive]      = useState<ExploreQuery | null>(null);
  const [travel,      setTravel]      = useState<Travel>('idle');
  const [picked,      setPicked]      = useState<string | null>(null);
  const [display,     setDisplay]     = useState(ex.emptyDisplay);
  const [displayTone, setDisplayTone] = useState<Tone>('neutral');

  const busy = travel === 'out' || travel === 'flash' || travel === 'in';
  const glow = travel === 'flash' || travel === 'in';
  const activeTone: Tone = active?.tone ?? 'neutral';
  const queries = ex.queries ?? [];

  const run = (q: ExploreQuery) => {
    if (busy) return;
    setActive(q); setPicked(q.id); setTravel('out');
    window.setTimeout(() => setTravel('flash'), 650);
    window.setTimeout(() => setTravel('in'),    880);
    window.setTimeout(() => { setTravel('done'); setDisplay(q.display); setDisplayTone(q.tone ?? 'neutral'); onTried(q.id); }, 1550);
  };

  return (
    <div>
      <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'19px', fontWeight:800, color:'#1C1B2A', margin:'0 0 22px', lineHeight:1.35, letterSpacing:'-0.01em' }}>
        {ex.prompt}
      </p>

      {/* Round-trip stage */}
      <div style={{ display:'flex', alignItems:'center', padding:'10px 6px 6px', position:'relative' }}>
        {/* Device */}
        <NodeBox emoji={ex.deviceEmoji} label={ex.deviceLabel} pulse={travel === 'out'}>
          <div style={{
            marginTop:6, fontFamily:'var(--atl-font-display)', fontWeight:800, fontSize:'16px',
            color: display === ex.emptyDisplay ? '#C4C0CA' : TONE[displayTone].text, transition:'color .3s', minHeight:22,
          }}>{display}</div>
        </NodeBox>

        {/* Wire */}
        <div style={{ flex:1, height:3, background:'#ECE8E1', position:'relative', margin:'0 10px', borderRadius:2 }}>
          {/* request / response label */}
          <AnimatePresence>
            {(travel === 'out' || travel === 'flash') && active && (
              <motion.div key="reqlbl" initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={labelStyle(BRAND, 'bottom')}>{active.request}</motion.div>
            )}
            {travel === 'in' && active && (
              <motion.div key="reslbl" initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={labelStyle(activeTone === 'bad' ? '#DC2626' : '#16A34A', 'top')}>{active.response}</motion.div>
            )}
          </AnimatePresence>
          {/* moving packet */}
          <AnimatePresence>
            {(travel === 'out' || travel === 'flash') && (
              <motion.div key="out" initial={{ left:0, scale:0 }} animate={{ left:'calc(100% - 13px)', scale:1 }} exit={{ opacity:0 }}
                transition={{ duration:.5, ease:[.34,1.56,.64,1] }}
                style={{ position:'absolute', top:-5.5, width:13, height:13, borderRadius:'50%', background:`linear-gradient(135deg,${BRAND},#5B7BFF)`, boxShadow:`0 0 10px ${BRAND}80`, zIndex:2 }}/>
            )}
            {travel === 'in' && (
              <motion.div key="in" initial={{ right:0, scale:0 }} animate={{ right:'calc(100% - 13px)', scale:1 }}
                transition={{ duration:.5, ease:[.34,1.56,.64,1] }}
                style={{ position:'absolute', top:-5.5, width:13, height:13, borderRadius:'50%',
                  background: activeTone === 'bad' ? 'linear-gradient(135deg,#EF4444,#FB7185)' : 'linear-gradient(135deg,#22C55E,#8FE34A)',
                  boxShadow: activeTone === 'bad' ? '0 0 10px rgba(239,68,68,.5)' : '0 0 10px rgba(34,197,94,.5)', zIndex:2 }}/>
            )}
          </AnimatePresence>
        </div>

        {/* Service */}
        <NodeBox emoji={ex.serviceEmoji} label={ex.serviceLabel} sub={isMobile ? undefined : ex.serviceSub} glow={glow} glowColor={TONE[activeTone].glow} glowShadow={TONE[activeTone].glowShadow}>
          <div style={{ marginTop:6, fontFamily:'var(--atl-font-mono, ui-monospace, monospace)', fontSize:'10px', fontWeight:700, color: glow ? TONE[activeTone].text : '#C4C0CA', transition:'color .3s', minHeight:22, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {glow ? 'API' : '· · ·'}
          </div>
        </NodeBox>
      </div>

      {/* Query chips */}
      <div style={{ marginTop:22 }}>
        <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#A7A3AD', marginBottom:10 }}>
          Tap to try
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:9 }}>
          {queries.map(q => {
            const isPicked = picked === q.id;
            return (
              <motion.button key={q.id} onClick={() => run(q)} disabled={busy}
                whileTap={busy ? {} : { scale:.96 }}
                style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  padding:'9px 15px', borderRadius:100, cursor: busy ? 'default' : 'pointer',
                  fontFamily:'var(--atl-font-body)', fontSize:'14px', fontWeight:700,
                  background: isPicked ? `${accent}14` : '#FFF',
                  border:`1.5px solid ${isPicked ? accent : '#ECE8E1'}`,
                  color: isPicked ? accent : '#1C1B2A',
                  boxShadow: isPicked ? `0 0 0 3px ${accent}1a` : '0 1px 2px rgba(28,27,42,.05)',
                  opacity: busy && !isPicked ? .55 : 1,
                  transition:'background .15s, border-color .15s, opacity .15s',
                }}>
                {q.label}
                {isPicked && travel === 'done' && <Sparkles size={13} color={accent}/>}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NodeBox({ emoji, label, sub, children, glow, glowColor, glowShadow, pulse }: { emoji: string; label: string; sub?: string; children?: React.ReactNode; glow?: boolean; glowColor?: string; glowShadow?: string; pulse?: boolean }) {
  const gc = glowColor ?? '#34D399';
  const gs = glowShadow ?? 'rgba(16,185,129,.35)';
  return (
    <motion.div
      animate={pulse ? { scale:[1,1.07,1], transition:{ duration:.3 } } : glow ? { scale:[1,1.06,1.02,1], transition:{ duration:.4 } } : {}}
      style={{
        width:96, flexShrink:0, boxSizing:'border-box',
        background:'#FFF', border:`2px solid ${glow ? gc : '#ECE8E1'}`,
        borderRadius:16, padding:'12px 8px', textAlign:'center',
        boxShadow: glow ? `0 0 22px ${gs}` : '0 4px 14px rgba(28,27,42,.07)',
        transition:'border-color .25s, box-shadow .25s',
      }}>
      <div style={{ fontSize:28, lineHeight:1 }}>{emoji}</div>
      <div style={{ fontFamily:'var(--atl-font-body)', fontSize:'11.5px', fontWeight:700, color:'#1C1B2A', marginTop:5, lineHeight:1.2 }}>{label}</div>
      {sub && <div style={{ fontFamily:'var(--atl-font-body)', fontSize:'9.5px', fontWeight:500, color:'#A7A3AD', marginTop:2 }}>{sub}</div>}
      {children}
    </motion.div>
  );
}

function labelStyle(color: string, side: 'top' | 'bottom'): React.CSSProperties {
  return {
    position:'absolute', left:'50%', transform:'translateX(-50%)',
    ...(side === 'bottom' ? { top:12 } : { bottom:12 }),
    background:'#FFF', border:`1.5px solid ${color}`, color,
    borderRadius:7, padding:'3px 8px', whiteSpace:'nowrap',
    fontFamily:'var(--atl-font-mono, ui-monospace, monospace)', fontSize:'10.5px', fontWeight:700,
    boxShadow:`0 4px 12px ${color}33`, zIndex:3, pointerEvents:'none',
  };
}

// ── CONCEPT: name what just happened ──────────────────────────────────────────
function InsightCard({ insight, accent }: { insight: InteractiveData['insight']; accent: string }) {
  return (
    <div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:100, background:`${accent}14`, marginBottom:16 }}>
        <Sparkles size={14} color={accent}/>
        <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:800, color:accent, letterSpacing:'.02em' }}>{insight.title}</span>
      </div>
      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'16px', fontWeight:500, color:'#3A3947', lineHeight:1.55, margin:'0 0 20px' }}>
        {insight.body}
      </p>
      {insight.terms && insight.terms.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {insight.terms.map(t => (
            <div key={t.term} style={{ display:'flex', gap:12, alignItems:'baseline', padding:'12px 14px', background:'#FAF9F7', borderRadius:14, border:'1px solid #F2EFEA' }}>
              <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'13.5px', fontWeight:800, color:accent, flexShrink:0, minWidth:isWideTerm(t.term) ? 130 : 64 }}>{t.term}</span>
              <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'13.5px', fontWeight:500, color:'#6B6A7B', lineHeight:1.45 }}>{t.def}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isWideTerm(term: string) { return term.length > 12; }

// ── EXPERIENCE (predict): learner sets the EXPECTED result, runs, sees PASS/FAIL
function PredictScene({ predict, ex, accent, onTried }: {
  predict: PredictExperience;
  ex: InteractiveData['explore'];
  accent: string;
  onTried: (id: string) => void;
}) {
  const [expected, setExpected] = useState<Record<string, string | null>>(
    () => Object.fromEntries(predict.rows.map(r => [r.id, null]))
  );
  const [ran, setRan] = useState<Set<string>>(new Set());

  const choose = (rowId: string, opt: string) => {
    if (ran.has(rowId)) return;
    setExpected(prev => ({ ...prev, [rowId]: opt }));
  };
  const runRow = (rowId: string) => {
    if (!expected[rowId] || ran.has(rowId)) return;
    setRan(prev => new Set(prev).add(rowId));
    onTried(rowId);
  };

  return (
    <div>
      <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'19px', fontWeight:800, color:'#1C1B2A', margin:'0 0 6px', lineHeight:1.35, letterSpacing:'-0.01em' }}>
        {ex.prompt}
      </p>
      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:500, color:'#6B6A7B', margin:'0 0 18px', lineHeight:1.5 }}>
        {predict.intro}
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
        {predict.rows.map(r => {
          const exp   = expected[r.id];
          const isRun = ran.has(r.id);
          const pass  = exp === r.actual;
          return (
            <div key={r.id} style={{
              border:`1.5px solid ${isRun ? (pass ? '#BBF7D0' : '#FECDD3') : '#ECE8E1'}`,
              borderRadius:16, padding:'13px 14px',
              background: isRun ? (pass ? '#F0FDF4' : '#FFF5F6') : '#FFF',
              transition:'background .2s, border-color .2s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--atl-font-mono, ui-monospace, monospace)', fontSize:'12.5px', fontWeight:700, color:'#1C1B2A', background:'#F2EFEA', padding:'4px 9px', borderRadius:7 }}>
                  {r.request}
                </span>
                <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#A7A3AD' }}>I expect</span>
                <div style={{ display:'flex', gap:6 }}>
                  {predict.expectedOptions.map(opt => {
                    const sel = exp === opt;
                    return (
                      <button key={opt} onClick={() => choose(r.id, opt)} disabled={isRun}
                        style={{
                          padding:'5px 11px', borderRadius:100,
                          fontFamily:'var(--atl-font-body)', fontSize:'12.5px', fontWeight:700,
                          cursor: isRun ? 'default' : 'pointer',
                          background: sel ? `${accent}14` : '#FFF',
                          border:`1.5px solid ${sel ? accent : '#ECE8E1'}`,
                          color: sel ? accent : '#6B6A7B',
                          opacity: isRun && !sel ? .45 : 1,
                          transition:'background .15s, border-color .15s',
                        }}>{opt}</button>
                    );
                  })}
                </div>
                {!isRun ? (
                  <button onClick={() => runRow(r.id)} disabled={!exp}
                    style={{
                      marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:5,
                      padding:'6px 14px', borderRadius:100, border:'none',
                      cursor: exp ? 'pointer' : 'not-allowed',
                      fontFamily:'var(--atl-font-body)', fontSize:'12.5px', fontWeight:800,
                      background: exp ? '#1C1B2A' : '#EDE9E2', color: exp ? '#fff' : '#A7A3AD',
                      transition:'background .15s',
                    }}>▶ Run</button>
                ) : (
                  <span style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:800, color: pass ? '#15803D' : '#BE123C' }}>
                    {pass ? <Check size={15} strokeWidth={3}/> : <X size={15} strokeWidth={3}/>}
                    {pass ? 'PASS' : 'FAIL'}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {isRun && (
                  <motion.div initial={{ opacity:0, height:0, marginTop:0 }} animate={{ opacity:1, height:'auto', marginTop:9 }} transition={{ duration:.25 }} style={{ overflow:'hidden' }}>
                    <span style={{ fontFamily:'var(--atl-font-mono, ui-monospace, monospace)', fontSize:'12px', fontWeight:700, color:'#6B6A7B' }}>
                      Actual: <span style={{ color: pass ? '#15803D' : '#DC2626' }}>{r.actual}</span>
                      {'  ·  '}expected {exp} {pass ? '=' : '≠'} actual
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CHECK (choice): tap the correct statement, used for recall concepts ───────
function ChoiceCheck({ prompt, options, correctIndex, checkTrigger, onReadyChange, onResult, phase, revealed = false }: {
  prompt: string;
  options: string[];
  correctIndex: number;
  checkTrigger: number;
  onReadyChange: (ready: boolean) => void;
  onResult: (correct: boolean) => void;
  phase: Phase;
  revealed?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const isAnswering = phase === 'answering' && checkTrigger === 0;
  const showAnswer  = phase === 'correct' || revealed;

  useEffect(() => { onReadyChange(selected !== null); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (checkTrigger === 0) return;
    onResult(selected === correctIndex);
  }, [checkTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const optState = (i: number): OptionState => {
    if (phase === 'answering')           return selected === i ? 'selected' : 'default';
    // Flag the wrong pick; only reveal the correct one once earned.
    if (selected === i && i !== correctIndex) return 'wrong';
    if (i === correctIndex)              return showAnswer ? 'correct' : 'default';
    return 'default';
  };

  return (
    <div>
      <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'19px', fontWeight:800, color:'#1C1B2A', margin:'0 0 20px', lineHeight:1.35, letterSpacing:'-0.01em' }}>
        {prompt}
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {options.map((opt, i) => (
          <OptionCard key={i} index={i} state={optState(i)}
            onClick={() => isAnswering && setSelected(i)}
            disabled={!isAnswering}>
            {opt}
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
