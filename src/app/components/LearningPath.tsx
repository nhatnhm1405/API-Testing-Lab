import { motion } from "motion/react";
import { CheckCircle2, Lock, Play, ChevronLeft, Zap } from "lucide-react";
import { Mascot } from "./Mascot";
import { MODULES, computeModuleStatus } from "../data/courseData";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams';

interface LearningPathProps {
  onNavigate: (v: View) => void;
  completedLessons: Set<string>;
}

function CandyNode({ status, accent, lessonTitle, onClick, showMascot, offset }: {
  status: 'completed' | 'current' | 'locked';
  accent: string;
  lessonTitle: string;
  onClick?: () => void;
  showMascot?: boolean;
  offset: number;
}) {
  const ml = [0, 88, 44][offset % 3];
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginLeft:ml }}>
      {showMascot && <div style={{ marginBottom:-8,zIndex:2,position:'relative' }}><Mascot state="idle" size="sm"/></div>}

      <motion.button
        whileHover={status!=='locked'?{ scale:1.08,boxShadow:`0 20px 48px rgba(28,27,42,.18),0 0 0 6px ${accent}28` }:{}}
        whileTap={status!=='locked'?{ scale:.95 }:{}}
        animate={status==='current'?{ boxShadow:[`0 12px 32px rgba(28,27,42,.14),0 0 0 4px ${accent}25`,`0 12px 32px rgba(28,27,42,.14),0 0 0 11px ${accent}00`], transition:{ duration:1.8,repeat:Infinity,ease:'easeInOut' } }:{}}
        onClick={status!=='locked'?onClick:undefined}
        style={{ width:72,height:72,borderRadius:'50%',border:'none',cursor:status!=='locked'?'pointer':'default',position:'relative',outline:'none',display:'flex',alignItems:'center',justifyContent:'center',
          background:status==='completed'?'linear-gradient(135deg,#D1FAE5,#A7F3D0)':status==='current'?`linear-gradient(135deg,white,${accent}22)`:'#EDE9E2',
          boxShadow:status==='completed'?'0 4px 16px rgba(34,197,94,.2),0 1px 3px rgba(28,27,42,.1)':status==='current'?`0 12px 32px rgba(28,27,42,.14),0 0 0 5px ${accent}22`:'0 2px 8px rgba(28,27,42,.08)' }}>
        {status==='current' && (
          <>
            <div style={{ position:'absolute',inset:3,borderRadius:'50%',background:`radial-gradient(circle at 35% 30%,rgba(255,255,255,.9),${accent}30)`,border:`2px solid ${accent}50` }}/>
            <div style={{ position:'absolute',top:8,left:'30%',right:'30%',height:'1px',background:'rgba(255,255,255,.8)',borderRadius:'100px' }}/>
          </>
        )}
        <span style={{ position:'relative',zIndex:1,display:'flex' }}>
          {status==='completed'?<CheckCircle2 size={28} color="#22C55E" strokeWidth={2.5}/>:status==='current'?<Play size={22} fill={accent} color={accent} style={{ marginLeft:3 }}/>:<Lock size={20} color="#A7A3AD"/>}
        </span>
      </motion.button>

      <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:600,color:status==='locked'?'#A7A3AD':'#1C1B2A',textAlign:'center',maxWidth:90,lineHeight:1.3 }}>
        {lessonTitle}
      </span>
    </div>
  );
}

