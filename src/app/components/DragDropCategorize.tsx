import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GripVertical, CheckCircle2, XCircle } from "lucide-react";

interface Card { id: string; text: string; correctBucket: string }

interface DragDropCategorizeProps {
  instruction: string;
  buckets: string[];
  cards: Card[];
  checkTrigger: number;
  onReadyChange: (ready: boolean) => void;
  onResult: (correct: boolean) => void;
  phase: 'answering' | 'correct' | 'wrong';
}

const BUCKET_STYLES: Record<string, { header: string; bg: string; border: string; text: string }> = {
  GET:    { header:'#1D4ED8', bg:'#EEF2FF', border:'#BFDBFE', text:'white' },
  POST:   { header:'#065F46', bg:'#ECFDF5', border:'#A7F3D0', text:'white' },
  PUT:    { header:'#92400E', bg:'#FFFBEB', border:'#FDE68A', text:'white' },
  DELETE: { header:'#991B1B', bg:'#FEF2F2', border:'#FECACA', text:'white' },
  PASS:   { header:'#065F46', bg:'#ECFDF5', border:'#A7F3D0', text:'white' },
  FAIL:   { header:'#9F1239', bg:'#FFF1F2', border:'#FECDD3', text:'white' },
};
const DEFAULT_BUCKET = { header:'#4B5563', bg:'#F9FAFB', border:'#E5E7EB', text:'white' };

function getBucket(name: string) { return BUCKET_STYLES[name] ?? DEFAULT_BUCKET; }

