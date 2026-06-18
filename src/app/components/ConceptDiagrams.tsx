import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ArrowRight, RotateCcw } from "lucide-react";
import { PhoApiFlow } from "./PhoApiFlow";
import { ApiStoryFlow } from "./ApiStoryFlow";
import { APISimulator } from "./APISimulator";

type View = 'home' | 'path' | 'lesson' | 'result' | 'skill-check' | 'diagrams';

interface ConceptDiagramsProps {
  onNavigate: (v: View) => void;
}

function Pill({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:bg,borderRadius:'100px',padding:'4px 12px',marginBottom:10 }}>
      <span style={{ fontSize:12,color }}>●</span>
      <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:700,color,letterSpacing:'.06em',textTransform:'uppercase' as const }}>{label}</span>
    </div>
  );
}

function RequestResponseDiagram() {
  return (
    <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.1 }}
      style={{ background:'#FFF',borderRadius:24,padding:28,border:'1.5px solid #ECE8E1',boxShadow:'0 1px 2px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.07)' }}>
      <Pill color="#3B82F6" bg="#EEF2FF" label="Diagram 1"/>
      <h3 style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:800,color:'#1C1B2A',margin:'0 0 20px',letterSpacing:'-0.02em' }}>
        Client ↔ Server: Request &amp; Response
      </h3>

      <div style={{ background:'linear-gradient(135deg,#F8FAFF,#F5F3FF)',borderRadius:16,padding:'24px 20px',position:'relative',overflow:'hidden' }}>
        {/* Decorative dots */}
        {[...Array(5)].map((_,i) => (
          <div key={i} style={{ position:'absolute',width:6,height:6,borderRadius:'50%',background:i%2===0?'rgba(59,130,246,.14)':'rgba(139,92,246,.1)',top:`${15+i*14}%`,right:`${6+(i%3)*9}%` }}/>
        ))}

        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          {/* Client */}
          <div style={{ flex:1,background:'#FFF',borderRadius:16,padding:16,border:'2px solid #BFDBFE',boxShadow:'0 2px 12px rgba(59,130,246,.1)',textAlign:'center' }}>
            <div style={{ width:44,height:44,margin:'0 auto 10px',background:'linear-gradient(135deg,#3B82F6,#60A5FA)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(59,130,246,.3)' }}>
              <span style={{ fontSize:22 }}>💻</span>
            </div>
            <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'16px',fontWeight:800,color:'#1E40AF',display:'block' }}>Client</span>
            <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:500,color:'#60A5FA' }}>Browser / App</span>
          </div>

          {/* Arrows */}
          <div style={{ display:'flex',flexDirection:'column',gap:10,flex:1.3,alignItems:'center' }}>
            <div style={{ width:'100%',background:'linear-gradient(135deg,#EEF2FF,#DBEAFE)',borderRadius:12,padding:'10px 12px',border:'1.5px solid #BFDBFE' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,color:'#1D4ED8' }}>REQUEST</span>
                <ArrowRight size={14} color="#3B82F6"/>
              </div>
              <code style={{ fontFamily:'monospace',fontSize:'10px',color:'#1D4ED8',background:'rgba(59,130,246,.08)',padding:'3px 7px',borderRadius:6,display:'block',wordBreak:'break-all' as const }}>
                GET /api/users HTTP/1.1
              </code>
            </div>
            <div style={{ width:'100%',background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',borderRadius:12,padding:'10px 12px',border:'1.5px solid #A7F3D0' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
                <ArrowRight size={14} color="#10B981" style={{ transform:'rotate(180deg)' }}/>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,color:'#065F46' }}>RESPONSE</span>
              </div>
              <code style={{ fontFamily:'monospace',fontSize:'10px',color:'#065F46',background:'rgba(16,185,129,.08)',padding:'3px 7px',borderRadius:6,display:'block' }}>
                200 OK + JSON data
              </code>
            </div>
          </div>

          {/* Server */}
          <div style={{ flex:1,background:'#FFF',borderRadius:16,padding:16,border:'2px solid #A7F3D0',boxShadow:'0 2px 12px rgba(16,185,129,.1)',textAlign:'center' }}>
            <div style={{ width:44,height:44,margin:'0 auto 10px',background:'linear-gradient(135deg,#10B981,#34D399)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(16,185,129,.3)' }}>
              <span style={{ fontSize:22 }}>🖥️</span>
            </div>
            <span style={{ fontFamily:'var(--atl-font-display)',fontSize:'16px',fontWeight:800,color:'#065F46',display:'block' }}>Server</span>
            <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:500,color:'#34D399' }}>API Backend</span>
          </div>
        </div>

        {/* Key concepts */}
        <div style={{ display:'flex',gap:8,marginTop:16,flexWrap:'wrap' as const }}>
          {['HTTP Method','URL / Endpoint','Headers','Body (optional)','Status Code','JSON Data'].map((item,i) => (
            <div key={item} style={{ background:'#FFF',border:`1px solid ${i<4?'#BFDBFE':'#A7F3D0'}`,borderRadius:8,padding:'4px 10px',fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:600,color:i<4?'#1D4ED8':'#065F46' }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AnatomyDiagram() {
  return (
    <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.4,delay:.25 }}
      style={{ background:'#FFF',borderRadius:24,padding:28,border:'1.5px solid #ECE8E1',boxShadow:'0 1px 2px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.07)' }}>
      <Pill color="#7C3AED" bg="#F5F3FF" label="Diagram 2"/>
      <h3 style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:800,color:'#1C1B2A',margin:'0 0 20px',letterSpacing:'-0.02em' }}>
        Anatomy of a HTTP Request
      </h3>

      <div style={{ background:'linear-gradient(135deg,#FAFAFA,#F5F3FF)',borderRadius:16,padding:20,border:'1.5px solid #EDE9FE',display:'flex',flexDirection:'column',gap:14 }}>
        {/* Request line */}
        {[
          {
            num:'1', label:'Request Line',
            content: (
              <div style={{ display:'flex',alignItems:'center',gap:8,background:'#FFF',borderRadius:10,padding:'10px 12px',border:'1.5px solid #C4B5FD',boxShadow:'0 2px 8px rgba(139,92,246,.1)' }}>
                <div style={{ background:'linear-gradient(135deg,#8B5CF6,#A78BFA)',color:'white',borderRadius:6,padding:'3px 10px',fontSize:'12px',fontWeight:800,fontFamily:'monospace',flexShrink:0,boxShadow:'0 2px 6px rgba(139,92,246,.3)' }}>POST</div>
                <code style={{ fontFamily:'monospace',fontSize:'12px',color:'#4B5563',flex:1 }}>/api/users</code>
                <span style={{ fontFamily:'monospace',fontSize:'11px',color:'#9CA3AF',background:'#F3F4F6',borderRadius:6,padding:'2px 8px',flexShrink:0 }}>HTTP/1.1</span>
              </div>
            ),
          },
          {
            num:'2', label:'Headers',
            content: (
              <div style={{ background:'#FFF',borderRadius:10,padding:'10px 12px',border:'1.5px solid #FDE68A',boxShadow:'0 2px 8px rgba(245,158,11,.08)' }}>
                {[
                  { k:'Content-Type',  v:'application/json' },
                  { k:'Authorization', v:'Bearer eyJhbGci...' },
                  { k:'Accept',        v:'application/json' },
                ].map(h => (
                  <div key={h.k} style={{ display:'flex',gap:8,alignItems:'center',padding:'4px 0',borderBottom:'1px dashed #FEF3C7' }}>
                    <code style={{ fontFamily:'monospace',fontSize:'11px',color:'#92400E',fontWeight:600,flexShrink:0 }}>{h.k}:</code>
                    <code style={{ fontFamily:'monospace',fontSize:'11px',color:'#6B7280' }}>{h.v}</code>
                  </div>
                ))}
              </div>
            ),
          },
          {
            num:'3', label:'Request Body (JSON)',
            content: (
              <div style={{ background:'#FFF',borderRadius:10,padding:12,border:'1.5px solid #A7F3D0',fontFamily:'monospace',fontSize:'12px',lineHeight:1.7,boxShadow:'0 2px 8px rgba(16,185,129,.08)' }}>
                <span style={{ color:'#6B7280' }}>{'{'}</span><br/>
                <span style={{ paddingLeft:16 }}><span style={{ color:'#7C3AED' }}>"name"</span><span style={{ color:'#6B7280' }}>: </span><span style={{ color:'#065F46' }}>"Minh Nguyen"</span><span style={{ color:'#6B7280' }}>,</span></span><br/>
                <span style={{ paddingLeft:16 }}><span style={{ color:'#7C3AED' }}>"email"</span><span style={{ color:'#6B7280' }}>: </span><span style={{ color:'#065F46' }}>"minh@example.com"</span><span style={{ color:'#6B7280' }}>,</span></span><br/>
                <span style={{ paddingLeft:16 }}><span style={{ color:'#7C3AED' }}>"role"</span><span style={{ color:'#6B7280' }}>: </span><span style={{ color:'#065F46' }}>"tester"</span></span><br/>
                <span style={{ color:'#6B7280' }}>{'}'}</span>
              </div>
            ),
          },
        ].map(sec => (
          <div key={sec.num}>
            <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,color:'#A7A3AD',letterSpacing:'.08em',textTransform:'uppercase' as const,display:'block',marginBottom:6 }}>
              {sec.num}. {sec.label}
            </span>
            {sec.content}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

type Stage = 'intro' | 'play' | 'transition' | 'api' | 'welcome' | 'lab' | 'recap';

// Full-bleed cinematic line that fades in, holds, then fades out and calls onDone.
function Cinematic({ emoji, title, subtitle, tone, onDone }: {
  emoji: string; title: string; subtitle: string; tone: string; onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fade = { duration: 3.8, times: [0, .16, .78, 1], ease: 'easeInOut' as const };

  return (
    <motion.div
      key="cine"
      onClick={onDone}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}
      style={{ minHeight: '62vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', padding: 24 }}
    >
      <motion.div initial={{ scale: .5, opacity: 0 }} animate={{ scale: [.5, 1, 1, .92], opacity: [0, 1, 1, 0] }} transition={fade}
        style={{ fontSize: 'clamp(48px, 9vw, 72px)', marginBottom: 14, lineHeight: 1 }}>
        {emoji}
      </motion.div>
      <motion.h1 initial={{ y: 26, opacity: 0 }} animate={{ y: [26, 0, 0, -14], opacity: [0, 1, 1, 0] }} transition={fade}
        style={{ fontFamily: 'var(--atl-font-display)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#1C1B2A', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0, maxWidth: 640 }}>
        {title}
      </motion.h1>
      <motion.p initial={{ y: 18, opacity: 0 }} animate={{ y: [18, 0, 0, -8], opacity: [0, 1, 1, 0] }} transition={{ ...fade, times: [0, .24, .78, 1] }}
        style={{ fontFamily: 'var(--atl-font-body)', fontSize: 'clamp(15px, 2.4vw, 18px)', color: tone, fontWeight: 600, margin: '18px 0 0', maxWidth: 520, lineHeight: 1.5 }}>
        {subtitle}
      </motion.p>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0, 0, .55] }} transition={{ duration: 3.8, times: [0, .82, 1] }}
        style={{ marginTop: 30, fontFamily: 'var(--atl-font-body)', fontSize: '12px', color: '#A7A3AD', fontWeight: 600 }}>
        tap to skip →
      </motion.span>
    </motion.div>
  );
}

