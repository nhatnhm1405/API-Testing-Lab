import { motion } from "motion/react";
import { CheckCircle2, Lock, ChevronRight, Zap, Play, BookOpen } from "lucide-react";
import { TactileButton } from "./TactileButton";
import { MODULES, USER_NAME, USER_STREAK, computeModuleStatus, getCurrentModule } from "../data/courseData";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator';

interface HomeDashboardProps {
  onNavigate: (v: View) => void;
  completedLessons: Set<string>;
  xp: number;
}

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FILLED = [true,  true,  true,  true,  true,  false, false];

function LessonRow({ title, done, current }: { title: string; done: boolean; current?: boolean }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid #F2EFEA' }}>
      {done ? (
        <div style={{ width:24,height:24,background:'#ECFDF3',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <CheckCircle2 size={14} color="#22C55E" strokeWidth={2.5}/>
        </div>
      ) : current ? (
        <div style={{ width:24,height:24,background:'linear-gradient(135deg,#2E5BFF,#5B7BFF)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 0 3px rgba(46,91,255,.18)' }}>
          <Play size={9} color="white" fill="white"/>
        </div>
      ) : (
        <div style={{ width:24,height:24,background:'#F2EFEA',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <Lock size={11} color="#A7A3AD" strokeWidth={2.5}/>
        </div>
      )}
      <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:current?600:500,color:done?'#6B6A7B':current?'#1C1B2A':'#A7A3AD',lineHeight:1 }}>
        {title}
      </span>
    </div>
  );
}

export function HomeDashboard({ onNavigate, completedLessons, xp }: HomeDashboardProps) {
  const { module: mod, index: modIdx } = getCurrentModule(completedLessons);

  return (
    <div style={{ minHeight:'100%',background:'var(--atl-canvas)',position:'relative',overflow:'hidden' }}>
      <div style={{ position:'absolute',top:-80,right:-80,width:300,height:300,background:'radial-gradient(circle,rgba(46,91,255,.05),transparent 70%)',pointerEvents:'none' }}/>
      <div style={{ position:'absolute',bottom:-80,left:-80,width:300,height:300,background:'radial-gradient(circle,rgba(43,212,107,.05),transparent 70%)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:1080,margin:'0 auto',padding:'32px 24px',display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1.35fr)',gap:28,position:'relative' }}>

        {/* ── LEFT ── */}
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4 }}>
            <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:500,color:'#6B6A7B',margin:'0 0 4px' }}>Welcome back 👋</p>
            <h1 style={{ fontFamily:'var(--atl-font-display)',fontSize:'32px',fontWeight:800,color:'#1C1B2A',margin:0,letterSpacing:'-0.03em',lineHeight:1.15 }}>
              Hi, {USER_NAME}!
            </h1>
          </motion.div>

          {/* Streak card */}
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.08 }}
            style={{ background:'#FFF',borderRadius:20,padding:20,border:'1.5px solid #F2EFEA',boxShadow:'0 1px 2px rgba(28,27,42,.05),0 8px 24px rgba(28,27,42,.06)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <div>
                <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'#A7A3AD',textTransform:'uppercase',margin:'0 0 4px' }}>Streak</p>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <Zap size={20} fill="#B9E534" color="#B9E534" strokeWidth={0}/>
                  <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'28px',fontWeight:800,color:'#1C1B2A',lineHeight:1 }}>{USER_STREAK}</span>
                  <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',color:'#6B6A7B',fontWeight:500 }}>days</span>
                </div>
              </div>
              <div style={{ background:'linear-gradient(135deg,#F9FCE4,#F0FAB8)',borderRadius:12,padding:'8px 12px',border:'1.5px solid #D9EF6A' }}>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:700,color:'#5A700A' }}>✦ {xp} XP</span>
              </div>
            </div>
            <div style={{ display:'flex',gap:6 }}>
              {DAYS.map((day, i) => {
                const filled = FILLED[i];
                const today  = i === 4;
                return (
                  <div key={day} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5 }}>
                    <div style={{ width:'100%',aspectRatio:'1',borderRadius:'50%',background:filled?(today?'linear-gradient(135deg,#B9E534,#8DC21A)':'#EAF5C3'):'#F2EFEA',border:today?'2px solid #A0C828':`2px solid ${filled?'#D4EC70':'#ECE8E1'}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:today?'0 0 0 3px rgba(185,229,52,.2)':'none' }}>
                      {filled && <Zap size={12} fill={today?'white':'#8DC21A'} color={today?'white':'#8DC21A'} strokeWidth={0}/>}
                    </div>
                    <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'10px',fontWeight:700,color:today?'#5A700A':'#A7A3AD' }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick stats */}
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.14 }}
            style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            {[
              { label:'Lessons done', value:completedLessons.size, emoji:'📚' },
              { label:'Modules',      value:`${modIdx+1}/4`,       emoji:'🎯' },
            ].map(s => (
              <div key={s.label} style={{ background:'#FFF',borderRadius:16,padding:16,border:'1.5px solid #F2EFEA',boxShadow:'0 1px 2px rgba(28,27,42,.05),0 4px 12px rgba(28,27,42,.04)' }}>
                <span style={{ fontSize:22,display:'block',marginBottom:6 }}>{s.emoji}</span>
                <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'24px',fontWeight:800,color:'#1C1B2A',display:'block',lineHeight:1 }}>{s.value}</span>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',color:'#6B6A7B',fontWeight:500 }}>{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* API Simulator hero link */}
          <motion.button initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.18 }}
            whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(46,91,255,.18)' }} whileTap={{ scale:.98 }}
            onClick={() => onNavigate('simulator' as View)}
            style={{ background:'linear-gradient(135deg,#1C1B2A,#2D2B42)', border:'none', borderRadius:16, padding:'16px 18px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', boxShadow:'0 4px 16px rgba(28,27,42,.18)', textAlign:'left' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#2E5BFF,#5B7BFF)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(46,91,255,.4)', flexShrink:0 }}>
              <span style={{ fontSize:20 }}>⚡</span>
            </div>
            <div style={{ flex:1 }}>
              <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'14px', fontWeight:700, color:'white', display:'block', marginBottom:2 }}>Interactive Simulator</span>
              <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', color:'rgba(255,255,255,.55)', fontWeight:500 }}>Build &amp; send real API requests</span>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,.4)"/>
          </motion.button>

          {/* Diagrams link */}
          <motion.button initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.2 }}
            whileHover={{ y:-2 }} whileTap={{ scale:.98 }} onClick={() => onNavigate('diagrams')}
            style={{ background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)',border:'1.5px solid #C7D2FE',borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',boxShadow:'0 2px 8px rgba(99,102,241,.08)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:18 }}>🗺️</span>
              <div style={{ textAlign:'left' }}>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:700,color:'#3730A3',display:'block' }}>Concept Diagrams</span>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',color:'#6366F1',fontWeight:500 }}>Client ↔ Server · Anatomy of a Request</span>
              </div>
            </div>
            <ChevronRight size={16} color="#6366F1"/>
          </motion.button>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.05 }}>
            <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'#A7A3AD',textTransform:'uppercase',margin:'0 0 12px' }}>Start Learning</p>

            {/* Course card */}
            <motion.div whileHover={{ y:-3,boxShadow:'0 2px 4px rgba(28,27,42,.06),0 20px 56px rgba(28,27,42,.12)' }}
              style={{ background:'#FFF',borderRadius:24,border:'1.5px solid #ECE8E1',boxShadow:'0 1px 2px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.08)',overflow:'hidden',transition:'box-shadow .25s' }}>

              {/* Hero */}
              <div style={{ background:`linear-gradient(135deg,${mod.accent}20,${mod.accent}08)`,padding:'24px 24px 20px',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:-20,right:-20,width:120,height:120,background:`${mod.accent}18`,borderRadius:'50%' }}/>
                <div style={{ position:'relative' }}>
                  <div style={{ display:'inline-flex',alignItems:'center',gap:5,background:'linear-gradient(135deg,#2E5BFF,#5B7BFF)',borderRadius:'100px',padding:'4px 12px',marginBottom:12,boxShadow:'0 2px 8px rgba(46,91,255,.25)' }}>
                    <span style={{ fontSize:10 }}>⭐</span>
                    <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:800,color:'white',letterSpacing:'.06em',textTransform:'uppercase' }}>Recommended</span>
                  </div>
                  <h2 style={{ fontFamily:'var(--atl-font-display)',fontSize:'22px',fontWeight:800,color:'#1C1B2A',margin:'0 0 6px',letterSpacing:'-0.02em' }}>
                    Module {modIdx+1} · {mod.title}
                  </h2>
                  <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',color:'#6B6A7B',margin:0,fontWeight:500 }}>{mod.subtitle}</p>
                  {/* Progress */}
                  <div style={{ marginTop:16 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                      <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:600,color:'#6B6A7B' }}>Progress</span>
                      <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:700,color:mod.accent }}>
                        {mod.lessons.filter(l => completedLessons.has(l.id)).length}/{mod.lessons.length} lessons
                      </span>
                    </div>
                    <div style={{ height:8,background:'#ECE8E1',borderRadius:'100px',overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${(mod.lessons.filter(l=>completedLessons.has(l.id)).length/mod.lessons.length)*100}%`,background:`linear-gradient(90deg,${mod.accent},${mod.accent}BB)`,borderRadius:'100px',transition:'width .6s ease' }}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lesson list */}
              <div style={{ padding:'0 24px' }}>
                {mod.lessons.map((l, i) => (
                  <LessonRow key={l.id} title={l.title} done={completedLessons.has(l.id)} current={!completedLessons.has(l.id) && i === mod.lessons.filter(ll=>completedLessons.has(ll.id)).length}/>
                ))}
              </div>

              <div style={{ padding:'20px 24px' }}>
                <TactileButton variant="primary" fullWidth onClick={() => onNavigate('lesson')}>
                  Start Lesson →
                </TactileButton>
              </div>
            </motion.div>
          </motion.div>

          {/* Module selectors */}
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.2 }}>
            <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'#A7A3AD',textTransform:'uppercase',margin:'0 0 10px' }}>All Modules</p>
            <div style={{ display:'flex',gap:10 }}>
              {MODULES.map((m, mi) => {
                const status = computeModuleStatus(mi, completedLessons);
                const locked = status === 'locked';
                return (
                  <motion.button key={m.id} whileHover={!locked?{ y:-3 }:{}} whileTap={!locked?{ scale:.97 }:{}}
                    onClick={() => !locked && onNavigate('path')}
                    style={{ flex:1,minWidth:72,border:`2px solid ${locked?'#ECE8E1':m.accent+'40'}`,background:locked?'#F9F7F4':`${m.accent}10`,borderRadius:14,padding:'12px 10px',cursor:locked?'default':'pointer',textAlign:'center',transition:'background .2s' }}>
                    <div style={{ width:32,height:32,background:locked?'#ECE8E1':`linear-gradient(135deg,${m.accent},${m.accent}CC)`,borderRadius:10,margin:'0 auto 6px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {locked ? <Lock size={14} color="#A7A3AD"/> : <BookOpen size={14} color="white"/>}
                    </div>
                    <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:600,color:locked?'#A7A3AD':'#1C1B2A',display:'block',lineHeight:1.2 }}>{m.title}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Path link */}
          <motion.button initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.26 }}
            whileHover={{ y:-2 }} whileTap={{ scale:.98 }} onClick={() => onNavigate('path')}
            style={{ background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:16,padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',boxShadow:'0 2px 8px rgba(28,27,42,.05)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:18 }}>🏔️</span>
              <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:700,color:'#1C1B2A' }}>View learning path</span>
            </div>
            <ChevronRight size={16} color="#A7A3AD"/>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
