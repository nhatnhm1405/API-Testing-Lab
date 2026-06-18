import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StoryFlow, Beat } from "./StoryFlow";

// ── The real API story: the same trip, now in HTTP terms ──────────
const API_BEATS: Beat[] = [
  {
    emoji: '💻', name: 'Client · Browser / App', tone: '#2563EB',
    line: 'GET /pho HTTP/1.1',
    question: 'What is the client doing?',
    options: [
      { text: 'Sending a request to the server', correct: true },
      { text: 'Storing data on its hard drive',  correct: false },
    ],
    api: 'Request line — METHOD + path (GET /pho)',
  },
  {
    emoji: '💻', name: 'Client · Browser / App', tone: '#2563EB',
    line: 'Accept: application/json · Authorization: Bearer …',
    question: 'What are these headers for?',
    options: [
      { text: 'Extra info about the request (format, auth)', correct: true },
      { text: 'The actual dish data being returned',         correct: false },
    ],
    api: 'Headers = metadata about the request',
  },
  {
    emoji: '🖥️', name: 'Server · API Backend', tone: '#059669',
    line: 'Looking up /pho and running the handler…',
    question: 'What is the server doing?',
    options: [
      { text: 'Processing the request to build a response', correct: true },
      { text: 'Sending its own request to the client',      correct: false },
    ],
    api: 'Server processes the request',
  },
  {
    emoji: '🖥️', name: 'Server · API Backend', tone: '#059669',
    line: 'Status: 200 OK ✅',
    question: 'What does 200 OK mean?',
    options: [
      { text: 'Success — the request worked', correct: true },
      { text: 'Not Found — the resource is missing', correct: false },
    ],
    api: '2xx = success · 200 OK',
  },
  {
    emoji: '🖥️', name: 'Server · API Backend', tone: '#059669',
    line: '{ "dish": "phở", "price": 50000 }',
    question: 'What is the server sending back?',
    options: [
      { text: 'The response body with the data', correct: true },
      { text: 'A brand-new request',             correct: false },
    ],
    api: 'Response body — usually JSON',
  },
];

export function ApiStoryFlow({ onContinue }: { onContinue?: () => void }) {
  return (
    <StoryFlow
      beats={API_BEATS}
      finalScene={<ApiScene running />}
      revealPrefix="Key takeaway:"
      doneNote="🔌 That’s a real HTTP round-trip — here it is, looping live:"
      doneSummary="The client sends an HTTP request; the server processes it and replies with a status code + JSON body."
      onContinue={onContinue}
    />
  );
}

// ── Animated, looping client ↔ server exchange ─────────────────────
const POS = ['22%', '78%'];

const STATIONS = [
  { who:'client', emoji:'💻', title:'Client', sub:'Browser / App', color:'#2563EB' },
  { who:'server', emoji:'🖥️', title:'Server', sub:'API Backend',   color:'#059669' },
] as const;

interface Frame { who: string | null; pos: number; emoji: string | null; bubble: string | null; tone: string; dur: number }

const TIMELINE: Frame[] = [
  { who:'client', pos:0, emoji:'📨', bubble:'GET /pho  🔍',          tone:'#2563EB', dur:1700 },
  { who:'server', pos:1, emoji:'📨', bubble:'Handling the request ⚙️', tone:'#059669', dur:1600 },
  { who:'server', pos:1, emoji:'📦', bubble:'200 OK ✅',              tone:'#059669', dur:1500 },
  { who:'client', pos:0, emoji:'📦', bubble:'{ "dish": "phở" }',      tone:'#2563EB', dur:1900 },
  { who:null,     pos:0, emoji:null, bubble:null,                     tone:'#000',    dur:1500 }, // pause
];