export function ConceptDiagrams({ onNavigate }: ConceptDiagramsProps) {
  const [stage, setStage] = useState<Stage>('intro');

  const SUBTITLES: Record<Stage, string> = {
    intro:      'A phở-shop story',
    play:       'The phở story',
    transition: 'Switching to HTTP terms…',
    api:        'The API story',
    welcome:    'You made it!',
    lab:        'Test all four methods',
    recap:      'The request, at a glance',
  };

  return (
    <div style={{ minHeight:'100%',background:'var(--atl-canvas)' }}>
      <div style={{ background:'#FFF',borderBottom:'1.5px solid #F2EFEA',padding:'14px 24px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 }}>
        <button onClick={() => onNavigate('home')} style={{ width:36,height:36,borderRadius:'50%',background:'#F2EFEA',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B6A7B',flexShrink:0 }}>
          <ChevronLeft size={18} strokeWidth={2.5}/>
        </button>
        <div>
          <h2 style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:800,color:'#1C1B2A',margin:0,letterSpacing:'-0.02em' }}>How API works?</h2>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#6B6A7B',margin:0,fontWeight:500 }}>{SUBTITLES[stage]}</p>
        </div>
      </div>

      <div style={{ maxWidth:720,margin:'0 auto',padding:'28px 24px 60px' }}>
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <Cinematic key="intro" emoji="🍜"
              title="You walk into a phở restaurant…"
              subtitle="Let's order a bowl and watch what really happens behind the scenes."
              tone="#C2410C" onDone={() => setStage('play')} />
          )}

          {stage === 'play' && (
            <motion.div key="play" initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:.35 }}>
              <PhoApiFlow onContinue={() => setStage('transition')} />
            </motion.div>
          )}

          {stage === 'transition' && (
            <Cinematic key="trans" emoji="🔌"
              title="Now, let's dive into the real API"
              subtitle="The exact same trip — but described in HTTP terms this time."
              tone="#2563EB" onDone={() => setStage('api')} />
          )}

          {stage === 'api' && (
            <motion.div key="api" initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:.35 }}>
              <ApiStoryFlow onContinue={() => setStage('welcome')} />
            </motion.div>
          )}

          {stage === 'welcome' && (
            <Cinematic key="welcome" emoji="🚀"
              title="Welcome to API Testing Lab"
              subtitle="Time to send real requests yourself — let's test all four methods."
              tone="#2E5BFF" onDone={() => setStage('lab')} />
          )}

          {stage === 'lab' && (
            <motion.div key="lab" initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-12 }} transition={{ duration:.35 }}
              style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <APISimulator/>
              <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
                <button onClick={() => setStage('recap')}
                  style={{ display:'inline-flex',alignItems:'center',gap:8,background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:'100px',padding:'10px 18px',cursor:'pointer',fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:700,color:'#6B6A7B',boxShadow:'0 1px 4px rgba(28,27,42,.06)' }}>
                  📋 Request anatomy reference
                </button>
                <button onClick={() => setStage('intro')}
                  style={{ display:'inline-flex',alignItems:'center',gap:8,background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:'100px',padding:'10px 18px',cursor:'pointer',fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:700,color:'#6B6A7B',boxShadow:'0 1px 4px rgba(28,27,42,.06)' }}>
                  <RotateCcw size={14}/> Restart story
                </button>
              </div>
            </motion.div>
          )}

          {stage === 'recap' && (
            <motion.div key="recap" initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} transition={{ duration:.4 }}
              style={{ display:'flex',flexDirection:'column',gap:24 }}>
              <RequestResponseDiagram/>
              <AnatomyDiagram/>

              <button onClick={() => setStage('lab')}
                style={{ alignSelf:'center',display:'inline-flex',alignItems:'center',gap:8,background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:'100px',padding:'10px 18px',cursor:'pointer',fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:700,color:'#6B6A7B',boxShadow:'0 1px 4px rgba(28,27,42,.06)' }}>
                ← Back to the Lab
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
