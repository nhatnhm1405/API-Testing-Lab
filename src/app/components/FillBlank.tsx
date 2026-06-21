import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { playPop, playClick } from "../lib/sound";

interface FillBlankProps {
  template: string;
  blanks: string[];
  wordBank: string[];
  instruction?: string;
  checkTrigger: number;
  onReadyChange: (ready: boolean) => void;
  onResult: (correct: boolean) => void;
  phase: 'answering' | 'correct' | 'wrong';
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function FillBlankExercise({
  template, blanks, wordBank, instruction,
  checkTrigger, onReadyChange, onResult, phase,
}: FillBlankProps) {
  const parts = template.split('____');

  const [filled,     setFilled]     = useState<(string | null)[]>(() => new Array(blanks.length).fill(null));
  const [bank,       setBank]       = useState<string[]>(() => shuffle(wordBank));
  const [correctness,setCorrectness]= useState<(boolean | null)[]>(() => new Array(blanks.length).fill(null));

  // Report readiness
  useEffect(() => {
    onReadyChange(filled.every(f => f !== null));
  }, [filled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate when check is triggered
  useEffect(() => {
    if (checkTrigger === 0) return;
    const results = filled.map((w, i) => w === blanks[i]);
    setCorrectness(results);
    onResult(results.every(Boolean));
  }, [checkTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const fillNext = (word: string) => {
    const idx = filled.indexOf(null);
    if (idx === -1) return;
    setFilled(prev => { const n = [...prev]; n[idx] = word; return n; });
    setBank(prev => prev.filter(w => w !== word));
    playPop();
  };

  const clearBlank = (idx: number) => {
    if (phase !== 'answering' || correctness[idx] !== null) return;
    const word = filled[idx];
    if (!word) return;
    setFilled(prev => { const n = [...prev]; n[idx] = null; return n; });
    setBank(prev => [...prev, word]);
    playClick();
  };

  const isAnswering = phase === 'answering' && checkTrigger === 0;

  return (
    <div>
      {instruction && (
        <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#A7A3AD',marginBottom:16 }}>
          {instruction}
        </p>
      )}

      {/* Template */}
      <div style={{ fontFamily:'var(--atl-font-display)',fontSize:'20px',fontWeight:700,color:'#1C1B2A',lineHeight:2.0,marginBottom:32 }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <BlankSlot
                value={filled[i]}
                correct={correctness[i]}
                onClick={() => clearBlank(i)}
                interactive={isAnswering && filled[i] !== null}
              />
            )}
          </span>
        ))}
      </div>

      {/* Word bank */}
      <div>
        <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#A7A3AD',marginBottom:10 }}>
          Word Bank
        </p>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap',minHeight:42 }}>
          {bank.map(word => (
            <motion.button
              key={word}
              layoutId={word}
              layout
              transition={{ type:'spring', stiffness:500, damping:34 }}
              whileHover={isAnswering ? { y:-2 } : {}}
              whileTap={isAnswering ? { scale:.95 } : {}}
              onClick={() => isAnswering && fillNext(word)}
              style={{
                fontFamily:'var(--atl-font-body)',fontSize:'15px',fontWeight:600,
                color:'#1C1B2A',background:'#F2EFEA',border:'1.5px solid #ECE8E1',
                borderRadius:'100px',padding:'7px 18px',
                cursor:isAnswering ? 'pointer' : 'default',
              }}
            >
              {word}
            </motion.button>
          ))}
          {bank.length === 0 && (
            <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',color:'#A7A3AD',fontStyle:'italic',margin:0 }}>
              All words placed — click a blank to swap back.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BlankSlot({ value, correct, onClick, interactive }: {
  value: string | null;
  correct: boolean | null;
  onClick: () => void;
  interactive: boolean;
}) {
  const isCorrect = correct === true;
  const isWrong   = correct === false;

  return (
    <motion.span
      layout
      transition={{ type:'spring', stiffness:500, damping:34 }}
      animate={isWrong ? { x:[0,-7,7,-5,5,-2,2,0], transition:{ duration:.45 } } : {}}
      onClick={onClick}
      style={{
        display:'inline-flex',alignItems:'center',justifyContent:'center',
        verticalAlign:'middle',
        minWidth:108,minHeight:40,padding:value ? 3 : '2px 14px',margin:'0 5px',
        borderRadius:12,
        cursor: interactive ? 'pointer' : 'default',
        background: value ? 'transparent' : '#FAF7F2',
        border: `2px dashed ${value ? 'transparent' : '#C4BDB0'}`,
        transition:'border-color .2s',
      }}
    >
      {value && (
        <motion.span
          layoutId={value}
          transition={{ type:'spring', stiffness:500, damping:34 }}
          style={{
            display:'inline-flex',alignItems:'center',justifyContent:'center',
            padding:'7px 18px',borderRadius:'100px',whiteSpace:'nowrap',
            fontFamily:'var(--atl-font-body)',fontSize:'15px',fontWeight:600,
            background: isCorrect ? '#ECFDF3' : isWrong ? '#FFF1F2' : '#EEF2FF',
            border:`1.5px solid ${isCorrect ? '#22C55E' : isWrong ? '#F43F5E' : '#2E5BFF'}`,
            color: isCorrect ? '#15803D' : isWrong ? '#BE123C' : '#1E40AF',
            boxShadow:'0 2px 8px rgba(46,91,255,.14)',
          }}
        >
          {value}
        </motion.span>
      )}
    </motion.span>
  );
}
