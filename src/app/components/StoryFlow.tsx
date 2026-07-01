import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, CheckCircle2 } from "lucide-react";
import { TactileButton } from "./TactileButton";
import { Emoji, emojify } from "../lib/emoji";

// ── Shared story engine ────────────────────────────────────────────
// A story is a list of beats. Each beat shows a spoken line together with
// its plain-language takeaway; the learner reads through step by step and
// unlocks the final looping animation. Self-paced narration — no quiz.
export interface Opt { text: string; correct: boolean }
export interface Beat {
  emoji: string;
  name: string;
  tone: string;
  line: string;        // the spoken line
  api: string;         // the takeaway shown alongside the line
  question?: string;   // legacy (unused since the quiz was removed)
  options?: Opt[];     // legacy (unused)
}

interface StoryFlowProps {
  beats: Beat[];
  finalScene: ReactNode;     // looping animation shown once the story is read through
  doneNote: string;          // line shown above the final scene
  doneSummary: string;       // text in the success banner
  revealPrefix?: string;     // legacy (unused)
  onContinue?: () => void;   // advance the parent flow
}

export function StoryFlow({ beats, finalScene, doneNote, doneSummary, onContinue }: StoryFlowProps) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const beat   = beats[step];
  const isLast = step === beats.length - 1;

  const next  = () => { if (!isLast) setStep(s => s + 1); else setDone(true); };
  const reset = () => { setStep(0); setDone(false); };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
      style={{ background: '#FFF', borderRadius: 24, padding: 28, border: '1.5px solid #ECE8E1', boxShadow: '0 1px 2px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.07)' }}>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .3 }}>

            {/* progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {beats.map((_, i) => (
                  <div key={i} style={{
                    width: i === step ? 20 : 8, height: 8, borderRadius: 100,
                    background: i < step ? '#22C55E' : i === step ? beat.tone : '#ECE8E1',
                    transition: 'all .3s',
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 700, color: '#A7A3AD' }}>
                Step {step + 1} of {beats.length}
              </span>
            </div>

            {/* conversation transcript — each line with its takeaway */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {beats.slice(0, step + 1).map((b, bi) => (
                <Bubble key={bi} beat={b} animateIn={bi === step} />
              ))}
            </div>

            {/* advance */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TactileButton variant="continue" size="sm" onClick={next}>
                {isLast ? 'See the full flow →' : 'Next →'}
              </TactileButton>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }}>
            <p style={{ fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 700, color: '#15803D', margin: '0 0 12px', textAlign: 'center' }}>
              {emojify(doneNote)}
            </p>

            {finalScene}

            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#ECFDF3', border: '1.5px solid #BBF7D0', borderRadius: 14, flexWrap: 'wrap' }}>
              <CheckCircle2 size={20} color="#22C55E" style={{ flexShrink: 0 }} />
              <p style={{ flex: 1, minWidth: 180, fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 600, color: '#15803D', margin: 0, lineHeight: 1.4 }}>
                {emojify(doneSummary)}
              </p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <TactileButton variant="ghost" size="sm" onClick={reset} icon={<RotateCcw size={14} />}>Replay</TactileButton>
                {onContinue && (
                  <TactileButton variant="continue" size="sm" onClick={onContinue}>Continue →</TactileButton>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── A single conversation bubble ───────────────────────────────────
function Bubble({ beat, animateIn }: { beat: Beat; animateIn: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {/* avatar pops in first */}
      <motion.div
        initial={animateIn ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 20 }}
        style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: '#FFF', border: `2px solid ${beat.tone}40`, boxShadow: `0 2px 8px ${beat.tone}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Emoji e={beat.emoji} size={20} />
      </motion.div>

      {/* bubble grows out of the avatar (origin on the avatar side) */}
      <motion.div
        initial={animateIn ? { scale: 0.3, opacity: 0, x: -10 } : false}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 460, damping: 24, delay: animateIn ? 0.13 : 0 }}
        style={{ flex: 1, transformOrigin: 'left center', background: `${beat.tone}0D`, border: `1.5px solid ${beat.tone}26`, borderRadius: 14, borderTopLeftRadius: 4, padding: '9px 14px' }}>
        <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '11px', fontWeight: 800, color: beat.tone, letterSpacing: '.02em' }}>{beat.name}</span>
        <p style={{ fontFamily: 'var(--atl-font-body)', fontSize: '14px', fontWeight: 600, color: '#1C1B2A', margin: '2px 0 0', lineHeight: 1.4 }}>{emojify(beat.line)}</p>
        <motion.div
          initial={animateIn ? { opacity: 0, height: 0 } : false}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: .3, delay: animateIn ? 0.28 : 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, overflow: 'hidden' }}>
          <span style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', fontWeight: 700, color: beat.tone }}>→ {emojify(beat.api)}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
