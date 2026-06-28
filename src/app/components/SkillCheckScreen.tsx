import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { TactileButton } from "./TactileButton";
import { Mascot } from "./Mascot";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams';

interface SkillCheckScreenProps {
  onNavigate: (v: View) => void;
  onNextModule: () => void;
  moduleNumber: number;
  moduleTitle: string;
  accent: string;
  topics: string[];
  isLastModule: boolean;
}

export function SkillCheckScreen({ onNavigate, onNextModule, moduleNumber, moduleTitle, accent, topics, isLastModule }: SkillCheckScreenProps) {
  return (
    <div style={{ minHeight:'100%',background:'var(--atl-canvas)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',position:'relative',overflow:'hidden' }}>
      {/* Glow */}
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-60%)',width:400,height:400,background:`radial-gradient(circle,${accent}12,transparent 70%)`,pointerEvents:'none' }}/>

      <div style={{ maxWidth:440,width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:32,position:'relative' }}>

        {/* Glossy check circle */}
        <motion.div initial={{ scale:0,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',stiffness:320,damping:20,delay:.1 }} style={{ position:'relative' }}>
          {/* Pulsing ring */}
          <motion.div
            animate={{ scale:[1,1.22,1], opacity:[0.4,0,0.4] }}
            transition={{ duration:2.2,repeat:Infinity,ease:'easeInOut' }}
            style={{ position:'absolute',inset:-16,borderRadius:'50%',border:`3px solid ${accent}`,pointerEvents:'none' }}
          />
          <div style={{ width:120,height:120,borderRadius:'50%',background:`linear-gradient(135deg,${accent},${accent}AA)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 8px 40px ${accent}59,inset 0 1px 0 rgba(255,255,255,.3)`,position:'relative' }}>
            <div style={{ position:'absolute',top:12,left:'25%',right:'25%',height:'2px',background:'rgba(255,255,255,.45)',borderRadius:'100px' }}/>
            <CheckCircle2 size={52} color="white" strokeWidth={2}/>
          </div>
        </motion.div>

        {/* Mascot */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.45 }}>
          <Mascot state="correct" size="md" showBubble bubbleText="You're doing great!"/>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.55 }} style={{ textAlign:'center' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)',border:'1.5px solid #C7D2FE',borderRadius:'100px',padding:'5px 14px',marginBottom:16 }}>
            <span style={{ fontSize:12 }}>✨</span>
            <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:700,color:'#3730A3',letterSpacing:'.06em',textTransform:'uppercase' }}>Skill Check</span>
          </div>
          <h1 style={{ fontFamily:'var(--atl-font-display)',fontSize:'28px',fontWeight:800,color:'#1C1B2A',margin:'0 0 12px',letterSpacing:'-0.03em',lineHeight:1.2 }}>
            Skill Check<br/>Module {moduleNumber} · {moduleTitle}
          </h1>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'16px',color:'#6B6A7B',margin:0,lineHeight:1.6,fontWeight:400 }}>
            You've finished Module {moduleNumber}! Take a quick check to reinforce what you learned{isLastModule ? '' : ' before moving on'}.
          </p>
        </motion.div>

        {/* Achievement chips */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.7 }}
          style={{ display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center' }}>
          {topics.map(t => (
            <div key={t} style={{ display:'flex',alignItems:'center',gap:7,background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:'100px',padding:'6px 14px',boxShadow:'0 1px 4px rgba(28,27,42,.06)' }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:accent,flexShrink:0 }}/>
              <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:600,color:'#1C1B2A' }}>{t}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.82 }}
          style={{ display:'flex',flexDirection:'column',gap:12,width:'100%' }}>
          {isLastModule ? (
            <TactileButton variant="primary" fullWidth onClick={() => onNavigate('path')}>View learning path →</TactileButton>
          ) : (
            <TactileButton variant="primary" fullWidth onClick={onNextModule}>Continue to next module →</TactileButton>
          )}
          <TactileButton variant="ghost" fullWidth size="md" onClick={() => onNavigate('home')}>Back to home</TactileButton>
        </motion.div>
      </div>
    </div>
  );
}
