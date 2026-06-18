import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, Plus, Trash2, ChevronDown, ChevronRight,
  X, Lightbulb, Zap, RotateCcw, Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Mascot } from "./Mascot";
import { TactileButton } from "./TactileButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type SimState = 'empty' | 'ready' | 'sending' | 'correct'
              | 'wrong-method' | 'wrong-url' | 'wrong-auth';
type TravelPhase = 'idle' | 'outbound' | 'server-flash' | 'inbound' | 'done';
type DemoMode   = 'normal' | 'debug';

interface Header { key: string; value: string; locked?: boolean }

// ── Design tokens ─────────────────────────────────────────────────────────────

const M: Record<string, { grad: string; ledge: string; muted: string; text: string; border: string }> = {
  GET:    { grad:'linear-gradient(135deg,#2E5BFF,#5B7BFF)', ledge:'#1E3FCC', muted:'#EEF2FF', text:'#1D4ED8', border:'#93C5FD' },
  POST:   { grad:'linear-gradient(135deg,#10B981,#34D399)', ledge:'#059669', muted:'#ECFDF5', text:'#065F46', border:'#6EE7B7' },
  PUT:    { grad:'linear-gradient(135deg,#F59E0B,#FCD34D)', ledge:'#D97706', muted:'#FFFBEB', text:'#92400E', border:'#FDE68A' },
  DELETE: { grad:'linear-gradient(135deg,#F43F5E,#FB7185)', ledge:'#C1132F', muted:'#FFF1F2', text:'#9F1239', border:'#FECACA' },
};

const SCENARIO = {
  normal: {
    task:     '🎯 Send a GET request to fetch the user with ID 1.',
    urlBase:  'https://api.example.com/users/',
    urlHint:  '1',
    correctMethod: 'GET',
    correctId:     '1',
    hints: [
      'Which HTTP method reads data without changing anything?',
      'The URL pattern for a specific user is /users/{id}',
      "Type '1' in the URL field — that's the user's ID.",
    ],
    successResponse: {
      status: 200, statusText: 'OK',
      lines: ['{', '  "id": 1,', '  "name": "Ada Lovelace",', '  "role": "admin"', '}'],
    },
    wrongMethodResponse: {
      status: 405, statusText: 'Method Not Allowed',
      lines: ['{', '  "error": "Use GET to read data, not POST."', '}'],
    },
    wrongUrlResponse: {
      status: 404, statusText: 'Not Found',
      lines: ['{', '  "error": "User not found."', '}'],
    },
    explanation: [
      { label: 'Method', value: 'GET', color: '#2E5BFF', bg: '#EEF2FF', note: 'Reads data — no side effects, no changes on the server.' },
      { label: 'URL', value: '/users/1', color: '#D97706', bg: '#FFFBEB', note: 'Identifies exactly which resource: the user whose ID is 1.' },
      { label: 'Response', value: '200 OK', color: '#059669', bg: '#ECFDF5', note: 'Success — the server found the resource and returned it.' },
    ],
  },
  debug: {
    task:     '🔐 This request returns 401. Add the missing Authorization header to fix it.',
    urlBase:  'https://api.example.com/',
    urlHint:  'profile',
    correctMethod: 'GET',
    correctId:     'profile',
    hints: [
      'Protected endpoints require credentials — the server needs to know who you are.',
      "Add a header named 'Authorization' with a Bearer token value.",
      "Key: Authorization  ·  Value: Bearer <token>",
    ],
    initialFail: {
      status: 401, statusText: 'Unauthorized',
      lines: ['{', '  "error": "Missing or invalid', '           Authorization header."', '}'],
    },
    successResponse: {
      status: 200, statusText: 'OK',
      lines: ['{', '  "id": 1,', '  "name": "Minh Nhat",', '  "role": "admin"', '}'],
    },
    wrongMethodResponse: {
      status: 405, statusText: 'Method Not Allowed',
      lines: ['{', '  "error": "Method not allowed."', '}'],
    },
    wrongUrlResponse: { status: 404, statusText: 'Not Found', lines: ['{', '  "error": "Not found."', '}'] },
    explanation: [
      { label: 'Problem', value: '401 Unauthorized', color: '#9F1239', bg: '#FFF1F2', note: 'The server rejected the request — no valid credentials were provided.' },
      { label: 'Fix', value: 'Authorization header', color: '#D97706', bg: '#FFFBEB', note: '"Authorization: Bearer <token>" proves your identity on every protected request.' },
      { label: 'Result', value: '200 OK', color: '#059669', bg: '#ECFDF5', note: 'With the correct header the server authenticates you and returns the data.' },
    ],
  },
} as const;

