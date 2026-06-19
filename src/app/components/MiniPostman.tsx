import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Send, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { PostmanData } from "../data/courseData";
import { useIsMobile } from "./ui/use-mobile";

interface MiniPostmanProps {
  data: PostmanData;
  onResult: (correct: boolean) => void;
  phase: 'answering' | 'correct' | 'wrong';
}

const METHOD_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  GET:    { bg:'#DBEAFE', text:'#1D4ED8', border:'#93C5FD' },
  POST:   { bg:'#D1FAE5', text:'#065F46', border:'#6EE7B7' },
  PUT:    { bg:'#FEF3C7', text:'#92400E', border:'#FCD34D' },
  DELETE: { bg:'#FEE2E2', text:'#991B1B', border:'#FCA5A5' },
  PATCH:  { bg:'#F3E8FF', text:'#5B21B6', border:'#C4B5FD' },
};

function statusColor(code: number) {
  const fam = Math.floor(code / 100);
  if (fam === 2) return { bg:'#ECFDF3', border:'#BBF7D0', text:'#15803D', dot:'#22C55E' };
  if (fam === 4) return { bg:'#FFF1F2', border:'#FECDD3', text:'#9F1239', dot:'#F43F5E' };
  return                { bg:'#FFF7ED', border:'#FED7AA', text:'#92400E', dot:'#F97316' };
}

function JsonHighlight({ json }: { json: string }) {
  const lines = json.split('\n');
  return (
    <pre style={{ fontFamily:'monospace',fontSize:'13px',lineHeight:1.8,margin:0,overflow:'auto' }}>
      {lines.map((line, li) => {
        const keyVal = line.match(/^(\s*)(".*?"):\s*(".*?"|[\d.]+|true|false|null)(,?)$/);
        if (keyVal) {
          const [, indent, key, val, comma] = keyVal;
          const isStr  = val.startsWith('"');
          const isNum  = /^[\d.]+$/.test(val);
          const isBool = val==='true'||val==='false';
          const valColor = isStr ? '#065F46' : isNum ? '#D97706' : isBool ? '#2563EB' : '#9CA3AF';
          return (
            <div key={li}>
              <span style={{ color:'#9CA3AF' }}>{indent}</span>
              <span style={{ color:'#7C3AED' }}>{key}</span>
              <span style={{ color:'#6B7280' }}>: </span>
              <span style={{ color:valColor }}>{val}</span>
              <span style={{ color:'#6B7280' }}>{comma}</span>
            </div>
          );
        }
        return <div key={li} style={{ color:'#6B7280' }}>{line}</div>;
      })}
    </pre>
  );
}

