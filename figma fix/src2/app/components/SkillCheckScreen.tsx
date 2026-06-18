import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { TactileButton } from "./TactileButton";
import { Mascot } from "./Mascot";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams' | 'simulator';

interface SkillCheckScreenProps {
  onNavigate: (v: View) => void;
}

export function SkillCheckScreen({ onNavigate }: SkillCheckScreenProps) {
  return (
    <div style={{ minHeight:'100%',background:'var(--atl-canvas)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',position:'relative',overflow:'hidden' }}>
      {/* Glow */}
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-60%)',width:400,height:400,background:'radial-gradient(circle,rgba(46,91,255,.07),transparent 70%)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:440,width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:32,position:'relative' }}>

        {/* Glossy check circle */}
        <motion.div initial={{ scale:0,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',stiffness:320,damping:20,delay:.1 }} style={{ position:'relative' }}>
          {/* Pulsing ring */}
          <motion.div
            animate={{ scale:[1,1.22,1], opacity:[0.4,0,0.4] }}
            transition={{ duration:2.2,repeat:Infinity,ease:'easeInOut' }}
            style={{ position:'absolute',inset:-16,borderRadius:'50%',border:'3px solid #2E5BFF',pointerEvents:'none' }}
          />
          <div style={{ width:120,height:120,borderRadius:'50%',background:'linear-gradient(135deg,#2E5BFF,#5B7BFF)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 40px rgba(46,91,255,.35),inset 0 1px 0 rgba(255,255,255,.3)',position:'relative' }}>
            <div style={{ position:'absolute',top:12,left:'25%',right:'25%',height:'2px',background:'rgba(255,255,255,.45)',borderRadius:'100px' }}/>
            <CheckCircle2 size={52} color="white" strokeWidth={2}/>
          </div>
        </motion.div>

        {/* Mascot */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.45 }}>
          <Mascot state="correct" size="md" showBubble bubbleText="Bạn đang làm tốt lắm!"/>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.55 }} style={{ textAlign:'center' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)',border:'1.5px solid #C7D2FE',borderRadius:'100px',padding:'5px 14px',marginBottom:16 }}>
            <span style={{ fontSize:12 }}>✨</span>
            <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:700,color:'#3730A3',letterSpacing:'.06em',textTransform:'uppercase' }}>Skill Check</span>
          </div>
          <h1 style={{ fontFamily:'var(--atl-font-display)',fontSize:'28px',fontWeight:800,color:'#1C1B2A',margin:'0 0 12px',letterSpacing:'-0.03em',lineHeight:1.2 }}>
            Kiểm tra kỹ năng<br/>Module 1
          </h1>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'16px',color:'#6B6A7B',margin:0,lineHeight:1.6,fontWeight:400 }}>
            Bạn đã học xong Module 1! Hãy làm một bài kiểm tra nhanh để củng cố kiến thức trước khi tiếp tục.
          </p>
        </motion.div>

        {/* Achievement chips */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.7 }}
          style={{ display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center' }}>
          {[{e:'🔵',t:'API là gì'},{e:'⚡',t:'HTTP Methods'},{e:'📋',t:'Status Codes'}].map(c => (
            <div key={c.t} style={{ display:'flex',alignItems:'center',gap:6,background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:'100px',padding:'6px 14px',boxShadow:'0 1px 4px rgba(28,27,42,.06)' }}>
              <span style={{ fontSize:14 }}>{c.e}</span>
              <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:600,color:'#1C1B2A' }}>{c.t}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.82 }}
          style={{ display:'flex',flexDirection:'column',gap:12,width:'100%' }}>
          <TactileButton variant="primary" fullWidth onClick={() => onNavigate('lesson')}>Bắt đầu kiểm tra →</TactileButton>
          <TactileButton variant="ghost" fullWidth size="md" onClick={() => onNavigate('home')}>Về trang chủ</TactileButton>
        </motion.div>
      </div>
    </div>
  );
}