// ── Status pill helper ─────────────────────────────────────────────────────────

function statusStyle(code: number) {
  const f = Math.floor(code / 100);
  if (f === 2) return { bg:'#ECFDF3', border:'#BBF7D0', text:'#15803D', dot:'#22C55E' };
  if (f === 4) return { bg:'#FFF1F2', border:'#FECDD3', text:'#9F1239', dot:'#F43F5E' };
  return              { bg:'#FFF7ED', border:'#FED7AA', text:'#92400E', dot:'#F97316' };
}

// ── JSON syntax highlighter ────────────────────────────────────────────────────

function JsonLine({ line }: { line: string }) {
  const kv = line.match(/^(\s*)(".*?"):\s*(".*?"|[\d.]+|true|false|null)(,?)$/);
  if (kv) {
    const [, indent, key, val, comma] = kv;
    const isStr  = val.startsWith('"');
    const isNum  = /^[\d.]+$/.test(val);
    const vc     = isStr ? '#065F46' : isNum ? '#D97706' : '#2563EB';
    return (
      <span>
        <span style={{ color:'#9CA3AF' }}>{indent}</span>
        <span style={{ color:'#7C3AED' }}>{key}</span>
        <span style={{ color:'#9CA3AF' }}>: </span>
        <span style={{ color:vc }}>{val}</span>
        <span style={{ color:'#9CA3AF' }}>{comma}</span>
      </span>
    );
  }
  return <span style={{ color:'#9CA3AF' }}>{line}</span>;
}

// ── Travel diagram ─────────────────────────────────────────────────────────────

