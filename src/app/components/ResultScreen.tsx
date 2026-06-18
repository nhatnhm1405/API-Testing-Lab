import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { TactileButton } from "./TactileButton";
import { Zap, Star, Home, ArrowRight, Map, RotateCcw, AlertCircle, Lightbulb } from "lucide-react";
import { findLesson, getLessonPrompt } from "../data/courseData";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator' | 'review';

interface ResultScreenProps {
  onNavigate: (v: View) => void;
  moduleNumber: number;
  moduleTitle: string;
  isLastModule: boolean;
  score: number;
  total: number;
  xpEarned: number;
  streak: number;
  moduleMistakes: string[];
  onRestartModule: () => void;
}

function Trophy() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={120} height={120}>
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A"/><stop offset=".5" stopColor="#F59E0B"/><stop offset="1" stopColor="#D97706"/>
        </linearGradient>
        <linearGradient id="ts" x1="30" y1="20" x2="70" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,.6)"/><stop offset="1" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <filter id="tgl"><feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#F59E0B" floodOpacity=".35"/></filter>
      </defs>
      <path d="M35 20H85V58C85 75 72 85 60 88C48 85 35 75 35 58V20Z" fill="url(#tg)" filter="url(#tgl)"/>
      <path d="M42 24H70V50C70 62 63 70 60 72C55 68 42 60 42 50V24Z" fill="url(#ts)"/>
      <path d="M35 30C20 30 18 50 32 52" stroke="url(#tg)" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M85 30C100 30 102 50 88 52" stroke="url(#tg)" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <rect x="54" y="88" width="12" height="14" rx="2" fill="url(#tg)"/>
      <rect x="38" y="100" width="44" height="10" rx="5" fill="url(#tg)"/>
      <path d="M60 40L63 48L72 48L65 53L68 62L60 57L52 62L55 53L48 48L57 48Z" fill="rgba(255,255,255,.7)"/>
    </svg>
  );
}