export function DragDropCategorizeExercise({
  instruction, buckets, cards,
  checkTrigger, onReadyChange, onResult, phase,
}: DragDropCategorizeProps) {
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    () => Object.fromEntries(cards.map(c => [c.id, null]))
  );
  const [selected,    setSelected]    = useState<string | null>(null);
  const [dragging,    setDragging]    = useState<string | null>(null);
  const [correctness, setCorrectness] = useState<Record<string, boolean | null>>({});

  const isAnswering = phase === 'answering' && checkTrigger === 0;

  useEffect(() => {
    onReadyChange(Object.values(assignments).every(v => v !== null));
  }, [assignments]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checkTrigger === 0) return;
    const results: Record<string, boolean> = {};
    cards.forEach(c => { results[c.id] = assignments[c.id] === c.correctBucket; });
    setCorrectness(results);
    onResult(Object.values(results).every(Boolean));
  }, [checkTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const assign = (cardId: string, bucket: string) => {
    setAssignments(prev => ({ ...prev, [cardId]: bucket }));
    setSelected(null);
  };

  const unassign = (cardId: string) => {
    if (!isAnswering) return;
    setAssignments(prev => ({ ...prev, [cardId]: null }));
    setCorrectness(prev => ({ ...prev, [cardId]: null }));
  };

  const handleCardClick = (cardId: string) => {
    if (!isAnswering) return;
    setSelected(prev => prev === cardId ? null : cardId);
  };

  const handleBucketClick = (bucket: string) => {
    if (!isAnswering || !selected) return;
    assign(selected, bucket);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('cardId', cardId);
    setDragging(cardId);
  };

  const handleDrop = (e: React.DragEvent, bucket: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) assign(cardId, bucket);
    setDragging(null);
  };

  const poolCards = cards.filter(c => assignments[c.id] === null);
  const bucketCards = (b: string) => cards.filter(c => assignments[c.id] === b);

  return (
    <div>
      <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'14px',fontWeight:600,color:'#6B6A7B',marginBottom:20 }}>
        {instruction}
      </p>

      {/* Pool */}
      {poolCards.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <p style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#A7A3AD',marginBottom:10 }}>
            Cards to sort
          </p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
            {poolCards.map(card => (
              <DraggableCard
                key={card.id}
                card={card}
                selected={selected === card.id}
                dragging={dragging === card.id}
                correct={null}
                onClick={() => handleCardClick(card.id)}
                onDragStart={(e) => isAnswering && handleDragStart(e, card.id)}
                onDragEnd={() => setDragging(null)}
                isAnswering={isAnswering}
              />
            ))}
          </div>
        </div>
      )}

      {/* Buckets */}
      <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min(buckets.length,4)},1fr)`,gap:10 }}>
        {buckets.map(bucket => {
          const bStyle = getBucket(bucket);
          return (
            <div
              key={bucket}
              onClick={() => handleBucketClick(bucket)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => isAnswering && handleDrop(e, bucket)}
              style={{
                borderRadius:16,overflow:'hidden',
                border:`2px solid ${selected ? '#2E5BFF' : bStyle.border}`,
                cursor: selected && isAnswering ? 'pointer' : 'default',
                transition:'border-color .15s,box-shadow .15s',
                boxShadow: selected && isAnswering ? '0 0 0 3px rgba(46,91,255,.15)' : 'none',
              }}
            >
              {/* Bucket header */}
              <div style={{ background:bStyle.header,padding:'8px 12px',display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'13px',fontWeight:800,color:bStyle.text,letterSpacing:'.02em' }}>
                  {bucket}
                </span>
                <span style={{ fontFamily:'var(--atl-font-body)',fontSize:'11px',color:`${bStyle.text}90`,marginLeft:'auto' }}>
                  {bucketCards(bucket).length}
                </span>
              </div>

              {/* Bucket content */}
              <div style={{ background:bStyle.bg,minHeight:80,padding:8,display:'flex',flexDirection:'column',gap:6 }}>
                <AnimatePresence>
                  {bucketCards(bucket).map(card => (
                    <motion.div key={card.id} initial={{ opacity:0,scale:.9 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:.9 }} transition={{ duration:.2 }}>
                      <DraggableCard
                        card={card}
                        selected={false}
                        dragging={dragging === card.id}
                        correct={correctness[card.id] ?? null}
                        onClick={() => unassign(card.id)}
                        onDragStart={(e) => isAnswering && handleDragStart(e, card.id)}
                        onDragEnd={() => setDragging(null)}
                        isAnswering={isAnswering}
                        compact
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {bucketCards(bucket).length === 0 && (
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:48,border:`2px dashed ${bStyle.border}`,borderRadius:10,color:bStyle.header,fontSize:'12px',fontFamily:'var(--atl-font-body)',fontWeight:600,opacity:.6 }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DraggableCard({ card, selected, dragging, correct, onClick, onDragStart, onDragEnd, isAnswering, compact }: {
  card: Card;
  selected: boolean;
  dragging: boolean;
  correct: boolean | null;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isAnswering: boolean;
  compact?: boolean;
}) {
  const isCorrect = correct === true;
  const isWrong   = correct === false;

  return (
    <motion.div
      animate={isWrong ? { x:[0,-6,6,-4,4,0], transition:{ duration:.4 } } : {}}
      draggable={isAnswering}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        display:'flex',alignItems:'center',gap:8,
        padding: compact ? '7px 10px' : '10px 12px',
        background: isCorrect ? '#ECFDF3' : isWrong ? '#FFF1F2' : selected ? '#EEF2FF' : '#FFF',
        border: `1.5px solid ${isCorrect ? '#BBF7D0' : isWrong ? '#FECDD3' : selected ? '#2E5BFF' : '#ECE8E1'}`,
        borderRadius:10,
        cursor: isAnswering ? 'grab' : 'default',
        boxShadow: selected ? '0 0 0 2px rgba(46,91,255,.2)' : '0 1px 3px rgba(28,27,42,.06)',
        opacity: dragging ? 0.5 : 1,
        userSelect:'none',
        transition:'background .15s,border-color .15s',
      }}
    >
      {isAnswering && <GripVertical size={12} color="#A7A3AD" style={{ flexShrink:0 }}/>}
      {isCorrect && <CheckCircle2 size={13} color="#22C55E" style={{ flexShrink:0 }}/>}
      {isWrong   && <XCircle size={13} color="#F43F5E" style={{ flexShrink:0 }}/>}
      <span style={{ fontFamily:'var(--atl-font-body)',fontSize: compact ? '12px' : '13px',fontWeight:600,color:'#1C1B2A',lineHeight:1.3 }}>
        {card.text}
      </span>
    </motion.div>
  );
}
