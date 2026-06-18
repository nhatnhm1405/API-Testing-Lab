import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NavBar } from "./components/NavBar";
import { HomeDashboard } from "./components/HomeDashboard";
import { LearningPath } from "./components/LearningPath";
import { LessonScreen } from "./components/LessonScreen";
import { ResultScreen } from "./components/ResultScreen";
import { SkillCheckScreen } from "./components/SkillCheckScreen";
import { ConceptDiagrams } from "./components/ConceptDiagrams";
import { MODULES, getCurrentModule, USER_STREAK, USER_XP } from "./data/courseData";

export type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams';

const NO_NAV: View[] = ['lesson'];

export default function App() {
  const [view,             setView]             = useState<View>('home');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [xp,               setXP]               = useState(USER_XP);
  // Module whose completion screen is currently shown
  const [resultModuleIdx,  setResultModuleIdx]  = useState(0);

  const { module: currentMod } = getCurrentModule(completedLessons);
  const allModuleDone = currentMod.lessons.every(l => completedLessons.has(l.id));

  const navigate = (next: View) => {
    if (next === 'lesson' && allModuleDone) {
      setResultModuleIdx(MODULES.length - 1);
      setView('result');
      return;
    }
    setView(next);
  };

  const handleLessonComplete = (lessonId: string, earnedXP: number) => {
    const newCompleted = new Set([...completedLessons, lessonId]);
    setCompletedLessons(newCompleted);
    setXP(prev => prev + earnedXP);

    // Find the module this lesson belongs to and celebrate only when THAT
    // module flips from incomplete → complete (per-module, not whole course).
    const finishedIdx = MODULES.findIndex(m => m.lessons.some(l => l.id === lessonId));
    const finishedMod = MODULES[finishedIdx];
    const wasComplete = finishedMod.lessons.every(l => completedLessons.has(l.id));
    const nowComplete = finishedMod.lessons.every(l => newCompleted.has(l.id));
    if (!wasComplete && nowComplete) {
      setResultModuleIdx(finishedIdx);
      setView('result');
    }
  };

  const resultMod   = MODULES[resultModuleIdx];
  const resultTotal = resultMod.lessons.length;
  const resultXP    = resultMod.lessons.reduce((sum, l) => sum + l.xp, 0);
  const isLastMod   = resultModuleIdx === MODULES.length - 1;

  return (
    <div style={{ width:'100%', minHeight:'100vh', background:'var(--atl-canvas)', fontFamily:'var(--atl-font-body)', display:'flex', flexDirection:'column' }}>
      {!NO_NAV.includes(view) && (
        <NavBar streak={USER_STREAK} xp={xp} onLogoClick={() => navigate('home')}/>
      )}

      <div style={{ flex:1, position:'relative' }}>
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <Screen key="home">
              <HomeDashboard onNavigate={navigate} completedLessons={completedLessons} xp={xp}/>
            </Screen>
          )}
          {view === 'path' && (
            <Screen key="path">
              <LearningPath onNavigate={navigate} completedLessons={completedLessons}/>
            </Screen>
          )}
          {view === 'lesson' && (
            <Screen key="lesson">
              <LessonScreen
                onNavigate={navigate}
                onLessonComplete={handleLessonComplete}
                completedLessons={completedLessons}
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
                score={resultTotal}
                total={resultTotal}
                xpEarned={resultXP}
                streak={USER_STREAK}
              />
            </Screen>
          )}
          {view === 'skill-check' && (
            <Screen key="skill-check">
              <SkillCheckScreen
                onNavigate={navigate}
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
