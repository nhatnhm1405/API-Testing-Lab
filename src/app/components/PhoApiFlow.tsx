import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StoryFlow, Beat } from "./StoryFlow";

// ── Phở-restaurant analogy of an API round-trip ───────────────────
// The everyday food-ordering story. The API takeaway is revealed only
// after the learner answers each "what's happening?" question.
const PHO_BEATS: Beat[] = [
  {
    emoji: '🧑', name: 'Customer · Client', tone: '#2563EB',
    line: '“One special combo phở, please!” 🙌',
    question: 'What is the customer doing?',
    options: [
      { text: 'Placing an order with the staff', correct: true },
      { text: 'Bringing food out to a table',    correct: false },
    ],
    api: 'Client sends a request — GET /pho',
  },
  {
    emoji: '🧑‍💼', name: 'Waiter · API', tone: '#7C3AED',
    line: '“Got it! Let me note your order and check the menu.”',
    question: 'What is the waiter doing?',
    options: [
      { text: "Taking the order and checking it's on the menu", correct: true },
      { text: 'Cooking the dish in the kitchen',                correct: false },
    ],
    api: 'API receives & validates the request',
  },
  {
    emoji: '👨‍🍳', name: 'Chef · Server', tone: '#059669',
    line: '“On it — cooking your phở now! 🔥”',
    question: 'What is the kitchen doing?',
    options: [
      { text: 'Preparing the dish that was ordered', correct: true },
      { text: 'Taking an order from another table',  correct: false },
    ],
    api: 'Server processes the request',
  },
  {
    emoji: '🧑‍💼', name: 'Waiter · API', tone: '#7C3AED',
    line: '“Here you go — one hot bowl of phở! 🍜”',
    question: 'What is happening as the bowl comes back?',
    options: [
      { text: 'The finished dish is served back to the customer', correct: true },
      { text: 'The customer is placing another order',            correct: false },
    ],
    api: 'Server returns a response — 200 OK',
  },
  {
    emoji: '🧑', name: 'Customer · Client', tone: '#2563EB',
    line: '“Mmm, looks delicious. Thank you!” 😋',
    question: 'And finally, the customer…',
    options: [
      { text: 'Gets the bowl of phở they ordered', correct: true },
      { text: 'Walks into the kitchen to cook',    correct: false },
    ],
    api: 'Client receives the data',
  },
];

export function PhoApiFlow({ onContinue }: { onContinue?: () => void }) {
  return (
    <StoryFlow
      beats={PHO_BEATS}
      finalScene={<Scene running />}
      doneNote="🎉 You traced a full API round-trip — here it is, looping live:"
      doneSummary="The order travels client → API → server, and the response (your 🍜) comes all the way back."
      onContinue={onContinue}
    />
  );
}

// ── Animated, looping 3-station scene with conversation ────────────
const LEFTS = ['15%', '50%', '85%'];

const STATIONS = [
  { who:'customer', emoji:'🧑',   title:'Customer', sub:'Client', color:'#2563EB' },
  { who:'waiter',   emoji:'🧑‍💼', title:'Waiter',   sub:'API',    color:'#7C3AED' },
  { who:'chef',     emoji:'👨‍🍳', title:'Chef',     sub:'Server', color:'#059669' },
] as const;

interface Frame { who: string | null; pos: number; emoji: string | null; bubble: string | null; tone: string; dur: number }

// One full round-trip, then a short pause, then it loops.
const TIMELINE: Frame[] = [
  { who:'customer', pos:0, emoji:'📝', bubble:'One bowl of phở, please! 🙏', tone:'#2563EB', dur:1700 },
  { who:'waiter',   pos:1, emoji:'📝', bubble:'Got it — sending to the kitchen 👍', tone:'#7C3AED', dur:1500 },
  { who:'chef',     pos:2, emoji:'📝', bubble:'Cooking your phở… 🔥', tone:'#059669', dur:1800 },
  { who:'chef',     pos:2, emoji:'🍜', bubble:'Order up! One hot bowl 🍜', tone:'#059669', dur:1500 },
  { who:'waiter',   pos:1, emoji:'🍜', bubble:'Here it comes!', tone:'#7C3AED', dur:1400 },
  { who:'customer', pos:0, emoji:'🍜', bubble:'Cảm ơn! Thank you 😋', tone:'#2563EB', dur:1800 },
  { who:null,       pos:0, emoji:null, bubble:null, tone:'#000', dur:1600 }, // pause between loops
];

