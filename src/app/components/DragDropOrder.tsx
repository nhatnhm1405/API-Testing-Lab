import { useEffect, useState } from "react";
import { motion, Reorder } from "motion/react";
import { playSound } from "../lib/sound";
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

  return (
    <div>
      <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:600,color:'#6B6A7B',marginBottom:20 }}>
        {instruction}
      </p>
      <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',color:'#A7A3AD',marginBottom:16 }}>
        Drag the cards into the correct sequence.
      </p>

      <Reorder.Group
        axis="y"
        values={order}
        onReorder={next => { playSound('select'); setOrder(next); }}
        style={{ listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:8 }}
      >
        {order.map((item, i) => (
          <OrderCard
            key={item.id}
            item={item}
            index={i}
            correctness={correctness[i] ?? null}
            isAnswering={isAnswering}
            checked={checked}
          />
        ))}
      </Reorder.Group>

      {!checked && isAnswering && (
        <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'12px',color:'#A7A3AD',marginTop:16,textAlign:'center' }}>
          Tip: drag cards up or down to reorder them.
        </p>
      )}
    </div>
  );
}

function OrderCard({ item, index, correctness, isAnswering, checked }: {
  item: OrderItem;
  index: number;
  correctness: boolean | null;
  isAnswering: boolean;
  checked: boolean;
}) {
  const isCorrect = correctness === true;
  const isWrong   = correctness === false;

  return (
    <Reorder.Item
      value={item}
      dragListener={isAnswering}
      whileDrag={{ scale:1.03, boxShadow:'0 12px 28px rgba(28,27,42,.18)', zIndex:5 }}
      style={{
        listStyle:'none',
        display:'flex',alignItems:'center',gap:12,
        padding:'14px 16px',borderRadius:14,
        background: isCorrect ? '#ECFDF3' : isWrong ? '#FFF1F2' : '#FFF',
        border: `1.5px solid ${isCorrect ? '#BBF7D0' : isWrong ? '#FECDD3' : '#ECE8E1'}`,
        boxShadow: '0 1px 3px rgba(28,27,42,.06)',
        cursor: isAnswering ? 'grab' : 'default',
        userSelect:'none',
      }}
    >
      {/* Inner wrapper carries the wrong-answer shake so it never fights the drag transform */}
      <motion.div
        animate={isWrong ? { x:[0,-8,8,-5,5,0] } : {}}
        transition={{ duration:.4 }}
        style={{ display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0 }}
      >
        {isAnswering && <GripVertical size={16} color="#A7A3AD" style={{ flexShrink:0 }}/>}

        {/* Current position number */}
        <div style={{
          width:28,height:28,borderRadius:'50%',flexShrink:0,
          background: isCorrect ? '#22C55E' : isWrong ? '#F43F5E' : '#F2EFEA',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontFamily:'var(--atl-font-body)',fontSize:'12px',fontWeight:800,
          color: isCorrect ? 'white' : isWrong ? 'white' : '#6B6A7B',
        }}>
          {index + 1}
        </div>

        <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'15px',fontWeight:600,color:'#1C1B2A',flex:1 }}>
          {item.text}
        </span>

        {/* Correct-position hint — revealed only after checking, never while answering */}
        {checked && item.badge && (
          <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,color: isCorrect ? '#15803D' : '#BE123C',letterSpacing:'.04em',flexShrink:0 }}>
            {item.badge}
          </span>
        )}
      </motion.div>
    </Reorder.Item>
  );
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
