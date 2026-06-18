import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GripVertical } from "lucide-react";

interface OrderItem { id: string; text: string; badge?: string }

interface DragDropOrderProps {
  instruction: string;
  items: OrderItem[]; // correct order
  checkTrigger: number;
  onReadyChange: (ready: boolean) => void;
  onResult: (correct: boolean) => void;
  phase: 'answering' | 'correct' | 'wrong';
}

export function DragDropOrderExercise({
  instruction, items: correctItems,
  checkTrigger, onReadyChange, onResult, phase,
}: DragDropOrderProps) {
  const [order,      setOrder]      = useState<OrderItem[]>(() => shuffle([...correctItems]));
  const [draggingIdx,setDraggingIdx]= useState<number | null>(null);
  const [overIdx,    setOverIdx]    = useState<number | null>(null);
  const [checked,    setChecked]    = useState(false);
  const [correctness,setCorrectness]= useState<(boolean | null)[]>([]);

  const isAnswering = phase === 'answering' && checkTrigger === 0;

  // Always ready (user can check at any time)
  useEffect(() => { onReadyChange(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checkTrigger === 0) return;
    const results = order.map((item, i) => item.id === correctItems[i].id);
    setCorrectness(results);
    setChecked(true);
    onResult(results.every(Boolean));
  }, [checkTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveCard = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setOrder(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggingIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx !== null) moveCard(draggingIdx, idx);
    setDraggingIdx(null);
    setOverIdx(null);
  };

  return (
    <div>
      <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:600,color:'#6B6A7B',marginBottom:20 }}>
        {instruction}
      </p>
      <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',color:'#A7A3AD',marginBottom:16 }}>
        Drag the cards into the correct sequence.
      </p>

      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {order.map((item, i) => {
          const isCorrect = correctness[i] === true;
          const isWrong   = correctness[i] === false;

          return (
            <motion.div
              key={item.id}
              layout
              animate={isWrong ? { x:[0,-8,8,-5,5,0], transition:{ duration:.4 } } : {}}
              draggable={isAnswering}
              onDragStart={e => isAnswering && handleDragStart(e, i)}
              onDragOver={e => isAnswering && handleDragOver(e, i)}
              onDrop={e => isAnswering && handleDrop(e, i)}
              onDragEnd={() => { setDraggingIdx(null); setOverIdx(null); }}
              style={{
                display:'flex',alignItems:'center',gap:12,
                padding:'14px 16px',borderRadius:14,
                background: isCorrect ? '#ECFDF3' : isWrong ? '#FFF1F2' : overIdx === i && draggingIdx !== i ? '#EEF2FF' : '#FFF',
                border: `1.5px solid ${isCorrect ? '#BBF7D0' : isWrong ? '#FECDD3' : overIdx === i && draggingIdx !== i ? '#2E5BFF' : '#ECE8E1'}`,
                boxShadow: draggingIdx === i ? '0 8px 24px rgba(28,27,42,.15)' : '0 1px 3px rgba(28,27,42,.06)',
                opacity: draggingIdx === i ? 0.4 : 1,
                cursor: isAnswering ? 'grab' : 'default',
                transition:'background .15s,border-color .15s',
                userSelect:'none',
              }}
            >
              {isAnswering && <GripVertical size={16} color="#A7A3AD" style={{ flexShrink:0 }}/>}

              {/* Position number badge */}
              <div style={{
                width:28,height:28,borderRadius:'50%',flexShrink:0,
                background: isCorrect ? '#22C55E' : isWrong ? '#F43F5E' : '#F2EFEA',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:800,
                color: isCorrect ? 'white' : isWrong ? 'white' : '#6B6A7B',
              }}>
                {i + 1}
              </div>

              <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'15px',fontWeight:600,color:'#1C1B2A',flex:1 }}>
                {item.text}
              </span>

              {item.badge && (
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,color:'#A7A3AD',letterSpacing:'.04em' }}>
                  {item.badge}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {!checked && isAnswering && (
        <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',color:'#A7A3AD',marginTop:16,textAlign:'center' }}>
          Tip: drag cards up or down to reorder them.
        </p>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