function Station({ s, active }: { s: typeof STATIONS[number]; active: boolean }) {
  return (
    <div style={{ position:'absolute', left:LEFTS[STATIONS.indexOf(s)], top:62, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, width:90, zIndex:2 }}>
      <motion.div
        animate={active ? { scale:[1,1.12,1], boxShadow:[`0 4px 14px ${s.color}22`,`0 8px 22px ${s.color}55`,`0 4px 14px ${s.color}22`] } : { scale:1 }}
        transition={active ? { duration:.9, repeat:Infinity, ease:'easeInOut' } : { duration:.3 }}
        style={{ width:52, height:52, borderRadius:16, background:'#FFF', border:`2px solid ${active ? s.color : s.color+'40'}`, boxShadow:`0 4px 14px ${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
        {s.emoji}
      </motion.div>
      <span style={{ fontFamily:'var(--atl-font-display)', fontSize:'13px', fontWeight:800, color:'#1C1B2A', lineHeight:1 }}>{s.title}</span>
      <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'10px', fontWeight:600, color:s.color }}>{s.sub}</span>
    </div>
  );
}

function Scene({ running }: { running: boolean }) {
  const [frame, setFrame] = useState(0);
  const cur = TIMELINE[frame];

  useEffect(() => { if (!running) setFrame(0); }, [running]);
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setFrame(f => (f + 1) % TIMELINE.length), TIMELINE[frame].dur);
    return () => clearTimeout(t);
  }, [running, frame]);

  return (
    <div style={{ position:'relative', height:148, background:'linear-gradient(135deg,#FFFBF5,#F5F3FF)', borderRadius:18, border:'1.5px solid #F0EAE0', overflow:'hidden' }}>
      {/* connecting line through the station icons */}
      <div style={{ position:'absolute', left:'15%', right:'15%', top:88, height:3, background:'repeating-linear-gradient(90deg,#D9D2C7,#D9D2C7 6px,transparent 6px,transparent 12px)' }} />

      {/* speech bubble */}
      <AnimatePresence>
        {running && cur.bubble && (
          <motion.div key={frame}
            initial={{ opacity:0, y:8, scale:.9, x:'-50%' }}
            animate={{ opacity:1, y:0, scale:1, x:'-50%' }}
            exit={{ opacity:0, y:-6, scale:.9, x:'-50%' }}
            transition={{ duration:.25 }}
            style={{ position:'absolute', left:LEFTS[cur.pos], top:8, maxWidth:190, zIndex:5, pointerEvents:'none' }}>
            <div style={{ position:'relative', background:'#FFF', border:`1.5px solid ${cur.tone}40`, borderRadius:12, padding:'7px 12px', boxShadow:`0 6px 18px ${cur.tone}1F`, textAlign:'center' }}>
              <span style={{ fontFamily:'var(--atl-font-body)', fontSize:'12px', fontWeight:600, color:'#1C1B2A', lineHeight:1.35, whiteSpace:'nowrap' }}>{cur.bubble}</span>
              {/* tail */}
              <div style={{ position:'absolute', left:'50%', bottom:-6, transform:'translateX(-50%) rotate(45deg)', width:10, height:10, background:'#FFF', borderRight:`1.5px solid ${cur.tone}40`, borderBottom:`1.5px solid ${cur.tone}40` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* travelling token (order → bowl) */}
      <AnimatePresence>
        {running && cur.emoji && (
          <motion.div key={cur.emoji}
            initial={{ opacity:0, scale:.4, left:LEFTS[cur.pos], x:'-50%' }}
            animate={{ opacity:1, scale:1, left:LEFTS[cur.pos], x:'-50%' }}
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
