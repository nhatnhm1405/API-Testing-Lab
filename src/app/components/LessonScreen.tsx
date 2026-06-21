import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TactileButton } from "./TactileButton";
import { OptionCard, OptionState } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";
import { FocusFrame } from "./FocusFrame";
import { Mascot } from "./Mascot";
import { WhyModal } from "./WhyModal";
import { FillBlankExercise } from "./FillBlank";
import { DragDropCategorizeExercise } from "./DragDropCategorize";
import { DragDropOrderExercise } from "./DragDropOrder";
import { MiniPostman } from "./MiniPostman";
import { getCurrentModule } from "../data/courseData";
import type { MCQData, FillBlankData, DragCategorizeData, DragOrderData, PostmanData } from "../data/courseData";
import { playCorrect, playWrong } from "../lib/sound";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator' | 'review';
type Phase = 'answering' | 'correct' | 'wrong';

interface LessonScreenProps {
  onNavigate: (v: View) => void;
  onLessonComplete: (lessonId: string, xp: number) => void;
  onMistake: (lessonId: string) => void;
  completedLessons: Set<string>;
  streak: number;
}

export function LessonScreen({ onNavigate, onLessonComplete, onMistake, completedLessons, streak }: LessonScreenProps) {
  const { module: mod } = getCurrentModule(completedLessons);
  const lessonIdx = Math.min(
    mod.lessons.findIndex(l => !completedLessons.has(l.id)),
    mod.lessons.length - 1
  );
  const safeIdx = lessonIdx === -1 ? mod.lessons.length - 1 : lessonIdx;
  const lesson  = mod.lessons[safeIdx];

  const [phase,         setPhase]         = useState<Phase>('answering');
  const [isReady,       setIsReady]       = useState(false);
  const [checkTrigger,  setCheckTrigger]  = useState(0);
  const [showWhy,       setShowWhy]       = useState(false);
  // MCQ specific
  const [selected,      setSelected]      = useState<number | null>(null);

  const isCorrect = phase === 'correct';
  const isWrong   = phase === 'wrong';
  const type      = lesson.data.type;
  const isPostman = type === 'postman';

  const handleExerciseResult = (correct: boolean) => {
    if (!correct) onMistake(lesson.id);
    (correct ? playCorrect : playWrong)();
    setPhase(correct ? 'correct' : 'wrong');
  };

  const handleCheck = () => {
    if (isPostman) return;
    if (type === 'mcq') {
      if (selected === null) return;
      const mcq = lesson.data as MCQData;
      const correct = selected === mcq.correctIndex;
      if (!correct) onMistake(lesson.id);
      (correct ? playCorrect : playWrong)();
      setPhase(correct ? 'correct' : 'wrong');
    } else {
      setCheckTrigger(t => t + 1);
    }
  };

  const handleContinue = () => {
    if (showWhy) { setShowWhy(false); }
    // Only award XP when the answer was correct
    onLessonComplete(lesson.id, isCorrect ? lesson.xp : 0);
    // Reset for next lesson
    setPhase('answering');
    setIsReady(false);
    setCheckTrigger(0);
    setSelected(null);
  };

  const getOptionState = (i: number): OptionState => {
    const mcq = lesson.data as MCQData;
    if (phase === 'answering') return selected === i ? 'selected' : 'default';
    if (i === mcq.correctIndex) return 'correct';
    if (selected === i && isWrong) return 'wrong';
    return 'default';
  };

  const frameState = isCorrect ? 'correct' : isWrong ? 'wrong' : 'default';

  const checkReady = isPostman ? false :
    type === 'mcq' ? selected !== null :
    isReady;

  const explanation = (lesson.data as { explanation: string }).explanation ?? '';

  return (
    <>
      <div style={{ minHeight:'100%', background:'var(--atl-canvas)', display:'flex', flexDirection:'column' }}>
        {/* Progress bar */}
        <div style={{ background:'#FFF', borderBottom:'1.5px solid #F2EFEA', padding:'10px 20px', position:'sticky', top:0, zIndex:20 }}>
          <ProgressBar total={mod.lessons.length} current={safeIdx} streak={streak} onClose={() => onNavigate('home')}/>
        </div>

        {/* Exercise area */}
        <div style={{ flex:1, maxWidth: isPostman ? 900 : 640, margin:'0 auto', width:'100%', padding: isPostman ? '24px 20px 60px' : '24px 20px 160px', boxSizing:'border-box' }}>
          <AnimatePresence mode="wait">
            <motion.div key={lesson.id} initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} transition={{ duration:.25 }}>

              {/* Module + lesson label */}
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:20 }}>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:700,color:mod.accent,background:`${mod.accent}18`,borderRadius:'100px',padding:'3px 12px' }}>
                  {mod.title}
                </span>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:600,color:'#A7A3AD' }}>
                  {lesson.title}
                </span>
              </div>

              {/* Postman: no FocusFrame wrapper (it has its own chrome) */}
              {isPostman ? (
                <MiniPostman
                  data={lesson.data as PostmanData}
                  onResult={handleExerciseResult}
                  phase={phase}
                />
              ) : (
                <FocusFrame state={frameState}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
                    <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#A7A3AD' }}>
                      Question {safeIdx+1} / {mod.lessons.length}
                    </span>
                    <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,color:'#A7A3AD' }}>
                      {lesson.xp} XP
                    </span>
                  </div>

                  {type === 'mcq' && (
                    <>
                      <h2 style={{ fontFamily:'var(--atl-font-display)',fontSize:'22px',fontWeight:800,color:'#1C1B2A',margin:'0 0 24px',lineHeight:1.3,letterSpacing:'-0.02em' }}>
                        {(lesson.data as MCQData).question}
                      </h2>
                      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                        {(lesson.data as MCQData).options.map((opt, i) => (
                          <OptionCard key={i} index={i} state={getOptionState(i)}
                            onClick={() => phase==='answering' && setSelected(i)}
                            disabled={phase!=='answering'}>
                            {opt}
                          </OptionCard>
                        ))}
                      </div>
                    </>
                  )}

                  {type === 'fill-blank' && (
                    <FillBlankExercise
                      template={(lesson.data as FillBlankData).template}
                      blanks={(lesson.data as FillBlankData).blanks}
                      wordBank={(lesson.data as FillBlankData).wordBank}
                      instruction={(lesson.data as FillBlankData).instruction}
                      checkTrigger={checkTrigger}
                      onReadyChange={setIsReady}
                      onResult={handleExerciseResult}
                      phase={phase}
                    />
                  )}

                  {type === 'drag-categorize' && (
                    <DragDropCategorizeExercise
                      instruction={(lesson.data as DragCategorizeData).instruction}
                      buckets={(lesson.data as DragCategorizeData).buckets}
                      cards={(lesson.data as DragCategorizeData).cards}
                      checkTrigger={checkTrigger}
                      onReadyChange={setIsReady}
                      onResult={handleExerciseResult}
                      phase={phase}
                    />
                  )}

                  {type === 'drag-order' && (
                    <DragDropOrderExercise
                      instruction={(lesson.data as DragOrderData).instruction}
                      items={(lesson.data as DragOrderData).items}
                      checkTrigger={checkTrigger}
                      onReadyChange={setIsReady}
                      onResult={handleExerciseResult}
                      phase={phase}
                    />
                  )}
                </FocusFrame>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA (not for postman) */}
        {!isPostman && (
          <AnimatePresence>
            {phase !== 'answering' ? (
              <motion.div key="feedback"
                initial={{ y:80,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:60,opacity:0 }}
                transition={{ type:'spring',stiffness:400,damping:32 }}
                style={{ position:'fixed',bottom:0,left:0,right:0,background:isCorrect?'#ECFDF3':'#FFF1F2',borderTop:`2px solid ${isCorrect?'#BBF7D0':'#FECDD3'}`,padding:'16px 20px 28px',zIndex:30 }}>
                <div style={{ maxWidth:640,margin:'0 auto',display:'flex',alignItems:'center',gap:16 }}>
                  <Mascot state={isCorrect?'correct':'wrong'} size="md" showBubble bubbleText={isCorrect?'Correct! 🎉':'Not quite!'}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontFamily:'var(--atl-font-display)',fontSize:'17px',fontWeight:800,color:isCorrect?'#15803D':'#BE123C',margin:'0 0 3px' }}>
                      {isCorrect ? 'Correct!' : 'Not quite!'}
                    </p>
                    <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:isCorrect?'#166534':'#9F1239',margin:0,fontWeight:500,lineHeight:1.4 }}>
                      {isCorrect ? `+${lesson.xp} XP earned!` : 'Review the explanation below.'}
                    </p>
                    <button onClick={() => setShowWhy(true)}
                      style={{ marginTop:5,background:'none',border:'none',cursor:'pointer',fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:700,color:isCorrect?'#16A34A':'#E11D48',textDecoration:'underline',padding:0 }}>
                      Why? →
                    </button>
                  </div>
                  <TactileButton variant="continue" onClick={handleContinue} size="md">Continue</TactileButton>
                </div>
              </motion.div>
            ) : (
              <motion.div key="check"
                initial={{ y:20,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:20,opacity:0 }}
                transition={{ duration:.2 }}
                style={{ position:'fixed',bottom:0,left:0,right:0,background:'linear-gradient(to top,var(--atl-canvas) 70%,transparent)',padding:'20px 20px 28px',zIndex:30 }}>
                <div style={{ maxWidth:640,margin:'0 auto' }}>
                  <TactileButton variant={checkReady ? 'check' : 'disabled'} disabled={!checkReady} fullWidth onClick={handleCheck}>
                    Check
                  </TactileButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Postman: continue button after success */}
        {isPostman && phase === 'correct' && (
          <motion.div initial={{ y:60,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ type:'spring',stiffness:400,damping:32 }}
            style={{ position:'fixed',bottom:0,left:0,right:0,background:'#ECFDF3',borderTop:'2px solid #BBF7D0',padding:'16px 20px 28px',zIndex:30 }}>
            <div style={{ maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',gap:16 }}>
              <Mascot state="correct" size="md" showBubble bubbleText="Request succeeded! 🎉"/>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:'var(--atl-font-display)',fontSize:'17px',fontWeight:800,color:'#15803D',margin:'0 0 2px' }}>Well done!</p>
                <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#166534',margin:0,fontWeight:500 }}>{`+${lesson.xp} XP earned!`}</p>
              </div>
              <TactileButton variant="continue" onClick={handleContinue} size="md">Continue</TactileButton>
            </div>
          </motion.div>
        )}
      </div>

      <WhyModal isOpen={showWhy} explanation={explanation} onClose={() => setShowWhy(false)} onContinue={handleContinue}/>
    </>
  );
}
