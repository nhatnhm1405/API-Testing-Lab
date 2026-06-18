import { motion } from "motion/react";
import { ChevronLeft, AlertCircle, Lightbulb, PartyPopper } from "lucide-react";
import { findLesson, getLessonPrompt } from "../data/courseData";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator' | 'review';

interface MistakesReviewProps {
  onNavigate: (v: View) => void;
  mistakes: Set<string>;
}

export function MistakesReview({ onNavigate, mistakes }: MistakesReviewProps) {
  const entries = [...mistakes]
    .map(id => findLesson(id))
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.moduleIdx - b.moduleIdx);

  return (
    <div style={{ minHeight:'100%',background:'var(--atl-canvas)' }}>
      {/* Header */}
      <div style={{ background:'#FFF',borderBottom:'1.5px solid #F2EFEA',padding:'14px 24px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 }}>
        <button onClick={() => onNavigate('home')} style={{ width:36,height:36,borderRadius:'50%',background:'#F2EFEA',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B6A7B',flexShrink:0 }}>
          <ChevronLeft size={18} strokeWidth={2.5}/>
        </button>
        <div>
          <h2 style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:800,color:'#1C1B2A',margin:0,letterSpacing:'-0.02em' }}>Review your mistakes</h2>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#6B6A7B',margin:0,fontWeight:500 }}>
            {entries.length} question{entries.length === 1 ? '' : 's'} to revisit
          </p>
        </div>
      </div>

      <div style={{ maxWidth:680,margin:'0 auto',padding:'28px 24px 60px',display:'flex',flexDirection:'column',gap:14 }}>
        {entries.length === 0 ? (
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4 }}
            style={{ background:'#FFF',borderRadius:24,padding:'48px 32px',border:'1.5px solid #ECE8E1',boxShadow:'0 1px 2px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.06)',display:'flex',flexDirection:'column',alignItems:'center',gap:14,textAlign:'center' }}>
            <div style={{ width:64,height:64,borderRadius:20,background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',border:'1.5px solid #A7F3D0',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <PartyPopper size={30} color="#16A34A"/>
            </div>
            <div>
              <p style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:800,color:'#1C1B2A',margin:'0 0 6px' }}>No mistakes yet!</p>
              <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',color:'#6B6A7B',margin:0,fontWeight:500 }}>Anything you miss will show up here with an explanation.</p>
            </div>
          </motion.div>
        ) : (
          entries.map((e, i) => (
            <motion.div key={e.lesson.id} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.35,delay:i*.05 }}
              style={{ background:'#FFF',borderRadius:18,padding:'18px 20px',border:'1.5px solid #ECE8E1',boxShadow:'0 1px 2px rgba(28,27,42,.05),0 6px 20px rgba(28,27,42,.05)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,color:e.module.accent,background:`${e.module.accent}18`,borderRadius:'100px',padding:'3px 10px' }}>
                  {e.module.title}
                </span>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:600,color:'#A7A3AD' }}>{e.lesson.title}</span>
                <span style={{ marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:4,color:'#E11D48' }}>
                  <AlertCircle size={14}/>
                  <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700 }}>Got wrong</span>
                </span>
              </div>

              <p style={{ fontFamily:'var(--atl-font-display)',fontSize:'16px',fontWeight:700,color:'#1C1B2A',margin:'0 0 12px',lineHeight:1.4,letterSpacing:'-0.01em' }}>
                {getLessonPrompt(e.lesson.data)}
              </p>

              <div style={{ display:'flex',gap:10,background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)',border:'1.5px solid #FDE68A',borderRadius:12,padding:'12px 14px' }}>
                <Lightbulb size={16} color="#D97706" style={{ flexShrink:0,marginTop:1 }}/>
                <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#92400E',margin:0,lineHeight:1.55,fontWeight:500 }}>
                  {e.lesson.data.explanation}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
