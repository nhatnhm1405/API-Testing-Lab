import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Play, CheckCircle2, XCircle, FlaskConical } from "lucide-react";
import confetti from "canvas-confetti";
import type { MockResponse } from "../data/mockApi";
import { playCorrect, playWrong } from "../lib/sound";

// ── Assertion panel — a tiny test runner over the latest response ──────────────
// The heart of the SWT301 angle: the learner declares EXPECTED results (status,
// response time, or a field in the body) and runs them against the ACTUAL
// response. Each check resolves to PASS / FAIL — exactly the input→expected→
// actual loop of a real test case.

type Target = 'status' | 'time' | 'body';

interface Assertion {
  id: number;
  target: Target;
  path: string;       // body field path, e.g. "name" or "0.id"
  op: string;
  expected: string;
  result?: { pass: boolean; actual: string };
}

const OPS: Record<string, { label: string; needsValue: boolean }> = {
  eq:       { label: 'equals (==)',      needsValue: true  },
  neq:      { label: 'not equals (!=)',  needsValue: true  },
  contains: { label: 'contains',         needsValue: true  },
  gt:       { label: 'greater than (>)', needsValue: true  },
  lt:       { label: 'less than (<)',    needsValue: true  },
  isNum:    { label: 'is a number',      needsValue: false },
  isStr:    { label: 'is a string',      needsValue: false },
  exists:   { label: 'exists',           needsValue: false },
};

const OPS_FOR: Record<Target, string[]> = {
  status: ['eq', 'neq', 'gt', 'lt'],
  time:   ['lt', 'gt', 'eq'],
  body:   ['eq', 'neq', 'contains', 'gt', 'lt', 'isNum', 'isStr', 'exists'],
};

let nextId = 1;

// ── Helpers ────────────────────────────────────────────────────────────────────

function getByPath(obj: unknown, path: string): unknown {
  if (!path.trim()) return obj;
  const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.').map(p => p.trim()).filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function format(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'object') return Array.isArray(v) ? `[…${v.length}]` : '{…}';
  return String(v);
}

function evaluate(a: Assertion, ctx: { status: number; time: number; body: unknown }): { pass: boolean; actual: string } {
  const actual = a.target === 'status' ? ctx.status : a.target === 'time' ? ctx.time : getByPath(ctx.body, a.path);
  const exp = a.expected.trim();
  let pass = false;
  switch (a.op) {
    case 'eq':       pass = typeof actual === 'number' ? actual === Number(exp) : String(actual) === exp; break;
    case 'neq':      pass = typeof actual === 'number' ? actual !== Number(exp) : String(actual) !== exp; break;
    case 'contains': pass = String(actual).includes(exp); break;
    case 'gt':       pass = Number(actual) >  Number(exp); break;
    case 'lt':       pass = Number(actual) <  Number(exp); break;
    case 'isNum':    pass = typeof actual === 'number'; break;
    case 'isStr':    pass = typeof actual === 'string'; break;
    case 'exists':   pass = actual !== undefined; break;
  }
  return { pass, actual: format(actual) };
}

const TARGET_LABEL: Record<Target, string> = { status: 'Status', time: 'Time (ms)', body: 'Body field' };

// ── Component ───────────────────────────────────────────────────────────────────