function TravelDiagram({ phase }: { phase: TravelPhase }) {
  const serverGlow = phase === 'server-flash' || phase === 'inbound' || phase === 'done';
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'28px 24px', gap:0, position:'relative' }}>
      {/* Client node */}
      <motion.div
        animate={phase === 'outbound' ? { scale:[1,1.06,1], transition:{ duration:.35 } } : {}}
        style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#EEF2FF,#DBEAFE)', border:'2px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, boxShadow:'0 4px 12px rgba(59,130,246,.15)', zIndex:1 }}>
        💻
      </motion.div>

      {/* Track */}
      <div style={{ flex:1, height:3, background:'#ECE8E1', position:'relative', margin:'0 10px', borderRadius:2 }}>
        {/* Outbound dot */}
        <AnimatePresence>
          {(phase === 'outbound' || phase === 'server-flash') && (
            <motion.div key="out"
              initial={{ left:0, scale:0 }} animate={{ left:'calc(100% - 12px)', scale:1 }} exit={{ opacity:0 }}
              transition={{ duration:.55, ease:[.34,1.56,.64,1] }}
              style={{ position:'absolute', top:-5, width:14, height:14, borderRadius:'50%', background:'linear-gradient(135deg,#2E5BFF,#5B7BFF)', boxShadow:'0 0 10px rgba(46,91,255,.55)', zIndex:2 }}
            />
          )}
        </AnimatePresence>
        {/* Inbound dot */}
        <AnimatePresence>
          {(phase === 'inbound') && (
            <motion.div key="in"
              initial={{ right:0, scale:0 }} animate={{ right:'calc(100% - 12px)', scale:1 }}
              transition={{ duration:.55, ease:[.34,1.56,.64,1] }}
              style={{ position:'absolute', top:-5, width:14, height:14, borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#8FE34A)', boxShadow:'0 0 10px rgba(34,197,94,.55)', zIndex:2 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Server node */}
      <motion.div
        animate={serverGlow
          ? { scale:[1,1.12,1.04,1], boxShadow:['0 4px 12px rgba(16,185,129,.15)','0 0 28px rgba(16,185,129,.5)','0 4px 12px rgba(16,185,129,.15)'], transition:{ duration:.4 } }
          : {}}
        style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border:`2px solid ${serverGlow?'#34D399':'#A7F3D0'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, zIndex:1 }}>
        🖥️
      </motion.div>

      {/* Labels */}
      <div style={{ position:'absolute', bottom:6, left:0, width:56, textAlign:'center', fontFamily:'var(--atl-font-body)', fontSize:10, fontWeight:600, color:'#A7A3AD' }}>Client</div>
      <div style={{ position:'absolute', bottom:6, right:0, width:56, textAlign:'center', fontFamily:'var(--atl-font-body)', fontSize:10, fontWeight:600, color:'#A7A3AD' }}>Server</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface APISimulatorProps { onClose?: () => void }

export function APISimulator({ onClose }: APISimulatorProps) {
  const [mode,         setMode]         = useState<DemoMode>('normal');
  const [method,       setMethod]       = useState('GET');
  const [urlSuffix,    setUrlSuffix]    = useState('');
  const [headers,      setHeaders]      = useState<Header[]>([]);
  const [headersOpen,  setHeadersOpen]  = useState(false);
  const [simState,     setSimState]     = useState<SimState>('empty');
  const [travelPhase,  setTravelPhase]  = useState<TravelPhase>('idle');
  const [visibleLines, setVisibleLines] = useState(0);
  const [hintIdx,      setHintIdx]      = useState(-1);
  const [showWhy,      setShowWhy]      = useState(false);

  const confettiFired = useRef(false);
  const sc            = SCENARIO[mode] as typeof SCENARIO.normal & typeof SCENARIO.debug;

  // Readiness
  const isReady = urlSuffix.trim().length > 0;

  // Reset on mode switch
  const switchMode = (m: DemoMode) => {
    setMode(m);
    setMethod('GET');
    setUrlSuffix(m === 'debug' ? 'profile' : '');
    setHeaders([]);
    setHeadersOpen(m === 'debug');
    setSimState('empty');
    setTravelPhase('idle');
    setVisibleLines(0);
    setHintIdx(-1);
    confettiFired.current = false;
  };

  const checkCorrect = () => {
    if (method !== sc.correctMethod) return false;
    if (urlSuffix.trim() !== sc.correctId) return false;
    if (mode === 'debug') {
      return headers.some(h => h.key.toLowerCase().trim() === 'authorization' && h.value.trim() !== '');
    }
    return true;
  };

  const getWrongState = (): SimState => {
    if (method !== sc.correctMethod) return 'wrong-method';
    if (urlSuffix.trim() !== sc.correctId) return 'wrong-url';
    return 'wrong-auth';
  };

  const handleSend = () => {
    if (simState === 'sending' || !isReady) return;
    confettiFired.current = false;
    setSimState('sending');
    setTravelPhase('outbound');
    setVisibleLines(0);

    setTimeout(() => setTravelPhase('server-flash'), 580);
    setTimeout(() => setTravelPhase('inbound'),      820);
    setTimeout(() => {
      setTravelPhase('done');
      setSimState(checkCorrect() ? 'correct' : getWrongState());
    }, 1480);
  };

  const handleReset = () => {
    setSimState(isReady ? 'ready' : 'empty');
    setTravelPhase('idle');
    setVisibleLines(0);
    setHintIdx(-1);
    confettiFired.current = false;
  };

  // Stream JSON lines
  useEffect(() => {
    if (simState !== 'correct' && !simState.startsWith('wrong')) return;
    const resp = getResponse();
    if (!resp) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= resp.lines.length) {
        clearInterval(t);
        if (simState === 'correct' && !confettiFired.current) {
          confettiFired.current = true;
          setTimeout(() => confetti({
            particleCount: 90, spread: 65, origin: { y:.35 },
            colors: ['#2BD46B','#8FE34A','#2E5BFF','#5B7BFF','#B9E534','#E0A815'],
          }), 180);
        }
      }
    }, 105);
    return () => clearInterval(t);
  }, [simState]); // eslint-disable-line react-hooks/exhaustive-deps

  const getResponse = () => {
    if (simState === 'correct')       return sc.successResponse;
    if (simState === 'wrong-method')  return sc.wrongMethodResponse;
    if (simState === 'wrong-url')     return sc.wrongUrlResponse;
    if (simState === 'wrong-auth')    return (sc as typeof SCENARIO.debug).initialFail;
    return null;
  };

  const wrongHint =
    simState === 'wrong-method' ? `You used ${method}, but to read data you need GET. GET = Read in CRUD.` :
    simState === 'wrong-url'    ? `That resource wasn't found. The task asks for user ID 1 — try /users/1.` :
    simState === 'wrong-auth'   ? `The server needs proof of who you are. Add an Authorization header.` : '';

  const mascotState = simState === 'correct' ? 'correct' : simState.startsWith('wrong') ? 'wrong' : 'idle';
  const resp = getResponse();
  const ss   = resp ? statusStyle(resp.status) : null;

  return (
    <div style={{ background:'var(--atl-canvas)', minHeight:'100%', padding:'28px 20px', fontFamily:'var(--atl-font-body)', position:'relative', overflow:'hidden' }}>
      {/* Ambient tints */}
      <div style={{ position:'fixed', top:-60, right:-60, width:320, height:320, background:'radial-gradient(circle,rgba(46,91,255,.06),transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:-60, left:-60, width:320, height:320, background:'radial-gradient(circle,rgba(43,212,107,.05),transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ maxWidth:920, margin:'0 auto' }}>

        {/* ── Task card ── */}
        <motion.div initial={{ opacity:0,y:-12 }} animate={{ opacity:1,y:0 }} transition={{ duration:.35 }}
          style={{ background:'#FFF', borderRadius:20, padding:'16px 20px', marginBottom:20, border:'1.5px solid #ECE8E1', boxShadow:'0 1px 2px rgba(28,27,42,.05),0 6px 20px rgba(28,27,42,.06)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>

          {/* Mode toggle */}
          <div style={{ display:'flex', gap:4, background:'#F2EFEA', borderRadius:100, padding:3, flexShrink:0 }}>
            {(['normal','debug'] as DemoMode[]).map(m => (
              <motion.button key={m} onClick={() => switchMode(m)}
                style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:700, padding:'5px 14px', borderRadius:100, border:'none', cursor:'pointer', background: mode===m ? '#FFF' : 'transparent', color: mode===m ? '#1C1B2A' : '#A7A3AD', boxShadow: mode===m ? '0 1px 4px rgba(28,27,42,.12)' : 'none', transition:'all .15s' }}>
                {m === 'normal' ? '🟢 Normal' : '🔐 Debug'}
              </motion.button>
            ))}
          </div>

          {/* Task text */}
          <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'15px', fontWeight:700, color:'#1C1B2A', margin:0, flex:1, letterSpacing:'-0.01em' }}>
            {sc.task}
          </p>

          {/* Streak */}
          <div style={{ display:'flex', alignItems:'center', gap:4, background:'linear-gradient(135deg,#F9FCE4,#F0FAB8)', border:'1.5px solid #D9EF6A', borderRadius:100, padding:'4px 10px', flexShrink:0 }}>
            <Zap size={13} fill="#B9E534" color="#B9E534" strokeWidth={0}/>
            <span style={{ fontSize:'12px', fontWeight:700, color:'#5A700A' }}>12</span>
          </div>

          {onClose && (
            <button onClick={onClose} style={{ width:30, height:30, border:'none', background:'#F2EFEA', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B6A7B', flexShrink:0 }}>
              <X size={15} strokeWidth={2.5}/>
            </button>
          )}
        </motion.div>

        {/* ── Main body ── */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:16 }}>

          {/* ════════════════ LEFT: Request builder ════════════════ */}
          <motion.div initial={{ opacity:0,x:-16 }} animate={{ opacity:1,x:0 }} transition={{ duration:.4,delay:.08 }}
            style={{ background:'#FFF', borderRadius:24, padding:24, border:'1.5px solid #ECE8E1', boxShadow:'0 1px 2px rgba(28,27,42,.05),0 10px 30px rgba(28,27,42,.07)', display:'flex', flexDirection:'column', gap:20 }}>

            <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#A7A3AD', margin:0 }}>Request Builder</p>

            {/* Method pills */}
            <div>
              <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', margin:'0 0 8px' }}>Method</p>
              <div style={{ display:'flex', gap:7 }}>
                {Object.keys(M).map(met => {
                  const active = method === met;
                  const s = M[met];
                  return (
                    <motion.button key={met}
                      whileTap={{ scale:.92, y:2 }}
                      onClick={() => { setMethod(met); if (simState !== 'sending') setSimState(isReady ? 'ready' : 'empty'); }}
                      style={{
                        flex:1, height:36, borderRadius:100, border:`1.5px solid ${active?'transparent':s.border}`,
                        background: active ? s.grad : s.muted,
                        color: active ? '#FFF' : s.text,
                        fontFamily:'monospace', fontSize:'12px', fontWeight:800,
                        cursor:'pointer', userSelect:'none',
                        boxShadow: active ? `inset 0 1px 0 rgba(255,255,255,.2), 0 3px 0 ${s.ledge}, 0 6px 14px rgba(28,27,42,.1)` : 'none',
                        transition:'background .15s, color .15s, border-color .15s, box-shadow .15s',
                        position:'relative', overflow:'hidden',
                      }}>
                      {active && <span style={{ position:'absolute', top:0, left:'20%', right:'20%', height:'1px', background:'rgba(255,255,255,.3)', borderRadius:100 }}/>}
                      {met}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* URL bar */}
            <div>
              <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', margin:'0 0 8px' }}>URL</p>
              <div style={{ display:'flex', alignItems:'center', background:'#F9F7F4', borderRadius:12, border:'1.5px solid #ECE8E1', overflow:'hidden', transition:'border-color .2s', ...(urlSuffix ? { borderColor:'#93C5FD' } : {}) }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'0 10px 0 12px', flexShrink:0 }}>
                  <Lock size={11} color="#A7A3AD"/>
                  <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#6B6A7B', whiteSpace:'nowrap' }}>{sc.urlBase}</span>
                </div>
                <input
                  value={urlSuffix}
                  onChange={e => { setUrlSuffix(e.target.value); setSimState(!simState.includes('sending') ? (e.target.value.trim() ? 'ready' : 'empty') : simState); }}
                  placeholder={sc.urlHint}
                  disabled={simState === 'sending'}
                  style={{
                    flex:1, background: urlSuffix ? 'rgba(219,234,254,.4)' : 'rgba(255,237,213,.35)',
                    border:'none', borderLeft:`2px ${urlSuffix ? 'solid #93C5FD' : 'dashed #FCD34D'}`,
                    padding:'9px 12px', fontFamily:'monospace', fontSize:'13px', fontWeight:600,
                    color:'#1C1B2A', outline:'none', minWidth:0,
                    transition:'background .2s, border-color .2s',
                  }}
                />
              </div>
            </div>

            {/* Headers accordion */}
            <div>
              <button onClick={() => setHeadersOpen(o => !o)}
                style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:0, width:'100%' }}>
                <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B' }}>Headers</span>
                {headers.length > 0 && (
                  <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, color:'#2E5BFF', background:'#EEF2FF', borderRadius:100, padding:'1px 8px' }}>{headers.length}</span>
                )}
                {headersOpen ? <ChevronDown size={14} color="#A7A3AD" style={{ marginLeft:'auto' }}/> : <ChevronRight size={14} color="#A7A3AD" style={{ marginLeft:'auto' }}/>}
              </button>

              <AnimatePresence>
                {headersOpen && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }}
                    style={{ overflow:'hidden' }}>
                    <div style={{ paddingTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                      {headers.map((h, i) => (
                        <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
                          {h.locked ? (
                            <>
                              <div style={{ flex:1, background:'#F2EFEA', borderRadius:8, padding:'7px 10px', fontFamily:'monospace', fontSize:'11px', color:'#6B6A7B', display:'flex', alignItems:'center', gap:4 }}>
                                <Lock size={10} color="#A7A3AD"/> {h.key}
                              </div>
                              <div style={{ flex:1.3, background:'#F2EFEA', borderRadius:8, padding:'7px 10px', fontFamily:'monospace', fontSize:'11px', color:'#6B6A7B' }}>{h.value}</div>
                            </>
                          ) : (
                            <>
                              <input value={h.key} onChange={e => setHeaders(prev => prev.map((x,j) => j===i ? {...x,key:e.target.value} : x))} placeholder="Header name"
                                style={{ flex:1, background:'#FFF', border:'1.5px solid #ECE8E1', borderRadius:8, padding:'7px 10px', fontFamily:'monospace', fontSize:'11px', color:'#1C1B2A', outline:'none' }}/>
                              <input value={h.value} onChange={e => setHeaders(prev => prev.map((x,j) => j===i ? {...x,value:e.target.value} : x))} placeholder="Value"
                                style={{ flex:1.3, background:'#FFF', border:'1.5px solid #ECE8E1', borderRadius:8, padding:'7px 10px', fontFamily:'monospace', fontSize:'11px', color:'#1C1B2A', outline:'none' }}/>
                              <button onClick={() => setHeaders(prev => prev.filter((_,j) => j!==i))}
                                style={{ width:24, height:24, border:'none', background:'transparent', cursor:'pointer', color:'#A7A3AD', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>
                                <Trash2 size={13}/>
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setHeaders(prev => [...prev, { key:'', value:'' }])}
                        style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1.5px dashed #D1C8BF', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#A7A3AD', width:'fit-content' }}>
                        <Plus size={12}/> Add header
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:10 }}>
              {/* Hint button */}
              <motion.button whileHover={{ y:-1 }} whileTap={{ y:1 }}
                onClick={() => setHintIdx(i => Math.min(i+1, sc.hints.length-1))}
                style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1.5px solid #ECE8E1', borderRadius:100, padding:'7px 16px', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', width:'fit-content' }}>
                <Lightbulb size={14} color="#D97706"/>
                Hint {hintIdx >= 0 ? `(${hintIdx+1}/${sc.hints.length})` : ''}
              </motion.button>

              {/* Hint text */}
              <AnimatePresence>
                {hintIdx >= 0 && (
                  <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border:'1.5px solid #FDE68A', borderRadius:12, padding:'10px 14px', display:'flex', gap:8 }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
                    <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#92400E', margin:0, lineHeight:1.5, fontWeight:500 }}>
                      {sc.hints[hintIdx]}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Send button */}
              <motion.button
                initial="rest"
                whileHover={isReady && simState!=='sending' ? 'hover' : 'rest'}
                whileTap={isReady && simState!=='sending' ? 'press' : 'rest'}
                variants={{
                  rest:  { y:0, boxShadow: isReady ? 'inset 0 1px 0 rgba(255,255,255,.2), 0 4px 0 #1E3FCC, 0 8px 24px rgba(46,91,255,.3)' : 'none', filter:'brightness(1)' },
                  hover: { y:-1, filter:'brightness(1.06)' },
                  press: { y:4,  boxShadow:'inset 0 1px 0 rgba(255,255,255,.1), 0 0px 0 #1E3FCC, 0 4px 12px rgba(46,91,255,.2)', filter:'brightness(.96)', transition:{ duration:.08 } },
                }}
                transition={{ type:'spring', stiffness:600, damping:32 }}
                onClick={handleSend}
                disabled={!isReady || simState === 'sending'}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  height:52, borderRadius:100, border:'none',
                  background: isReady ? 'linear-gradient(135deg,#2E5BFF,#5B7BFF)' : '#EDE9E2',
                  color: isReady ? 'white' : '#A7A3AD',
                  fontFamily:'var(--atl-font-body)', fontSize:'16px', fontWeight:700,
                  cursor: isReady && simState!=='sending' ? 'pointer' : 'default',
                  position:'relative', overflow:'hidden', userSelect:'none',
                }}>
                {isReady && <span style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px', background:'rgba(255,255,255,.3)', borderRadius:100, pointerEvents:'none' }}/>}
                {simState === 'sending' ? (
                  <div style={{ display:'flex', gap:5 }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ scale:[1,1.5,1] }} transition={{ duration:.5, repeat:Infinity, delay:i*.12 }}
                        style={{ width:7, height:7, borderRadius:'50%', background:'white' }}/>
                    ))}
                  </div>
                ) : (
                  <>
                    <Send size={17}/>
                    Send
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* ════════════════ RIGHT: Response viewer ════════════════ */}
          <motion.div initial={{ opacity:0,x:16 }} animate={{ opacity:1,x:0 }} transition={{ duration:.4,delay:.14 }}
            style={{
              background: simState==='correct' ? '#FDFFFE' : simState.startsWith('wrong') ? '#FFFAFA' : '#FAFAF9',
              borderRadius:24, border:`1.5px solid ${simState==='correct' ? '#BBF7D0' : simState.startsWith('wrong') ? '#FECDD3' : '#ECE8E1'}`,
              boxShadow: simState==='correct'
                ? '0 0 0 4px rgba(34,197,94,.1), 0 10px 30px rgba(28,27,42,.07)'
                : simState.startsWith('wrong')
                ? '0 0 0 4px rgba(244,63,94,.08), 0 10px 30px rgba(28,27,42,.07)'
                : '0 1px 2px rgba(28,27,42,.05),0 10px 30px rgba(28,27,42,.07)',
              overflow:'hidden', display:'flex', flexDirection:'column',
              transition:'background .3s, border-color .3s, box-shadow .3s',
            }}>
            <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'center', gap:8 }}>
              <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#A7A3AD', margin:0, flex:1 }}>Response</p>
              {(simState==='correct'||simState.startsWith('wrong')) && (
                <motion.button initial={{ opacity:0,scale:.8 }} animate={{ opacity:1,scale:1 }} whileHover={{ y:-1 }} whileTap={{ scale:.95 }}
                  onClick={handleReset}
                  style={{ display:'flex', alignItems:'center', gap:5, background:'#F2EFEA', border:'none', borderRadius:100, padding:'4px 12px', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, color:'#6B6A7B' }}>
                  <RotateCcw size={11}/> Start over
                </motion.button>
              )}
            </div>

            <div style={{ flex:1, padding:'12px 20px 20px', display:'flex', flexDirection:'column', gap:12 }}>
              <AnimatePresence mode="wait">

                {/* Empty */}
                {simState === 'empty' && (
                  <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, border:'2px dashed #ECE8E1', borderRadius:16, padding:32, minHeight:260 }}>
                    <div style={{ width:56, height:56, background:'#F2EFEA', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>📭</div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'16px', fontWeight:700, color:'#A7A3AD', margin:'0 0 4px' }}>Nothing yet</p>
                      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#C4BDB0', margin:0 }}>Build your request and hit Send</p>
                    </div>
                  </motion.div>
                )}

                {/* Ready — ghost preview */}
                {simState === 'ready' && (
                  <motion.div key="ready" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, border:'2px dashed #93C5FD', borderRadius:16, padding:32, minHeight:260, background:'rgba(239,246,255,.4)' }}>
                    <div style={{ width:56, height:56, background:'linear-gradient(135deg,#EEF2FF,#DBEAFE)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Send size={24} color="#2E5BFF"/>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'16px', fontWeight:700, color:'#2E5BFF', margin:'0 0 4px' }}>Ready to send!</p>
                      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#60A5FA', margin:0 }}>Click Send to fire the request</p>
                    </div>
                  </motion.div>
                )}

                {/* Sending — travel animation */}
                {simState === 'sending' && (
                  <motion.div key="sending" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minHeight:260 }}>
                    <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:600, color:'#6B6A7B', marginBottom:4 }}>
                      {travelPhase === 'outbound' ? 'Sending request…' : travelPhase === 'server-flash' ? 'Server processing…' : 'Receiving response…'}
                    </p>
                    <div style={{ width:'100%', maxWidth:340 }}>
                      <TravelDiagram phase={travelPhase}/>
                    </div>
                  </motion.div>
                )}

                {/* Response — correct or wrong */}
                {(simState === 'correct' || simState.startsWith('wrong')) && resp && ss && (
                  <motion.div key="response" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex', flexDirection:'column', gap:12, flex:1 }}>

                    {/* Status pill + time */}
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <motion.div initial={{ scale:.5, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:600, damping:22, delay:.1 }}
                        style={{ display:'flex', alignItems:'center', gap:7, background:ss.bg, border:`2px solid ${ss.border}`, borderRadius:100, padding:'7px 16px' }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:ss.dot }}/>
                        <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'15px', fontWeight:800, color:ss.text }}>
                          {resp.status} {resp.statusText}
                        </span>
                      </motion.div>
                      <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.4 }}
                        style={{ fontFamily:'monospace', fontSize:'12px', color:'#A7A3AD' }}>127 ms</motion.span>
                    </div>

                    {/* JSON body — streaming */}
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.25 }}
                      style={{ background:'#1C1B2A', borderRadius:14, padding:'14px 16px', flex:1, overflow:'auto', minHeight:120 }}>
                      <pre style={{ fontFamily:'monospace', fontSize:'13px', lineHeight:1.85, margin:0 }}>
                        {resp.lines.slice(0, visibleLines).map((line, i) => (
                          <motion.div key={i} initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ duration:.18 }}>
                            <JsonLine line={line}/>
                          </motion.div>
                        ))}
                        {visibleLines < resp.lines.length && (
                          <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:.6, repeat:Infinity }}
                            style={{ display:'inline-block', width:8, height:14, background:'#4B5563', borderRadius:2, verticalAlign:'middle', marginLeft:2 }}/>
                        )}
                      </pre>
                    </motion.div>

                    {/* Wrong hint */}
                    {simState.startsWith('wrong') && visibleLines >= resp.lines.length && (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15 }}
                        style={{ background:'#FFF7ED', border:'1.5px solid #FED7AA', borderRadius:12, padding:'12px 14px', display:'flex', gap:10 }}>
                        <span style={{ fontSize:16, flexShrink:0 }}>🤔</span>
                        <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#92400E', margin:0, lineHeight:1.5 }}>
                          <strong>Hmm — </strong>{wrongHint}
                        </p>
                      </motion.div>
                    )}

                    {/* Correct actions */}
                    {simState === 'correct' && visibleLines >= resp.lines.length && (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
                        style={{ display:'flex', gap:10 }}>
                        <button onClick={() => setShowWhy(true)}
                          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1.5px solid #BBF7D0', borderRadius:100, padding:'7px 16px', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:700, color:'#059669' }}>
                          <Lightbulb size={14}/> Why?
                        </button>
                        <div style={{ flex:1 }}>
                          <TactileButton variant="continue" fullWidth size="md" onClick={() => {}}>
                            Continue →
                          </TactileButton>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Mascot corner ── */}
      <div style={{ position:'fixed', bottom:24, left:24, zIndex:10 }}>
        <Mascot
          state={mascotState}
          size="md"
          showBubble={simState === 'correct'}
          bubbleText="Nailed it! 🎉"
        />
      </div>

      {/* ── Why? Explanation modal ── */}
      <AnimatePresence>
        {showWhy && (
          <>
            <motion.div key="why-bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowWhy(false)}
              style={{ position:'fixed', inset:0, background:'rgba(28,27,42,.5)', backdropFilter:'blur(6px)', zIndex:200 }}/>

            <motion.div key="why-modal"
              initial={{ opacity:0, scale:.9, y:28 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95, y:16 }}
              transition={{ type:'spring', stiffness:440, damping:32 }}
              style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:201, width:'90%', maxWidth:500, background:'#FFF', borderRadius:24, boxShadow:'0 4px 8px rgba(28,27,42,.08),0 32px 72px rgba(28,27,42,.2)', overflow:'hidden' }}>

              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, background:'linear-gradient(135deg,#FEF3C7,#FDE68A)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Lightbulb size={18} color="#D97706"/>
                  </div>
                  <span style={{ fontFamily:'var(--atl-font-display)', fontWeight:800, fontSize:'18px', color:'#1C1B2A' }}>Why did that work?</span>
                </div>
                <button onClick={() => setShowWhy(false)} style={{ width:30, height:30, border:'none', background:'#F2EFEA', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B6A7B' }}>
                  <X size={15} strokeWidth={2.5}/>
                </button>
              </div>
              <div style={{ height:1, background:'#F2EFEA', margin:'16px 24px' }}/>

              {/* Breakdown */}
              <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
                {sc.explanation.map((row, i) => (
                  <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.08 }}
                    style={{ display:'flex', alignItems:'flex-start', gap:14, background:row.bg, borderRadius:14, padding:'12px 16px', border:`1.5px solid ${row.color}30` }}>
                    <div>
                      <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:row.color }}>{row.label}</span>
                      <p style={{ fontFamily:'monospace', fontSize:'15px', fontWeight:700, color:row.color, margin:'2px 0 4px' }}>{row.value}</p>
                      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#1C1B2A', margin:0, lineHeight:1.5, fontWeight:400 }}>{row.note}</p>
                    </div>
                  </motion.div>
                ))}

                <TactileButton variant="continue" fullWidth onClick={() => setShowWhy(false)}>
                  Got it — Continue
                </TactileButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
