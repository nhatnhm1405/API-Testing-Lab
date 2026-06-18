import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Check, Lock } from "lucide-react";

// ── A mini Postman-style console to fire all four CRUD methods ─────
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
const METHODS: Method[] = ['GET', 'POST', 'PUT', 'DELETE'];

const MS: Record<Method, { bg: string; text: string; border: string; solid: string; ledge: string }> = {
  GET:    { bg:'#DBEAFE', text:'#1D4ED8', border:'#93C5FD', solid:'#3B82F6', ledge:'#2563EB' },
  POST:   { bg:'#D1FAE5', text:'#065F46', border:'#6EE7B7', solid:'#10B981', ledge:'#059669' },
  PUT:    { bg:'#FEF3C7', text:'#92400E', border:'#FCD34D', solid:'#F59E0B', ledge:'#D97706' },
  DELETE: { bg:'#FEE2E2', text:'#991B1B', border:'#FCA5A5', solid:'#EF4444', ledge:'#DC2626' },
};

interface Endpoint {
  url: string;
  blurb: string;
  headers: { k: string; v: string }[];
  body?: string;
  status: number;
  statusText: string;
  response: string;
}

const AUTH = { k: 'Authorization', v: 'Bearer eyJhbGci...' };
const ACCEPT = { k: 'Accept', v: 'application/json' };
const CT = { k: 'Content-Type', v: 'application/json' };