export function AssertionPanel({ response }: { response: MockResponse }) {
  const [assertions, setAssertions] = useState<Assertion[]>([]);
  const [ran, setRan] = useState(false);

  // A fresh response invalidates previous results (re-run against the new data).
  useEffect(() => {
    setRan(false);
    setAssertions(prev => prev.map(a => ({ ...a, result: undefined })));
  }, [response]);

  const ctx = { status: response.status, time: response.timeMs, body: response.data };

  const add = (preset?: Partial<Assertion>) => {
    const target = preset?.target ?? 'status';
    setAssertions(prev => [...prev, {
      id: nextId++,
      target,
      path: preset?.path ?? '',
      op: preset?.op ?? OPS_FOR[target][0],
      expected: preset?.expected ?? '',
      result: undefined,
    }]);
    setRan(false);
  };

  const update = (id: number, patch: Partial<Assertion>) =>
    setAssertions(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = { ...a, ...patch, result: undefined };
      // Keep the operator valid when the target changes.
      if (patch.target && !OPS_FOR[patch.target].includes(next.op)) next.op = OPS_FOR[patch.target][0];
      return next;
    }));

  const remove = (id: number) => setAssertions(prev => prev.filter(a => a.id !== id));

  const run = () => {
    const evaluated = assertions.map(a => ({ ...a, result: evaluate(a, ctx) }));
    setAssertions(evaluated);
    setRan(true);
    const allPassed = evaluated.length > 0 && evaluated.every(a => a.result!.pass);
    (allPassed ? playCorrect : playWrong)();
    if (allPassed) {
      setTimeout(() => confetti({
        particleCount: 80, spread: 70, origin: { y: .4 },
        colors: ['#2BD46B', '#8FE34A', '#22C55E', '#B9E534'],
      }), evaluated.length * 80 + 150);
    }
  };

  const passed = assertions.filter(a => a.result?.pass).length;
  const total  = assertions.length;
  const allPass = ran && total > 0 && passed === total;

  // Quick-add suggestions tailored to the current response.
  const suggestions: Array<{ label: string; preset: Partial<Assertion> }> = [
    { label: `status == ${response.status}`, preset: { target: 'status', op: 'eq', expected: String(response.status) } },
    { label: 'time < 1000', preset: { target: 'time', op: 'lt', expected: '1000' } },
  ];
  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    const keys = Object.keys(response.data as Record<string, unknown>);
    if (keys.includes('id'))   suggestions.push({ label: 'body.id is a number', preset: { target: 'body', path: 'id', op: 'isNum', expected: '' } });
    if (keys.includes('name')) suggestions.push({ label: 'body.name exists',     preset: { target: 'body', path: 'name', op: 'exists', expected: '' } });
  }

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.3 }}
      style={{ background:'#FFF', borderRadius:24, border:'1.5px solid #ECE8E1', boxShadow:'0 1px 2px rgba(28,27,42,.05),0 10px 30px rgba(28,27,42,.07)', padding:'16px 18px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
        <FlaskConical size={14} color="#7C3AED"/>
        <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#A7A3AD', margin:0, flex:1 }}>Tests · assertions</p>
        {ran && total > 0 && (
          <motion.span initial={{ scale:.6, opacity:0 }} animate={{ scale:1, opacity:1 }}
            style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:800, color: allPass ? '#15803D' : '#9F1239', background: allPass ? '#ECFDF3' : '#FFF1F2', border:`1.5px solid ${allPass ? '#BBF7D0' : '#FECDD3'}`, borderRadius:100, padding:'2px 10px' }}>
            {passed}/{total} passed
          </motion.span>
        )}
      </div>

      {/* Suggestions */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: assertions.length ? 12 : 10 }}>
        {suggestions.map(s => (
          <motion.button key={s.label} whileTap={{ scale:.95 }} onClick={() => add(s.preset)}
            style={{ fontFamily:'monospace', fontSize:'10.5px', fontWeight:700, padding:'4px 9px', borderRadius:100, border:'1.5px dashed #DDD6FE', background:'#F5F3FF', color:'#6D28D9', cursor:'pointer' }}>
            + {s.label}
          </motion.button>
        ))}
      </div>

      {/* Assertion rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <AnimatePresence initial={false}>
          {assertions.map((a, i) => {
            const op = OPS[a.op];
            const r = a.result;
            return (
              <motion.div key={a.id} layout
                initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, height:0 }}
                transition={{ delay: ran ? i * 0.06 : 0 }}
                style={{ border:`1.5px solid ${r ? (r.pass ? '#BBF7D0' : '#FECDD3') : '#ECE8E1'}`, background: r ? (r.pass ? '#F6FEF9' : '#FFF8F8') : '#FAFAF9', borderRadius:12, padding:'8px 10px', display:'flex', flexDirection:'column', gap:6, transition:'background .2s, border-color .2s' }}>

                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  {/* target */}
                  <select value={a.target} onChange={e => update(a.id, { target: e.target.value as Target })}
                    style={selStyle}>
                    {(['status','time','body'] as Target[]).map(t => <option key={t} value={t}>{TARGET_LABEL[t]}</option>)}
                  </select>

                  {/* body path */}
                  {a.target === 'body' && (
                    <input value={a.path} onChange={e => update(a.id, { path: e.target.value })} placeholder="field e.g. name"
                      style={{ ...inputStyle, flex:'1 1 90px' }}/>
                  )}

                  {/* operator */}
                  <select value={a.op} onChange={e => update(a.id, { op: e.target.value })} style={selStyle}>
                    {OPS_FOR[a.target].map(o => <option key={o} value={o}>{OPS[o].label}</option>)}
                  </select>

                  {/* expected */}
                  {op.needsValue && (
                    <input value={a.expected} onChange={e => update(a.id, { expected: e.target.value })} placeholder="expected"
                      style={{ ...inputStyle, flex:'1 1 80px' }}/>
                  )}

                  <button onClick={() => remove(a.id)}
                    style={{ width:24, height:24, border:'none', background:'transparent', cursor:'pointer', color:'#A7A3AD', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', marginLeft:'auto' }}>
                    <Trash2 size={13}/>
                  </button>
                </div>

                {/* result */}
                <AnimatePresence>
                  {r && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                      style={{ display:'flex', alignItems:'center', gap:6, overflow:'hidden' }}>
                      {r.pass
                        ? <CheckCircle2 size={14} color="#22C55E" strokeWidth={2.6}/>
                        : <XCircle size={14} color="#F43F5E" strokeWidth={2.6}/>}
                      <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:800, color: r.pass ? '#15803D' : '#9F1239' }}>
                        {r.pass ? 'PASS' : 'FAIL'}
                      </span>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B6A7B' }}>
                        actual: {r.actual}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12 }}>
        <button onClick={() => add()}
          style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1.5px dashed #D1C8BF', borderRadius:100, padding:'7px 14px', cursor:'pointer', fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#A7A3AD' }}>
          <Plus size={13}/> Add check
        </button>
        <div style={{ flex:1 }}/>
        <motion.button whileHover={total ? { y:-1 } : {}} whileTap={total ? { y:1 } : {}}
          onClick={total ? run : undefined} disabled={!total}
          style={{ display:'flex', alignItems:'center', gap:7, border:'none', borderRadius:100, padding:'9px 18px', cursor: total ? 'pointer' : 'default',
            background: total ? 'linear-gradient(135deg,#8B5CF6,#A78BFA)' : '#EDE9E2', color: total ? '#FFF' : '#A7A3AD',
            fontFamily:'var(--atl-font-body)', fontSize:'13px', fontWeight:700,
            boxShadow: total ? 'inset 0 1px 0 rgba(255,255,255,.2), 0 4px 0 #6D28D9, 0 8px 20px rgba(139,92,246,.28)' : 'none' }}>
          <Play size={14} fill="currentColor"/> Run tests
        </motion.button>
      </div>

      {/* Overall banner */}
      <AnimatePresence>
        {ran && total > 0 && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ marginTop:12, borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:8,
              background: allPass ? 'linear-gradient(135deg,#ECFDF5,#D1FAE5)' : '#FFF1F2',
              border:`1.5px solid ${allPass ? '#6EE7B7' : '#FECDD3'}` }}>
            <span style={{ fontSize:16 }}>{allPass ? '🎉' : '🔍'}</span>
            <p style={{ fontFamily:'var(--atl-font-body)', fontSize:'12.5px', fontWeight:600, color: allPass ? '#065F46' : '#9F1239', margin:0, lineHeight:1.4 }}>
              {allPass
                ? `All ${total} checks passed — the response matches every expectation.`
                : `${total - passed} of ${total} checks failed. Compare “expected” with the “actual” value to see why.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const selStyle: React.CSSProperties = {
  background:'#FFF', border:'1.5px solid #ECE8E1', borderRadius:8, padding:'6px 8px',
  fontFamily:'var(--atl-font-body)', fontSize:'11px', fontWeight:600, color:'#1C1B2A', outline:'none', cursor:'pointer',
};

const inputStyle: React.CSSProperties = {
  background:'#FFF', border:'1.5px solid #ECE8E1', borderRadius:8, padding:'6px 9px',
  fontFamily:'monospace', fontSize:'11px', color:'#1C1B2A', outline:'none', minWidth:0,
};