function Station({ s, active }: { s: typeof STATIONS[number]; active: boolean }) {
  return (
    <div style={{ position:'absolute', left:POS[STATIONS.indexOf(s)], top:62, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, width:110, zIndex:2 }}>
      <motion.div
        animate={active ? { scale:[1,1.12,1], boxShadow:[`0 4px 14px ${s.color}22`,`0 8px 22px ${s.color}55`,`0 4px 14px ${s.color}22`] } : { scale:1 }}
        transition={active ? { duration:.9, repeat:Infinity, ease:'easeInOut' } : { duration:.3 }}
        style={{ width:54, height:54, borderRadius:16, background:'#FFF', border:`2px solid ${active ? s.color : s.color+'40'}`, boxShadow:`0 4px 14px ${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:27 }}>
        {s.emoji}
      </motion.div>
      <span style={{ fontFamily:'var(--atl-font-display)', fontSize:'13px', fontWeight:800, color:'#1C1B2A', lineHeight:1 }}>{s.title}</span>
      <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'10px', fontWeight:600, color:s.color }}>{s.sub}</span>
    </div>
  );
}

function ApiScene({ running }: { running: boolean }) {
  const [frame, setFrame] = useState(0);
  const cur = TIMELINE[frame];

  useEffect(() => { if (!running) setFrame(0); }, [running]);
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setFrame(f => (f + 1) % TIMELINE.length), TIMELINE[frame].dur);
    return () => clearTimeout(t);
  }, [running, frame]);

  return (
    <div style={{ position:'relative', height:148, background:'linear-gradient(135deg,#F5FAFF,#F1FBF5)', borderRadius:18, border:'1.5px solid #E2EEF0', overflow:'hidden' }}>
      {/* connecting line through the station icons */}
      <div style={{ position:'absolute', left:'22%', right:'22%', top:88, height:3, background:'repeating-linear-gradient(90deg,#CBD9DA,#CBD9DA 6px,transparent 6px,transparent 12px)' }} />

      {/* speech bubble */}
      <AnimatePresence>
        {running && cur.bubble && (
          <motion.div key={frame}
            initial={{ opacity:0, y:8, scale:.9, x:'-50%' }}
            animate={{ opacity:1, y:0, scale:1, x:'-50%' }}
            exit={{ opacity:0, y:-6, scale:.9, x:'-50%' }}
            transition={{ duration:.25 }}
            style={{ position:'absolute', left:POS[cur.pos], top:8, maxWidth:220, zIndex:5, pointerEvents:'none' }}>
            <div style={{ position:'relative', background:'#FFF', border:`1.5px solid ${cur.tone}40`, borderRadius:12, padding:'7px 12px', boxShadow:`0 6px 18px ${cur.tone}1F`, textAlign:'center' }}>
              <span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#1C1B2A', lineHeight:1.35, whiteSpace:'nowrap' }}>{cur.bubble}</span>
              {/* tail */}
              <div style={{ position:'absolute', left:'50%', bottom:-6, transform:'translateX(-50%) rotate(45deg)', width:10, height:10, background:'#FFF', borderRight:`1.5px solid ${cur.tone}40`, borderBottom:`1.5px solid ${cur.tone}40` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* travelling packet (request → response) */}
      <AnimatePresence>
        {running && cur.emoji && (
          <motion.div key={cur.emoji}
            initial={{ opacity:0, scale:.4, left:POS[cur.pos], x:'-50%' }}
            animate={{ opacity:1, scale:1, left:POS[cur.pos], x:'-50%' }}
            exit={{ opacity:0, scale:.5, x:'-50%' }}
            transition={{ left:{ duration:.75, ease:'easeInOut' }, default:{ duration:.3 } }}
            style={{ position:'absolute', top:72, fontSize:24, zIndex:3, pointerEvents:'none', filter:`drop-shadow(0 4px 8px ${cur.tone}4D)` }}>
            {cur.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* stations */}
      {STATIONS.map(s => (
        <Station key={s.who} s={s} active={running && cur.who === s.who} />
      ))}
    </div>
  );
}