export function MiniPostman({ data, onResult, phase }: MiniPostmanProps) {
  const isMobile = useIsMobile();
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; locked?: boolean }>>(
    data.headers.map(h => ({ ...h }))
  );
  const [body,      setBody]      = useState(data.body ?? '');
  const [sending,   setSending]   = useState(false);
  const [response,  setResponse]  = useState<{ status: number; statusText: string; body: string } | null>(
    data.debugMode ? (data.initialFailResponse ?? null) : null
  );
  const [sendCount, setSendCount] = useState(0);

  const mStyle = METHOD_STYLE[data.method] ?? METHOD_STYLE.GET;
  const isAnswering = phase === 'answering';

  const checkHeaders = () => {
    if (!data.requiredHeaders?.length) return true;
    return data.requiredHeaders.every(req =>
      headers.some(h => h.key.toLowerCase().trim() === req.key.toLowerCase().trim() && h.value.trim() !== '')
    );
  };

  const handleSend = async () => {
    if (sending || !isAnswering) return;
    setSending(true);
    setResponse(null);
    await new Promise(r => setTimeout(r, 900));
    setSendCount(n => n + 1);

    if (data.debugMode) {
      const ok = checkHeaders();
      setResponse(ok ? data.successResponse : data.initialFailResponse!);
      setSending(false);
      if (ok) onResult(true);
    } else {
      setResponse(data.successResponse);
      setSending(false);
      onResult(true);
    }
  };

  const addHeader = () => {
    setHeaders(prev => [...prev, { key:'', value:'' }]);
  };

  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    setHeaders(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
  };

  const removeHeader = (i: number) => {
    setHeaders(prev => prev.filter((_, idx) => idx !== i));
  };

  const resp = response;
  const sc   = resp ? statusColor(resp.status) : null;

  return (
    <div style={{ borderRadius:20,overflow:'hidden',border:'1.5px solid #ECE8E1',boxShadow:'0 2px 4px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.08)' }}>
      {/* Task bar */}
      <div style={{ background:'linear-gradient(135deg,#1C1B2A,#2D2C40)',padding:'12px 18px',display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ display:'flex',gap:5 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map(c => (
            <div key={c} style={{ width:10,height:10,borderRadius:'50%',background:c }}/>
          ))}
        </div>
        <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:600,color:'rgba(255,255,255,.7)',flex:1 }}>
          {data.task}
        </span>
      </div>

      <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)' }}>
        {/* ── LEFT: Request editor ── */}
        <div style={{ padding:20,borderRight: isMobile ? 'none' : '1.5px solid #F2EFEA',borderBottom: isMobile ? '1.5px solid #F2EFEA' : 'none',display:'flex',flexDirection:'column',gap:16 }}>

          {/* Debug hint */}
          {data.debugMode && sendCount === 0 && (
            <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
              style={{ display:'flex',gap:10,padding:'10px 14px',background:'#FFFBEB',border:'1.5px solid #FDE68A',borderRadius:12 }}>
              <AlertTriangle size={16} color="#D97706" style={{ flexShrink:0,marginTop:1 }}/>
              <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#92400E',margin:0,fontWeight:500 }}>
                {data.debugHint}
              </p>
            </motion.div>
          )}

          {/* Method + URL */}
          <div>
            <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#A7A3AD',marginBottom:6 }}>Request</p>
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <div style={{ background:mStyle.bg,border:`1.5px solid ${mStyle.border}`,borderRadius:8,padding:'7px 12px',fontFamily:'monospace',fontSize:'13px',fontWeight:800,color:mStyle.text,flexShrink:0 }}>
                {data.method}
              </div>
              <div style={{ flex:1,background:'#F9F7F4',border:'1.5px solid #ECE8E1',borderRadius:8,padding:'7px 12px',fontFamily:'monospace',fontSize:'12px',color:'#4B5563',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {data.url}
              </div>
            </div>
          </div>

          {/* Headers */}
          <div>
            <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#A7A3AD',marginBottom:8 }}>Headers</p>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {headers.map((h, i) => (
                <div key={i} style={{ display:'flex',gap:6,alignItems:'center' }}>
                  {h.locked ? (
                    <>
                      <div style={{ flex:1,background:'#F2EFEA',borderRadius:7,padding:'6px 10px',fontFamily:'monospace',fontSize:'11px',color:'#6B6A7B',display:'flex',alignItems:'center',gap:5 }}>
                        <Lock size={10} color="#A7A3AD"/>{h.key}
                      </div>
                      <div style={{ flex:1.2,background:'#F2EFEA',borderRadius:7,padding:'6px 10px',fontFamily:'monospace',fontSize:'11px',color:'#6B6A7B' }}>{h.value}</div>
                    </>
                  ) : (
                    <>
                      <input
                        value={h.key}
                        onChange={e => updateHeader(i, 'key', e.target.value)}
                        placeholder="Header name"
                        style={{ flex:1,background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:7,padding:'6px 10px',fontFamily:'monospace',fontSize:'11px',color:'#1C1B2A',outline:'none' }}
                      />
                      <input
                        value={h.value}
                        onChange={e => updateHeader(i, 'value', e.target.value)}
                        placeholder="Value"
                        style={{ flex:1.2,background:'#FFF',border:'1.5px solid #ECE8E1',borderRadius:7,padding:'6px 10px',fontFamily:'monospace',fontSize:'11px',color:'#1C1B2A',outline:'none' }}
                      />
                      <button onClick={() => removeHeader(i)} style={{ width:24,height:24,border:'none',background:'transparent',cursor:'pointer',color:'#A7A3AD',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%' }}>
                        <Trash2 size={13}/>
                      </button>
                    </>
                  )}
                </div>
              ))}
              <button onClick={addHeader}
                style={{ display:'flex',alignItems:'center',gap:5,background:'none',border:'1.5px dashed #D1C8BF',borderRadius:8,padding:'5px 12px',cursor:'pointer',fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:600,color:'#A7A3AD',width:'fit-content' }}>
                <Plus size={13}/> Add header
              </button>
            </div>
          </div>

          {/* Body */}
          {data.showBody && (
            <div>
              <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#A7A3AD',marginBottom:8 }}>Body — JSON</p>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                style={{ width:'100%',boxSizing:'border-box',background:'#1C1B2A',color:'#8FE34A',fontFamily:'monospace',fontSize:'12px',lineHeight:1.7,padding:'12px',borderRadius:10,border:'none',outline:'none',resize:'none',minHeight:96 }}
              />
            </div>
          )}

          {/* Send button */}
          <motion.button
            whileHover={isAnswering && !sending ? { y:-1,filter:'brightness(1.06)' } : {}}
            whileTap={isAnswering && !sending ? { y:3 } : {}}
            onClick={handleSend}
            disabled={sending || !isAnswering}
            style={{
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              height:48,borderRadius:'100px',border:'none',
              background: sending ? '#A7A3AD' : 'linear-gradient(135deg,#2E5BFF,#5B7BFF)',
              color:'white',fontFamily:'var(--atl-font-body)',fontSize:'15px',fontWeight:700,
              cursor: sending || !isAnswering ? 'default' : 'pointer',
              boxShadow: sending ? 'none' : 'inset 0 1px 0 rgba(255,255,255,.2),0 4px 0 #1E3FCC,0 8px 24px rgba(46,91,255,.28)',
              position:'relative',overflow:'hidden',
            }}
          >
            {sending ? (
              <SendingDots/>
            ) : (
              <>
                <span>Send</span>
                <Send size={15}/>
              </>
            )}
            {!sending && (
              <span style={{ position:'absolute',top:0,left:'15%',right:'15%',height:'1px',background:'rgba(255,255,255,.25)',borderRadius:'100px' }}/>
            )}
          </motion.button>
        </div>

        {/* ── RIGHT: Response panel ── */}
        <div style={{ padding:20,background:'#FAFAF9',display:'flex',flexDirection:'column',gap:12,minHeight:280 }}>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#A7A3AD',margin:0 }}>Response</p>

          <AnimatePresence mode="wait">
            {sending ? (
              <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12 }}>
                <div style={{ display:'flex',gap:6 }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ y:[0,-8,0] }} transition={{ duration:.6,repeat:Infinity,delay:i*.15 }}
                      style={{ width:8,height:8,borderRadius:'50%',background:'#2E5BFF' }}/>
                  ))}
                </div>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#A7A3AD' }}>Sending...</span>
              </motion.div>
            ) : resp && sc ? (
              <motion.div key={`resp-${sendCount}`} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ type:'spring',stiffness:400,damping:28 }}
                style={{ display:'flex',flexDirection:'column',gap:12,flex:1 }}>
                {/* Status pill */}
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <motion.div initial={{ scale:.7,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',stiffness:600,damping:24,delay:.1 }}
                    style={{ display:'flex',alignItems:'center',gap:8,background:sc.bg,border:`2px solid ${sc.border}`,borderRadius:'100px',padding:'6px 14px' }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',background:sc.dot }}/>
                    <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:800,color:sc.text }}>
                      {resp.status} {resp.statusText}
                    </span>
                  </motion.div>
                  <span style={{ fontFamily:'monospace',fontSize:'12px',color:'#A7A3AD' }}>127 ms</span>
                </div>

                {/* Body */}
                <div style={{ background:'#FFF',borderRadius:12,padding:14,border:'1.5px solid #ECE8E1',flex:1,overflow:'auto' }}>
                  <JsonHighlight json={resp.body}/>
                </div>

                {/* Debug success indicator */}
                {data.debugMode && resp.status >= 200 && resp.status < 300 && (
                  <motion.div initial={{ opacity:0,scale:.9 }} animate={{ opacity:1,scale:1 }} transition={{ delay:.2 }}
                    style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'#ECFDF3',border:'1.5px solid #BBF7D0',borderRadius:10 }}>
                    <CheckCircle2 size={15} color="#22C55E"/>
                    <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:600,color:'#15803D' }}>Bug fixed! Request succeeded.</span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:10,border:'2px dashed #ECE8E1',borderRadius:14 }}>
                <Send size={28} color="#D1C8BF"/>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#A7A3AD',fontWeight:500 }}>Hit Send to see the response</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SendingDots() {
  return (
    <div style={{ display:'flex',gap:5,alignItems:'center' }}>
      {[0,1,2].map(i => (
        <motion.div key={i} animate={{ scale:[1,1.4,1] }} transition={{ duration:.6,repeat:Infinity,delay:i*.12 }}
          style={{ width:6,height:6,borderRadius:'50%',background:'white' }}/>
      ))}
    </div>
  );
}