const ENDPOINTS: Record<Method, Endpoint> = {
  GET: {
    url: '/api/users', blurb: 'Read — fetch the list of users',
    headers: [AUTH, ACCEPT],
    status: 200, statusText: 'OK',
    response: '[\n  {\n    "id": 1,\n    "name": "Ada Lovelace",\n    "role": "admin"\n  },\n  {\n    "id": 2,\n    "name": "Grace Hopper",\n    "role": "editor"\n  }\n]',
  },
  POST: {
    url: '/api/users', blurb: 'Create — add a new user',
    headers: [CT, AUTH],
    body: '{\n  "name": "Minh Nguyen",\n  "role": "tester"\n}',
    status: 201, statusText: 'Created',
    response: '{\n  "id": 7,\n  "name": "Minh Nguyen",\n  "role": "tester"\n}',
  },
  PUT: {
    url: '/api/users/7', blurb: 'Update — replace user #7',
    headers: [CT, AUTH],
    body: '{\n  "name": "Minh Nguyen",\n  "role": "admin"\n}',
    status: 200, statusText: 'OK',
    response: '{\n  "id": 7,\n  "name": "Minh Nguyen",\n  "role": "admin"\n}',
  },
  DELETE: {
    url: '/api/users/7', blurb: 'Delete — remove user #7',
    headers: [AUTH],
    status: 204, statusText: 'No Content',
    response: '',
  },
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
    <pre style={{ fontFamily:'monospace', fontSize:'13px', lineHeight:1.7, margin:0, overflow:'auto' }}>
      {lines.map((line, li) => {
        const kv = line.match(/^(\s*)(".*?"):\s*(".*?"|[\d.]+|true|false|null)(,?)$/);
        if (kv) {
          const [, indent, key, val, comma] = kv;
          const isStr = val.startsWith('"');
          const isNum = /^[\d.]+$/.test(val);
          const isBool = val === 'true' || val === 'false';
          const valColor = isStr ? '#065F46' : isNum ? '#D97706' : isBool ? '#2563EB' : '#9CA3AF';
          return (
            <div key={li}>
              <span>{indent}</span>
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

const SECTION_LABEL: React.CSSProperties = {
  fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase',
  letterSpacing:'.08em', color:'#A7A3AD', margin:'0 0 8px',
};

function Section({ num, label, accent, children }: { num: string; label: string; accent: string; children: ReactNode }) {
  return (
    <div>
      <p style={SECTION_LABEL}>{num}. {label}</p>
      <div style={{ background:'#FFF', border:`1.5px solid ${accent}`, borderRadius:14, padding:14, boxShadow:'0 1px 3px rgba(28,27,42,.05)' }}>
        {children}
      </div>
    </div>
  );
}

export function ApiTestingLab() {
  const [method,   setMethod]   = useState<Method>('GET');
  const [sending,  setSending]  = useState(false);
  const [response, setResponse] = useState<{ status: number; statusText: string; body: string } | null>(null);
  const [tested,   setTested]   = useState<Set<Method>>(new Set());

  const ep = ENDPOINTS[method];
  const m  = MS[method];

  const selectMethod = (mm: Method) => {
    if (mm === method) return;
    setMethod(mm);
    setResponse(null);
    setSending(false);
  };

  const send = async () => {
    if (sending) return;
    setSending(true);
    setResponse(null);
    await new Promise(r => setTimeout(r, 750));
    setResponse({ status: ep.status, statusText: ep.statusText, body: ep.response });
    setTested(prev => new Set(prev).add(method));
    setSending(false);
  };

  const sc = response ? statusColor(response.status) : null;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.4 }}
      style={{ background:'#FFF', borderRadius:24, padding:28, border:'1.5px solid #ECE8E1', boxShadow:'0 1px 2px rgba(28,27,42,.05),0 12px 36px rgba(28,27,42,.07)' }}>

      {/* heading */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:18 }}>
        <div>
          <h3 style={{ fontFamily:'var(--atl-font-display)', fontSize:'22px', fontWeight:800, color:'#1C1B2A', margin:'0 0 2px', letterSpacing:'-0.02em' }}>
            Welcome to API Testing Lab 🚀
          </h3>
          <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'14px', color:'#6B6A7B', margin:0, fontWeight:500 }}>
            Fire a real request with each method and read the response.
          </p>
        </div>
        <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:700, color: tested.size === 4 ? '#15803D' : '#A7A3AD', background: tested.size === 4 ? '#ECFDF3' : '#F2EFEA', border:`1.5px solid ${tested.size === 4 ? '#BBF7D0' : '#ECE8E1'}`, borderRadius:'100px', padding:'5px 12px', whiteSpace:'nowrap' }}>
          {tested.size === 4 ? '✓ All methods tested' : `Tested ${tested.size}/4`}
        </span>
      </div>

      {/* method tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        {METHODS.map(mm => {
          const ms = MS[mm];
          const active = mm === method;
          const done = tested.has(mm);
          return (
            <motion.button key={mm} whileTap={{ scale:.96 }} onClick={() => selectMethod(mm)}
              style={{ flex:1, position:'relative', borderRadius:12, padding:'9px 6px', cursor:'pointer',
                border:`1.5px solid ${active ? ms.solid : ms.border}`,
                background: active ? ms.solid : ms.bg,
                boxShadow: active ? `0 4px 12px ${ms.solid}40` : 'none',
                fontFamily:'monospace', fontSize:'13px', fontWeight:800, letterSpacing:'.02em',
                color: active ? '#FFF' : ms.text, transition:'all .15s' }}>
              {mm}
              {done && (
                <span style={{ position:'absolute', top:-6, right:-6, width:16, height:16, borderRadius:'50%', background:'#22C55E', border:'2px solid #FFF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={9} color="#FFF" strokeWidth={3.5}/>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:600, color:m.text, margin:'0 0 18px' }}>
        {ep.blurb}
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* 1. request line */}
        <Section num="1" label="Request line" accent="#ECE8E1">
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ background:m.solid, color:'#FFF', borderRadius:8, padding:'5px 12px', fontFamily:'monospace', fontSize:'13px', fontWeight:800, flexShrink:0, boxShadow:`0 2px 6px ${m.solid}55` }}>
              {method}
            </div>
            <code style={{ flex:1, fontFamily:'monospace', fontSize:'13px', color:'#4B5563', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ep.url}</code>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#9CA3AF', background:'#F3F4F6', borderRadius:6, padding:'3px 9px', flexShrink:0 }}>HTTP/1.1</span>
          </div>
        </Section>

        {/* 2. headers */}
        <Section num="2" label="Headers" accent="#FDE68A">
          {ep.headers.map((h, i) => (
            <div key={h.k} style={{ display:'flex', gap:8, alignItems:'baseline', padding:'4px 0', borderBottom: i < ep.headers.length - 1 ? '1px dashed #FEF3C7' : 'none' }}>
              <code style={{ fontFamily:'monospace', fontSize:'12px', color:'#92400E', fontWeight:700, flexShrink:0 }}>{h.k}:</code>
              <code style={{ fontFamily:'monospace', fontSize:'12px', color:'#6B7280' }}>{h.v}</code>
            </div>
          ))}
        </Section>

        {/* 3. body */}
        {ep.body ? (
          <Section num="3" label="Request body (JSON)" accent="#A7F3D0">
            <JsonHighlight json={ep.body}/>
          </Section>
        ) : (
          <div>
            <p style={SECTION_LABEL}>3. Request body</p>
            <div style={{ background:'#FAF8F5', border:'1.5px dashed #E4DED5', borderRadius:14, padding:'14px 16px' }}>
              <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#A7A3AD', fontWeight:500 }}>
                {method} has no body — the resource is identified by the URL alone.
              </span>
            </div>
          </div>
        )}

        {/* send */}
        <motion.button
          whileHover={!sending ? { y:-1, filter:'brightness(1.06)' } : {}}
          whileTap={!sending ? { y:3 } : {}}
          onClick={send} disabled={sending}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, height:50, borderRadius:'100px', border:'none',
            background: sending ? '#A7A3AD' : `linear-gradient(135deg,${m.solid},${m.solid}DD)`,
            color:'#FFF', fontFamily:'var(--atl-font-body)', fontSize:'15px', fontWeight:700, cursor: sending ? 'default' : 'pointer',
            boxShadow: sending ? 'none' : `inset 0 1px 0 rgba(255,255,255,.25),0 4px 0 ${m.ledge},0 8px 20px ${m.solid}3D` }}>
          {sending ? <SendingDots/> : <>Send {method} request <Send size={15}/></>}
        </motion.button>

        {/* response */}
        <div>
          <p style={SECTION_LABEL}>Response</p>
          <div style={{ background:'#FAFAF9', border:'1.5px solid #ECE8E1', borderRadius:14, padding:16, minHeight:120, display:'flex', flexDirection:'column', gap:12 }}>
            <AnimatePresence mode="wait">
              {sending ? (
                <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10, minHeight:88 }}>
                  <SendingDots dark/>
                  <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#A7A3AD' }}>Sending…</span>
                </motion.div>
              ) : response && sc ? (
                <motion.div key={`resp-${method}`} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ type:'spring', stiffness:400, damping:28 }}
                  style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:sc.bg, border:`2px solid ${sc.border}`, borderRadius:'100px', padding:'6px 14px' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:sc.dot }}/>
                      <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'14px', fontWeight:800, color:sc.text }}>{response.status} {response.statusText}</span>
                    </div>
                    <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#A7A3AD' }}>128 ms</span>
                  </div>
                  <div style={{ background:'#FFF', borderRadius:12, padding:14, border:'1.5px solid #ECE8E1' }}>
                    {response.body ? (
                      <JsonHighlight json={response.body}/>
                    ) : (
                      <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', color:'#A7A3AD', fontWeight:500 }}>
                        204 No Content — the user was deleted, so there’s nothing to return.
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, minHeight:88, color:'#A7A3AD' }}>
                  <Lock size={14} color="#D1C8BF"/>
                  <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:500 }}>Hit Send to see the response</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SendingDots({ dark }: { dark?: boolean }) {
  return (
    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
      {[0,1,2].map(i => (
        <motion.div key={i} animate={{ scale:[1,1.4,1] }} transition={{ duration:.6, repeat:Infinity, delay:i*.12 }}
          style={{ width:6, height:6, borderRadius:'50%', background: dark ? '#2E5BFF' : '#FFF' }}/>
      ))}
    </div>
  );
}
