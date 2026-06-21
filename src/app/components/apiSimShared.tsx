import { motion, AnimatePresence } from "motion/react";

// ── Shared building blocks for the API Simulator & Free Lab ────────────────────
// Method colour tokens, status-code styling, the JSON syntax highlighter, and the
// client↔server "travel" animation. Extracted so the scripted simulator and the
// free sandbox stay visually identical without duplicating code.

export type TravelPhase = 'idle' | 'outbound' | 'server-flash' | 'inbound' | 'done';

// ── Method design tokens ──────────────────────────────────────────────────────

export const M: Record<string, { grad: string; ledge: string; muted: string; text: string; border: string; ambient: string }> = {
  GET:    { grad:'linear-gradient(135deg,#2E5BFF,#5B7BFF)', ledge:'#1E3FCC', muted:'#EEF2FF', text:'#1D4ED8', border:'#93C5FD',  ambient:'rgba(46,91,255,.25)'  },
  POST:   { grad:'linear-gradient(135deg,#10B981,#34D399)', ledge:'#059669', muted:'#ECFDF5', text:'#065F46', border:'#6EE7B7',  ambient:'rgba(16,185,129,.25)' },
  PUT:    { grad:'linear-gradient(135deg,#F59E0B,#FCD34D)', ledge:'#D97706', muted:'#FFFBEB', text:'#92400E', border:'#FDE68A',  ambient:'rgba(245,158,11,.22)' },
  PATCH:  { grad:'linear-gradient(135deg,#8B5CF6,#A78BFA)', ledge:'#6D28D9', muted:'#F5F3FF', text:'#5B21B6', border:'#C4B5FD',  ambient:'rgba(139,92,246,.22)' },
  DELETE: { grad:'linear-gradient(135deg,#F43F5E,#FB7185)', ledge:'#C1132F', muted:'#FFF1F2', text:'#9F1239', border:'#FECACA',  ambient:'rgba(244,63,94,.22)'  },
};

// ── Status pill helper ─────────────────────────────────────────────────────────

export function statusStyle(code: number) {
  const f = Math.floor(code / 100);
  if (f === 2) return { bg:'#ECFDF3', border:'#BBF7D0', text:'#15803D', dot:'#22C55E' };
  if (f === 4) return { bg:'#FFF1F2', border:'#FECDD3', text:'#9F1239', dot:'#F43F5E' };
  return              { bg:'#FFF7ED', border:'#FED7AA', text:'#92400E', dot:'#F97316' };
}

// ── JSON syntax highlighter ────────────────────────────────────────────────────

export function JsonLine({ line }: { line: string }) {
  if (line.startsWith('//')) return <span style={{ color:'#6B7280', fontStyle:'italic' }}>{line}</span>;
  const kv = line.match(/^(\s*)(".*?"):\s*(".*?"|[\d.]+|true|false|null)(,?)$/);
  if (kv) {
    const [, indent, key, val, comma] = kv;
    const isStr = val.startsWith('"');
    const isNum = /^[\d.]+$/.test(val);
    const vc    = isStr ? '#6EE7B7' : isNum ? '#FCD34D' : '#A78BFA';
    return (
      <span>
        <span style={{ color:'#6B7280' }}>{indent}</span>
        <span style={{ color:'#C4B5FD' }}>{key}</span>
        <span style={{ color:'#6B7280' }}>: </span>
        <span style={{ color:vc }}>{val}</span>
        <span style={{ color:'#6B7280' }}>{comma}</span>
      </span>
    );
  }
  return <span style={{ color:'#9CA3AF' }}>{line}</span>;
}

// ── Travel diagram ─────────────────────────────────────────────────────────────

export function TravelDiagram({ phase, method }: { phase: TravelPhase; method: string }) {
  const ms = M[method] ?? M.GET;
  const serverGlow = phase === 'server-flash' || phase === 'inbound' || phase === 'done';
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'28px 24px', gap:0, position:'relative' }}>
      <motion.div
        animate={phase === 'outbound' ? { scale:[1,1.08,1], transition:{ duration:.3 } } : {}}
        style={{ width:56, height:56, borderRadius:14, background:`${ms.muted}`, border:`2px solid ${ms.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, boxShadow:`0 4px 12px ${ms.ambient}`, zIndex:1 }}>
        💻
      </motion.div>

      <div style={{ flex:1, height:3, background:'#ECE8E1', position:'relative', margin:'0 10px', borderRadius:2 }}>
        <AnimatePresence>
          {(phase === 'outbound' || phase === 'server-flash') && (
            <motion.div key="out"
              initial={{ left:0, scale:0 }} animate={{ left:'calc(100% - 14px)', scale:1 }} exit={{ opacity:0 }}
              transition={{ duration:.55, ease:[.34,1.56,.64,1] }}
              style={{ position:'absolute', top:-6, width:14, height:14, borderRadius:'50%', background:ms.grad, boxShadow:`0 0 12px ${ms.ambient}`, zIndex:2 }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase === 'inbound' && (
            <motion.div key="in"
              initial={{ right:0, scale:0 }} animate={{ right:'calc(100% - 14px)', scale:1 }}
              transition={{ duration:.55, ease:[.34,1.56,.64,1] }}
              style={{ position:'absolute', top:-6, width:14, height:14, borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#8FE34A)', boxShadow:'0 0 12px rgba(34,197,94,.5)', zIndex:2 }}
            />
          )}
        </AnimatePresence>
      </div>

      <motion.div
        animate={serverGlow ? {
          scale:[1,1.12,1.04,1],
          boxShadow:['0 4px 12px rgba(16,185,129,.1)','0 0 28px rgba(16,185,129,.55)','0 4px 12px rgba(16,185,129,.1)'],
          transition:{ duration:.4 },
        } : {}}
        style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border:`2px solid ${serverGlow ? '#34D399' : '#A7F3D0'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, zIndex:1 }}>
        🖥️
      </motion.div>

      <div style={{ position:'absolute', bottom:6, left:0, width:56, textAlign:'center', fontFamily:'var(--atl-font-body)', fontSize:10, fontWeight:600, color:'#A7A3AD' }}>Client</div>
      <div style={{ position:'absolute', bottom:6, right:0, width:56, textAlign:'center', fontFamily:'var(--atl-font-body)', fontSize:10, fontWeight:600, color:'#A7A3AD' }}>Server</div>
    </div>
  );
}
