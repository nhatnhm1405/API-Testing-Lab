import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Plus, Trash2, Lock, History, RotateCcw, Sparkles } from "lucide-react";
import { M, statusStyle, JsonLine, TravelDiagram, type TravelPhase } from "./apiSimShared";
import { mockApi, type MockResponse, type MockRequest } from "../data/mockApi";
import { AssertionPanel } from "./Assertions";
import { playSend, playPop } from "../lib/sound";
import { useIsMobile } from "./ui/use-mobile";

// ── Free Lab — an open sandbox on top of the in-browser mock engine ────────────
// Unlike the 5 scripted scenarios, here the user picks ANY method, types ANY
// path, adds query params / headers / body freely, and gets a dynamic response.
// Requests stay simulated (mockApi) — no network — so the lab never breaks.

const BASE = 'https://api.example.com';
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

interface Row { key: string; value: string }
interface HistoryEntry {
  id: number;
  method: string;
  path: string;
  status: number;
  statusText: string;
  req: MockRequest;
}

type Phase = 'idle' | 'sending' | 'done';

interface Example {
  label: string;
  method: string;
  path: string;
  query?: Row[];
  headers?: Row[];
  body?: string;
}

const EXAMPLES: Example[] = [
  { label: 'GET /users',            method: 'GET',    path: '/users' },
  { label: 'GET /users/2',          method: 'GET',    path: '/users/2' },
  { label: 'GET /users/999 → 404',  method: 'GET',    path: '/users/999' },
  { label: 'GET /users?role=editor',method: 'GET',    path: '/users', query: [{ key: 'role', value: 'editor' }] },
  { label: 'POST /users → 201',     method: 'POST',   path: '/users',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: '{\n  "name": "Katherine Johnson",\n  "role": "editor"\n}' },
  { label: 'GET /profile → 401',    method: 'GET',    path: '/profile' },
  { label: 'DELETE /users/3 → 204', method: 'DELETE', path: '/users/3' },
];

const rowsToObject = (rows: Row[]) =>
  rows.reduce<Record<string, string>>((acc, r) => {
    if (r.key.trim()) acc[r.key.trim()] = r.value;
    return acc;
  }, {});