export function ResultScreen({ onNavigate, moduleNumber, moduleTitle, isLastModule, score, total, xpEarned, streak, moduleMistakes, onRestartModule }: ResultScreenProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [displayXP,    setDisplayXP]    = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const t1 = setTimeout(() => confetti({ particleCount:140, spread:72, origin:{ y:.35 }, colors:['#2BD46B','#8FE34A','#2E5BFF','#5B7BFF','#B9E534','#E0A815','#F59E0B'], scalar:1.1 }), 300);
    const t2 = setTimeout(() => {
      confetti({ particleCount:60, spread:120, origin:{ y:.5,x:.1 }, colors:['#2BD46B','#B9E534'], angle:60 });
      confetti({ particleCount:60, spread:120, origin:{ y:.5,x:.9 }, colors:['#2E5BFF','#5B7BFF'], angle:120 });
    }, 700);

    let frame = 0;
    const FRAMES = 40;
    const timer = setInterval(() => {
      frame++;
      setDisplayScore(Math.min(score, Math.round((frame/FRAMES)*score)));
      setDisplayXP(Math.min(xpEarned, Math.round((frame/FRAMES)*xpEarned)));
      if (frame >= FRAMES) clearInterval(timer);
    }, 30);

    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(timer); };
  }, [score, xpEarned]);

  const pct = Math.round((score/total)*100);

  return (
    <div style={{ minHeight:'100%',background:'var(--atl-canvas)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',position:'relative',overflow:'hidden' }}>
      <div style={{ position:'absolute',top:-100,left:'50%',transform:'translateX(-50%)',width:500,height:500,background:'radial-gradient(circle,rgba(43,212,107,.07),transparent 70%)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:480,width:'100%',display:'flex',flexDirection:'column',alignItems:'center' }}>
        {/* Trophy */}
        <motion.div initial={{ scale:.4,opacity:0,y:20 }} animate={{ scale:1,opacity:1,y:0 }} transition={{ type:'spring',stiffness:300,damping:20,delay:.15 }}>
          <Trophy/>
        </motion.div>

        {/* Heading */}
        <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.4 }} style={{ textAlign:'center',marginBottom:28 }}>
          <h1 style={{ fontFamily:'var(--atl-font-display)',fontSize:'32px',fontWeight:800,color:'#1C1B2A',margin:'0 0 8px',letterSpacing:'-0.03em' }}>
            {isLastModule ? 'Course complete! 🏆' : score===total ? 'Perfect! 🎉' : pct>=75 ? 'Great job! 🌟' : 'Keep going! 💪'}
          </h1>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'16px',color:'#6B6A7B',margin:0,fontWeight:500 }}>
            You completed Module {moduleNumber} · {moduleTitle}
          </p>
        </motion.div>

        {/* Score card */}
        <motion.div initial={{ opacity:0,scale:.9 }} animate={{ opacity:1,scale:1 }} transition={{ duration:.4,delay:.5,type:'spring',stiffness:400,damping:28 }}
          style={{ background:'#FFF',borderRadius:24,padding:28,width:'100%',boxSizing:'border-box',border:'1.5px solid #ECE8E1',boxShadow:'0 2px 4px rgba(28,27,42,.05),0 16px 48px rgba(28,27,42,.08)',marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:24 }}>
            <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'56px',fontWeight:800,color:'#1C1B2A',lineHeight:1,letterSpacing:'-0.04em' }}>{displayScore}</span>
            <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'28px',fontWeight:800,color:'#A7A3AD',lineHeight:1 }}>/{total}</span>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
            {[
              { icon:<Star size={15} color="#F59E0B" fill="#F59E0B"/>, label:'Score',       value:`${pct}%`,       color:'#D97706' },
              { icon:<Zap  size={15} color="#B9E534" fill="#B9E534" strokeWidth={0}/>, label:'XP earned',  value:`+${displayXP}`, color:'#5A700A' },
              { icon:<span style={{ fontSize:14 }}>🔥</span>,             label:'Streak',     value:`${streak}`,     color:'#EA580C' },
            ].map(st => (
              <div key={st.label} style={{ background:'#FAF8F5',borderRadius:14,padding:12,textAlign:'center',border:'1px solid #F2EFEA' }}>
                <div style={{ marginBottom:4,display:'flex',justifyContent:'center' }}>{st.icon}</div>
                <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:800,color:st.color,display:'block',lineHeight:1 }}>{st.value}</span>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',color:'#A7A3AD',fontWeight:600 }}>{st.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Skill-check teaser (not on the final module) */}
        {!isLastModule && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.65 }}
            style={{ width:'100%',background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)',border:'1.5px solid #C7D2FE',borderRadius:16,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,marginBottom:28 }}>
            <span style={{ fontSize:22 }}>✅</span>
            <div>
              <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:700,color:'#3730A3',margin:'0 0 2px' }}>Skill Check unlocked!</p>
              <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:500,color:'#6366F1',margin:0 }}>Test your Module {moduleNumber} knowledge</p>
            </div>
          </motion.div>
        )}

        {/* Mistakes from this module — list + explanation */}
        {moduleMistakes.length > 0 && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.68 }}
            style={{ width:'100%',marginBottom:20 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
              <AlertCircle size={15} color="#E11D48"/>
              <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#9F1239' }}>
                Review {moduleMistakes.length} mistake{moduleMistakes.length === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {moduleMistakes.map(id => {
                const found = findLesson(id);
                if (!found) return null;
                return (
                  <div key={id} style={{ background:'#FFF',borderRadius:16,padding:'14px 16px',border:'1.5px solid #FECDD3',boxShadow:'0 1px 3px rgba(28,27,42,.05)',textAlign:'left' }}>
                    <p style={{ fontFamily:'var(--atl-font-display)',fontSize:'14px',fontWeight:700,color:'#1C1B2A',margin:'0 0 8px',lineHeight:1.4 }}>
                      {getLessonPrompt(found.lesson.data)}
                    </p>
                    <div style={{ display:'flex',gap:8,background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)',border:'1.5px solid #FDE68A',borderRadius:10,padding:'9px 12px' }}>
                      <Lightbulb size={14} color="#D97706" style={{ flexShrink:0,marginTop:1 }}/>
                      <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',color:'#92400E',margin:0,lineHeight:1.5,fontWeight:500 }}>
                        {found.lesson.data.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.75 }}
          style={{ display:'flex',gap:12,width:'100%',marginTop:isLastModule?12:0 }}>
          <TactileButton variant="ghost" size="md" onClick={() => onNavigate('home')} icon={<Home size={15}/>}>Home</TactileButton>
          <div style={{ flex:1 }}>
            {isLastModule ? (
              <TactileButton variant="continue" fullWidth size="md" onClick={() => onNavigate('path')} icon={<Map size={16}/>}>
                View learning path
              </TactileButton>
            ) : (
              <TactileButton variant="continue" fullWidth size="md" onClick={() => onNavigate('skill-check')} icon={<ArrowRight size={16}/>}>
                Next up
              </TactileButton>
            )}
          </div>
        </motion.div>

        {/* Replay module */}
        <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.4,delay:.85 }}
          whileHover={{ y:-1 }} whileTap={{ scale:.98 }}
          onClick={onRestartModule}
          style={{ marginTop:14,display:'inline-flex',alignItems:'center',gap:7,background:'none',border:'none',cursor:'pointer',fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:700,color:'#6B6A7B' }}>
          <RotateCcw size={15}/> Replay this module
        </motion.button>
      </div>
    </div>
  );
}
