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
import { getCurrentModule, USER_STREAK, USER_XP } from "./data/courseData";

export type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator';

const NO_NAV: View[] = ['lesson'];

export default function App() {
  const [view,             setView]             = useState<View>('home');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [xp,               setXP]               = useState(USER_XP);

  const { module: currentMod } = getCurrentModule(completedLessons);
  const allModuleDone = currentMod.lessons.every(l => completedLessons.has(l.id));

  const navigate = (next: View) => {
    if (next === 'lesson' && allModuleDone) { setView('result'); return; }
    setView(next);
  };

  const handleLessonComplete = (lessonId: string, earnedXP: number) => {
    const newCompleted = new Set([...completedLessons, lessonId]);
    setCompletedLessons(newCompleted);
    setXP(prev => prev + earnedXP);

    const { module: mod } = getCurrentModule(newCompleted);
    const modDone = mod.lessons.every(l => newCompleted.has(l.id));
    if (modDone) setView('result');
  };

  const score = currentMod.lessons.filter(l => completedLessons.has(l.id)).length;

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
                score={score}
                total={currentMod.lessons.length}
                xpEarned={score * 12}
                streak={USER_STREAK}
              />
            </Screen>
          )}
          {view === 'skill-check' && (
            <Screen key="skill-check">
              <SkillCheckScreen onNavigate={navigate}/>
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
