import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NavBar } from "./components/NavBar";
import { HomeDashboard } from "./components/HomeDashboard";
import { LearningPath } from "./components/LearningPath";
import { LessonScreen } from "./components/LessonScreen";
import { ResultScreen } from "./components/ResultScreen";
import { SkillCheckScreen } from "./components/SkillCheckScreen";
import { ConceptDiagrams } from "./components/ConceptDiagrams";
import { APISimulator } from "./components/APISimulator";
import { MistakesReview } from "./components/MistakesReview";
import { MODULES, USER_STREAK, USER_XP } from "./data/courseData";

export type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator' | 'review';

const NO_NAV: View[] = ['lesson'];

export default function App() {
  const [view,             setView]             = useState<View>('home');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [xp,               setXP]               = useState(USER_XP);
  // Lessons the user answered incorrectly (noted for review)
  const [mistakes,         setMistakes]         = useState<Set<string>>(new Set());
  // Module whose completion screen is currently shown
  const [resultModuleIdx,  setResultModuleIdx]  = useState(0);
  // The lesson currently open in the lesson view. Free-roam: any module/lesson
  // can be targeted directly, so the active lesson is explicit rather than
  // implicitly derived from progress.
  const [lessonTarget,     setLessonTarget]     = useState({ moduleIdx: 0, lessonIdx: 0 });
  // Which module the learning-path detail screen is showing.
  const [pathModuleIdx,    setPathModuleIdx]    = useState(0);

  const navigate = (next: View) => setView(next);

  // Open the Brilliant-style detail page for a given module.
  const openModulePath = (moduleIdx: number) => {
    setPathModuleIdx(moduleIdx);
    setView('path');
  };

  // Open a specific lesson (used by Home, the learning path and restart).
  const openLesson = (moduleIdx: number, lessonIdx: number) => {
    setLessonTarget({ moduleIdx, lessonIdx });
    setView('lesson');
  };

  const handleLessonComplete = (lessonId: string, earnedXP: number) => {
    const newCompleted = new Set([...completedLessons, lessonId]);
    setCompletedLessons(newCompleted);
    setXP(prev => prev + earnedXP);

    const { moduleIdx, lessonIdx } = lessonTarget;
    const mod = MODULES[moduleIdx];
    const isLastInModule = lessonIdx >= mod.lessons.length - 1;
    const moduleNowComplete = mod.lessons.every(l => newCompleted.has(l.id));

    if (isLastInModule || moduleNowComplete) {
      // Celebrate when the module's last lesson is finished.
      setResultModuleIdx(moduleIdx);
      setView('result');
    } else {
      // Advance to the next lesson within this module.
      setLessonTarget({ moduleIdx, lessonIdx: lessonIdx + 1 });
    }
  };

  const noteMistake = (lessonId: string) => {
    setMistakes(prev => prev.has(lessonId) ? prev : new Set([...prev, lessonId]));
  };

  // Advance from a module's skill-check into the first lesson of the NEXT module.
  // Without this the skill-check just reopened `lessonTarget`, which still pointed
  // at the last lesson of the module the learner just finished — hence the loop.
  const goToNextModule = () => {
    const nextIdx = resultModuleIdx + 1;
    if (nextIdx < MODULES.length) {
      openLesson(nextIdx, 0);
    } else {
      setView('path');
    }
  };

  // Wipe a module's progress (and its noted mistakes) and replay it from lesson 1.
  const restartModule = (moduleIdx: number) => {
    const ids = MODULES[moduleIdx].lessons.map(l => l.id);
    setCompletedLessons(prev => {
      const n = new Set(prev);
      ids.forEach(id => n.delete(id));
      return n;
    });
    setMistakes(prev => {
      const n = new Set(prev);
      ids.forEach(id => n.delete(id));
      return n;
    });
    openLesson(moduleIdx, 0);
  };

  const resultMod        = MODULES[resultModuleIdx];
  const resultTotal      = resultMod.lessons.length;
  const resultMistakeIds = resultMod.lessons.map(l => l.id).filter(id => mistakes.has(id));
  const resultScore      = resultTotal - resultMistakeIds.length;
  const resultXP         = resultMod.lessons.filter(l => !mistakes.has(l.id)).reduce((sum, l) => sum + l.xp, 0);
  const isLastMod        = resultModuleIdx === MODULES.length - 1;

  return (
    <div style={{ width:'100%', minHeight:'100vh', background:'var(--atl-canvas)', fontFamily:'var(--atl-font-body)', display:'flex', flexDirection:'column' }}>
      {!NO_NAV.includes(view) && (
        <NavBar streak={USER_STREAK} xp={xp} onLogoClick={() => navigate('home')}/>
      )}

      <div style={{ flex:1, position:'relative' }}>
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <Screen key="home">
              <HomeDashboard onNavigate={navigate} onOpenModulePath={openModulePath} completedLessons={completedLessons} xp={xp} mistakes={mistakes}/>
            </Screen>
          )}
          {view === 'path' && (
            <Screen key="path">
              <LearningPath onNavigate={navigate} onOpenLesson={openLesson} completedLessons={completedLessons} onRestartModule={restartModule} moduleIdx={pathModuleIdx}/>
            </Screen>
          )}
          {view === 'lesson' && (
            <Screen key="lesson">
              <LessonScreen
                onNavigate={navigate}
                onLessonComplete={handleLessonComplete}
                onMistake={noteMistake}
                target={lessonTarget}
                streak={USER_STREAK}
              />
            </Screen>
          )}
          {view === 'result' && (
            <Screen key="result">
              <ResultScreen
                onNavigate={navigate}
                moduleNumber={resultModuleIdx + 1}
                moduleTitle={resultMod.title}
                isLastModule={isLastMod}
                score={resultScore}
                total={resultTotal}
                xpEarned={resultXP}
                streak={USER_STREAK}
                moduleMistakes={resultMistakeIds}
                onRestartModule={() => restartModule(resultModuleIdx)}
              />
            </Screen>
          )}
          {view === 'skill-check' && (
            <Screen key="skill-check">
              <SkillCheckScreen
                onNavigate={navigate}
                onNextModule={goToNextModule}
                moduleNumber={resultModuleIdx + 1}
                moduleTitle={resultMod.title}
                accent={resultMod.accent}
                topics={resultMod.lessons.map(l => l.title)}
                isLastModule={isLastMod}
              />
            </Screen>
          )}
          {view === 'diagrams' && (
            <Screen key="diagrams">
              <ConceptDiagrams onNavigate={navigate}/>
            </Screen>
          )}
          {view === 'simulator' && (
            <Screen key="simulator">
              <APISimulator onClose={() => navigate('home')}/>
            </Screen>
          )}
          {view === 'review' && (
            <Screen key="review">
              <MistakesReview onNavigate={navigate} mistakes={mistakes}/>
            </Screen>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8 }}
      transition={{ duration:0.22, ease:'easeOut' }}
      style={{ width:'100%', minHeight:'100%' }}
    >
      {children}
    </motion.div>
  );
}