export function LearningPath({ onNavigate, completedLessons }: LearningPathProps) {
  return (
    <div style={{ minHeight:'100%',background:'var(--atl-canvas)' }}>
      <div style={{ position:'fixed',top:0,right:0,width:300,height:300,background:'radial-gradient(circle,rgba(46,91,255,.04),transparent 70%)',pointerEvents:'none',zIndex:0 }}/>

      {/* Header */}
      <div style={{ background:'#FFF',borderBottom:'1.5px solid #F2EFEA',padding:'14px 24px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 }}>
        <button onClick={() => onNavigate('home')} style={{ width:36,height:36,borderRadius:'50%',background:'#F2EFEA',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B6A7B',flexShrink:0 }}>
          <ChevronLeft size={18} strokeWidth={2.5}/>
        </button>
        <div style={{ flex:1 }}>
          <h2 style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:800,color:'#1C1B2A',margin:0,letterSpacing:'-0.02em' }}>Learning Path</h2>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#6B6A7B',margin:0,fontWeight:500 }}>{completedLessons.size} lessons completed</p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:4,background:'linear-gradient(135deg,#F9FCE4,#F0FAB8)',border:'1.5px solid #D9EF6A',borderRadius:'100px',padding:'5px 12px' }}>
          <Zap size={14} fill="#B9E534" color="#B9E534" strokeWidth={0}/>
          <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:700,color:'#5A700A' }}>15</span>
        </div>
      </div>

      {/* Path */}
      <div style={{ maxWidth:380,margin:'0 auto',padding:'32px 24px 80px',position:'relative',zIndex:1 }}>
        {MODULES.map((mod, mi) => {
          const status       = computeModuleStatus(mi, completedLessons);
          const locked       = status === 'locked';
          const doneCount    = mod.lessons.filter(l => completedLessons.has(l.id)).length;
          const currentIdx   = doneCount;

          return (
            <div key={mod.id} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
              {/* Chapter pill */}
              <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:mi*.1 }}
                style={{ display:'flex',alignItems:'center',gap:10,background:locked?'#F2EFEA':`linear-gradient(135deg,${mod.accent}18,${mod.accent}08)`,border:`2px solid ${locked?'#ECE8E1':mod.accent+'30'}`,borderRadius:'100px',padding:'7px 20px',marginBottom:20 }}>
                {locked && <Lock size={12} color="#A7A3AD"/>}
                <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'14px',fontWeight:700,color:locked?'#A7A3AD':mod.accent,letterSpacing:'-0.01em' }}>
                  Module {mi+1} · {mod.title}
                </span>
                {!locked && (
                  <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:600,color:mod.accent,background:`${mod.accent}15`,borderRadius:'100px',padding:'2px 8px' }}>
                    {doneCount}/{mod.lessons.length}
                  </span>
                )}
              </motion.div>

              {/* Nodes */}
              {mod.lessons.map((lesson, li) => {
                const isDone    = completedLessons.has(lesson.id);
                const isCurrent = !locked && li === currentIdx && !isDone;
                const nodeStatus = locked ? 'locked' : isDone ? 'completed' : isCurrent ? 'current' : 'locked';
                return (
                  <motion.div key={lesson.id} initial={{ opacity:0,scale:.8 }} animate={{ opacity:1,scale:1 }}
                    transition={{ duration:.35,delay:mi*.1+li*.06,type:'spring',stiffness:400,damping:28 }}>
                    <CandyNode
                      status={nodeStatus} accent={mod.nodeColor[0]}
                      lessonTitle={lesson.title}
                      onClick={isCurrent ? () => onNavigate('lesson') : undefined}
                      showMascot={isCurrent}
                      offset={li}
                    />
                  </motion.div>
                );
              })}

              <div style={{ width:2,height:28,background:'linear-gradient(180deg,#ECE8E1,transparent)',margin:'8px 0' }}/>
            </div>
          );
        })}

        {/* Finish trophy */}
        <motion.div initial={{ opacity:0,scale:.8 }} animate={{ opacity:1,scale:1 }} transition={{ duration:.4,delay:.5,type:'spring',stiffness:300 }}
          style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
          <div style={{ width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#FEF3C7,#FDE68A)',border:'3px solid #FCD34D',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(253,211,77,.3)' }}>
            <span style={{ fontSize:28 }}>🏆</span>
          </div>
          <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:600,color:'#A7A3AD' }}>Course complete!</span>
        </motion.div>
      </div>
    </div>
  );
}