export function FreeLab() {
  const isMobile = useIsMobile();

  const [method,      setMethod]      = useState('GET');
  const [path,        setPath]        = useState('/users/1');
  const [query,       setQuery]       = useState<Row[]>([]);
  const [headers,     setHeaders]     = useState<Row[]>([]);
  const [body,        setBody]        = useState('');
  const [phase,       setPhase]       = useState<Phase>('idle');
  const [travelPhase, setTravelPhase] = useState<TravelPhase>('idle');
  const [response,    setResponse]    = useState<MockResponse | null>(null);
  const [visibleLines,setVisibleLines]= useState(0);
  const [history,     setHistory]     = useState<HistoryEntry[]>([]);

  const historyId = useRef(0);
  const ms = M[method] ?? M.GET;
  const showBody = BODY_METHODS.has(method);
  const isReady = path.trim().length > 0 && phase !== 'sending';

  const queryString = (() => {
    const obj = rowsToObject(query);
    const qs = new URLSearchParams(obj).toString();
    return qs ? `?${qs}` : '';
  })();

  // ── Stream response lines once a response lands ──────────────────────────────
  useEffect(() => {
    if (phase !== 'done' || !response) return;
    const total = response.lines.length;
    if (total === 0) { setVisibleLines(0); return; }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= total) clearInterval(t);
    }, 70);
    return () => clearInterval(t);
  }, [phase, response]);

  // ── Send flow (mirrors the scripted simulator's travel beats) ────────────────
  const fire = (req: MockRequest) => {
    setPhase('sending');
    setTravelPhase('outbound');
    // Keep the previous response object mounted so the assertion panel (and the
    // user's authored tests) survives across re-sends; it refreshes on 'done'.
    setVisibleLines(0);
    playSend();
    setTimeout(() => setTravelPhase('server-flash'), 560);
    setTimeout(() => setTravelPhase('inbound'),      820);
    setTimeout(() => {
      const res = mockApi(req);
      setTravelPhase('done');
      setResponse(res);
      setPhase('done');
      playPop();
      historyId.current += 1;
      setHistory(prev => [
        { id: historyId.current, method: req.method, path: req.path + (new URLSearchParams(req.query).toString() ? `?${new URLSearchParams(req.query).toString()}` : ''), status: res.status, statusText: res.statusText, req },
        ...prev,
      ].slice(0, 8));
    }, 1420);
  };

  const handleSend = () => {
    if (!isReady) return;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    fire({
      method,
      path: normalizedPath,
      query: rowsToObject(query),
      headers: headers.map(h => ({ key: h.key, value: h.value })),
      body: showBody ? body : '',
    });
  };

  const loadExample = (ex: Example) => {
    setMethod(ex.method);
    setPath(ex.path);
    setQuery(ex.query ?? []);
    setHeaders(ex.headers ?? []);
    setBody(ex.body ?? '');
    setPhase('idle');
    setTravelPhase('idle');
    setResponse(null);
    setVisibleLines(0);
  };

  const replay = (entry: HistoryEntry) => {
    setMethod(entry.req.method);
    setPath(entry.req.path);
    setQuery(Object.entries(entry.req.query).map(([key, value]) => ({ key, value })));
    setHeaders(entry.req.headers.map(h => ({ ...h })));
    setBody(entry.req.body);
    fire(entry.req);
  };

  const ss = response ? statusStyle(response.status) : null;
  const linesDone = response ? visibleLines >= response.lines.length : false;

  const rowEditor = (
    rows: Row[],
    setRows: (updater: (prev: Row[]) => Row[]) => void,
    keyPlaceholder: string,
    valuePlaceholder: string,
    addLabel: string,
  ) => (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
          <input value={r.key} onChange={e => setRows(prev => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} placeholder={keyPlaceholder}
            style={{ flex:1, background:'#FFF', border:'1.5px solid #ECE8E1', borderRadius:8, padding:'7px 10px', fontFamily:'monospace', fontSize:'11px', color:'#1C1B2A', outline:'none' }}/>
          <input value={r.value} onChange={e => setRows(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder={valuePlaceholder}
            style={{ flex:1.3, background:'#FFF', border:'1.5px solid #ECE8E1', borderRadius:8, padding:'7px 10px', fontFamily:'monospace', fontSize:'11px', color:'#1C1B2A', outline:'none' }}/>
          <button onClick={() => setRows(prev => prev.filter((_, j) => j !== i))}
            style={{ width:24, height:24, border:'none', background:'transparent', cursor:'pointer', color:'#A7A3AD', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>
            <Trash2 size={13}/>
          </button>
        </div>
      ))}
      <button onClick={() => setRows(prev => [...prev, { key:'', value:'' }])}
        style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1.5px dashed #D1C8BF', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#A7A3AD', width:'fit-content' }}>
        <Plus size={12}/> {addLabel}
      </button>
    </div>
  );

  return (
    <div>
      {/* ── Example chips ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:700, color:'#6B6A7B' }}>
          <Sparkles size={13} color="#D97706"/> Try:
        </span>
        {EXAMPLES.map(ex => (
          <motion.button key={ex.label} whileTap={{ scale:.95 }} onClick={() => loadExample(ex)}
            style={{ fontFamily:'monospace', fontSize:'11px', fontWeight:700, padding:'5px 11px', borderRadius:100, border:`1.5px solid ${M[ex.method].border}`, background:M[ex.method].muted, color:M[ex.method].text, cursor:'pointer' }}>
            {ex.label}
          </motion.button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)', gap:16 }}>

        {/* ════════════════ LEFT: Request builder ════════════════ */}
        <motion.div initial={{ opacity:0,x:-16 }} animate={{ opacity:1,x:0 }} transition={{ duration:.4,delay:.05 }}
          style={{ background:'#FFF', borderRadius:24, padding:24, border:'1.5px solid #ECE8E1', boxShadow:'0 1px 2px rgba(28,27,42,.05),0 10px 30px rgba(28,27,42,.07)', display:'flex', flexDirection:'column', gap:18 }}>

          <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#A7A3AD', margin:0 }}>Request Builder</p>

          {/* Method pills */}
          <div>
            <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', margin:'0 0 8px' }}>Method</p>
            <div style={{ display:'flex', gap:6 }}>
              {METHODS.map(met => {
                const active = method === met;
                const s = M[met];
                return (
                  <motion.button key={met} whileTap={{ scale:.92, y:2 }}
                    onClick={() => setMethod(met)}
                    style={{
                      flex:1, height:36, borderRadius:100,
                      border:`1.5px solid ${active ? 'transparent' : s.border}`,
                      background: active ? s.grad : s.muted,
                      color: active ? '#FFF' : s.text,
                      fontFamily:'monospace', fontSize:'10.5px', fontWeight:800,
                      cursor:'pointer', userSelect:'none',
                      boxShadow: active ? `inset 0 1px 0 rgba(255,255,255,.22), 0 3px 0 ${s.ledge}, 0 6px 14px ${s.ambient}` : 'none',
                      transition:'background .15s, color .15s, border-color .15s, box-shadow .15s',
                      position:'relative', overflow:'hidden',
                    }}>
                    {met}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* URL bar */}
          <div>
            <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', margin:'0 0 8px' }}>URL</p>
            <div style={{ display:'flex', alignItems:'center', background:'#F9F7F4', borderRadius:12, border:`1.5px solid ${path ? ms.border : '#ECE8E1'}`, overflow:'hidden', transition:'border-color .2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'0 8px 0 12px', flexShrink:0 }}>
                <Lock size={11} color="#A7A3AD"/>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B6A7B', whiteSpace:'nowrap' }}>{BASE}</span>
              </div>
              <input
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="/users/1"
                disabled={phase === 'sending'}
                style={{
                  flex:1, background: path ? `${ms.muted}80` : 'rgba(255,237,213,.35)',
                  border:'none', borderLeft:`2px ${path ? `solid ${ms.border}` : 'dashed #FCD34D'}`,
                  padding:'9px 12px', fontFamily:'monospace', fontSize:'13px', fontWeight:600,
                  color:'#1C1B2A', outline:'none', minWidth:0, transition:'background .2s, border-color .2s',
                }}
              />
            </div>
            {queryString && (
              <p style={{ fontFamily:'monospace', fontSize:'10.5px', color:'#A7A3AD', margin:'6px 0 0', wordBreak:'break-all' }}>
                full: {BASE}{path.startsWith('/') ? path : `/${path}`}<span style={{ color:ms.text }}>{queryString}</span>
              </p>
            )}
          </div>

          {/* Query params */}
          <div>
            <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', margin:'0 0 8px' }}>
              Query params {query.length > 0 && <span style={{ color:ms.text }}>· {query.length}</span>}
            </p>
            {rowEditor(query, setQuery, 'key (e.g. role)', 'value (e.g. editor)', 'Add param')}
          </div>

          {/* Headers */}
          <div>
            <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', margin:'0 0 8px' }}>
              Headers {headers.length > 0 && <span style={{ color:ms.text }}>· {headers.length}</span>}
            </p>
            {rowEditor(headers, setHeaders, 'Header name', 'Value', 'Add header')}
          </div>

          {/* Body */}
          <AnimatePresence>
            {showBody && (
              <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:.25 }}
                style={{ overflow:'hidden' }}>
                <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#6B6A7B', margin:'0 0 8px' }}>Body — JSON</p>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={5}
                  placeholder={'{\n  "name": "..."\n}'}
                  style={{
                    width:'100%', boxSizing:'border-box',
                    background:'#1C1B2A', color:'#8FE34A',
                    fontFamily:'monospace', fontSize:'12px', lineHeight:1.7,
                    padding:'12px 14px', borderRadius:12, border:'none',
                    outline:'none', resize:'vertical',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send */}
          <motion.button
            whileHover={isReady ? { y:-1, filter:'brightness(1.06)' } : {}}
            whileTap={isReady ? { y:4 } : {}}
            transition={{ type:'spring', stiffness:600, damping:32 }}
            onClick={handleSend}
            disabled={!isReady}
            style={{
              marginTop:'auto',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              height:52, borderRadius:100, border:'none',
              background: path ? ms.grad : '#EDE9E2',
              color: path ? 'white' : '#A7A3AD',
              fontFamily:'var(--atl-font-body)', fontSize:'16px', fontWeight:700,
              cursor: isReady ? 'pointer' : 'default',
              boxShadow: path ? `inset 0 1px 0 rgba(255,255,255,.2), 0 4px 0 ${ms.ledge}, 0 8px 24px ${ms.ambient}` : 'none',
              position:'relative', overflow:'hidden', userSelect:'none',
            }}>
            {phase === 'sending' ? (
              <div style={{ display:'flex', gap:5 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ scale:[1,1.5,1] }} transition={{ duration:.5, repeat:Infinity, delay:i*.12 }}
                    style={{ width:7, height:7, borderRadius:'50%', background:'white' }}/>
                ))}
              </div>
            ) : (
              <><Send size={17}/>Send</>
            )}
          </motion.button>
        </motion.div>

        {/* ════════════════ RIGHT: Response + history ════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Response viewer */}
          <motion.div initial={{ opacity:0,x:16 }} animate={{ opacity:1,x:0 }} transition={{ duration:.4,delay:.1 }}
            style={{ background:'#FAFAF9', borderRadius:24, border:'1.5px solid #ECE8E1', boxShadow:'0 1px 2px rgba(28,27,42,.05),0 10px 30px rgba(28,27,42,.07)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'20px 20px 12px', display:'flex', alignItems:'center', gap:8 }}>
              <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#A7A3AD', margin:0, flex:1 }}>Response</p>
              {response && ss && (
                <motion.div initial={{ scale:.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',stiffness:600,damping:22 }}
                  style={{ display:'flex', alignItems:'center', gap:7, background:ss.bg, border:`2px solid ${ss.border}`, borderRadius:100, padding:'5px 14px' }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:ss.dot }}/>
                  <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'14px', fontWeight:800, color:ss.text }}>{response.status} {response.statusText}</span>
                </motion.div>
              )}
              {response && <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#A7A3AD' }}>{response.timeMs} ms</span>}
            </div>

            <div style={{ padding:'0 20px 20px' }}>
              <AnimatePresence mode="wait">
                {phase === 'idle' && (
                  <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, border:'2px dashed #ECE8E1', borderRadius:16, padding:32, minHeight:220 }}>
                    <div style={{ width:52, height:52, background:'#F2EFEA', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>📭</div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontFamily:'var(--atl-font-display)', fontSize:'15px', fontWeight:700, color:'#A7A3AD', margin:'0 0 4px' }}>Nothing yet</p>
                      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#C4BDB0', margin:0 }}>Build a request (or tap an example) and hit Send</p>
                    </div>
                  </motion.div>
                )}

                {phase === 'sending' && (
                  <motion.div key="sending" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minHeight:220 }}>
                    <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:600, color:'#6B6A7B' }}>
                      {travelPhase==='outbound' ? 'Sending request…' : travelPhase==='server-flash' ? 'Server processing…' : 'Receiving response…'}
                    </p>
                    <div style={{ width:'100%', maxWidth:340 }}>
                      <TravelDiagram phase={travelPhase} method={method}/>
                    </div>
                  </motion.div>
                )}

                {phase === 'done' && response && (
                  <motion.div key="done" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ background:'#1C1B2A', borderRadius:14, padding:'14px 16px', minHeight:160, overflow:'auto' }}>
                    {response.lines.length === 0 ? (
                      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#6B7280', margin:0, fontStyle:'italic', lineHeight:1.6 }}>
                        {response.emptyNote ?? '(empty body)'}
                      </p>
                    ) : (
                      <pre style={{ fontFamily:'monospace', fontSize:'13px', lineHeight:1.85, margin:0 }}>
                        {response.lines.slice(0, visibleLines).map((line, i) => (
                          <motion.div key={i} initial={{ opacity:0,x:-6 }} animate={{ opacity:1,x:0 }} transition={{ duration:.16 }}>
                            <JsonLine line={line}/>
                          </motion.div>
                        ))}
                        {!linesDone && (
                          <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:.6,repeat:Infinity }}
                            style={{ display:'inline-block', width:8, height:14, background:'#4B5563', borderRadius:2, verticalAlign:'middle', marginLeft:2 }}/>
                        )}
                      </pre>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Assertions — stays mounted across re-sends so authored tests persist */}
          {response && <AssertionPanel response={response}/>}

          {/* History */}
          <motion.div initial={{ opacity:0,x:16 }} animate={{ opacity:1,x:0 }} transition={{ duration:.4,delay:.16 }}
            style={{ background:'#FFF', borderRadius:24, border:'1.5px solid #ECE8E1', boxShadow:'0 1px 2px rgba(28,27,42,.05),0 10px 30px rgba(28,27,42,.07)', padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom: history.length ? 12 : 0 }}>
              <History size={14} color="#A7A3AD"/>
              <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#A7A3AD', margin:0, flex:1 }}>History</p>
              {history.length > 0 && (
                <button onClick={() => setHistory([])}
                  style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, color:'#A7A3AD' }}>
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', color:'#C4BDB0', margin:0 }}>
                Sent requests show up here — tap one to run it again.
              </p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <AnimatePresence initial={false}>
                  {history.map(entry => {
                    const hs = statusStyle(entry.status);
                    const hm = M[entry.method] ?? M.GET;
                    return (
                      <motion.button key={entry.id} layout
                        initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        whileHover={{ x:2 }} whileTap={{ scale:.98 }}
                        onClick={() => replay(entry)}
                        style={{ display:'flex', alignItems:'center', gap:10, background:'#FAFAF9', border:'1.5px solid #ECE8E1', borderRadius:10, padding:'8px 10px', cursor:'pointer', textAlign:'left', width:'100%' }}>
                        <span style={{ fontFamily:'monospace', fontSize:'10px', fontWeight:800, color:hm.text, background:hm.muted, border:`1px solid ${hm.border}`, borderRadius:6, padding:'2px 6px', flexShrink:0, minWidth:50, textAlign:'center' }}>
                          {entry.method}
                        </span>
                        <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#1C1B2A', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {entry.path}
                        </span>
                        <span style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:hs.dot }}/>
                          <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:800, color:hs.text }}>{entry.status}</span>
                          <RotateCcw size={12} color="#C4BDB0"/>
                        </span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
