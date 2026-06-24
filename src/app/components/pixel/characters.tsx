import { CSSProperties } from "react";
import { motion } from "motion/react";
import { PixelArt, Rect, useCycle } from "./PixelArt";

// ── shared palette ─────────────────────────────────────────────────
const C = {
  skin: '#f3c6a0', skin2: '#e0a87f',
  hairBrn: '#4b3621', hairBlk: '#2a2320',
  white: '#fdfdfd', white2: '#ddd8cd',
  vest: '#2f3142', tie: '#d8313b',
  pants: '#3b4a66', shoe: '#211f2e',
  apron: '#efe7d6',
  cShirt: '#2f74d0', cShirt2: '#205aa8', cPants: '#46415e',
  must: '#6b4a2b', spoon: '#8a5a2b',
  eye: '#1d1b29',
  broth: '#f0b53d', noodle: '#f6e3b0', meat: '#b5532f', herb: '#3fae5a',
  bowl: '#ffffff', bowlRim: '#cfc7b8',
  paper: '#fbf7ea', ink: '#9a8f7a',
};

const GRID = 16; // characters are authored on a 16×16 grid

// ── Waiter ─────────────────────────────────────────────────────────
function waiterRects(step: number): Rect[] {
  const legs: Rect[] = step === 0
    ? [[6, 12, 2, 3, C.pants], [8, 12, 2, 3, C.pants], [6, 15, 2, 1, C.shoe], [8, 15, 2, 1, C.shoe]]
    : [[5, 12, 2, 3, C.pants], [9, 12, 2, 3, C.pants], [5, 15, 2, 1, C.shoe], [9, 15, 2, 1, C.shoe]];
  return [
    // hair
    [4, 1, 8, 2, C.hairBrn], [4, 3, 1, 2, C.hairBrn], [11, 3, 1, 2, C.hairBrn], [5, 3, 6, 1, C.hairBrn],
    // head
    [5, 4, 6, 4, C.skin],
    [7, 5, 1, 1, C.eye], [9, 5, 1, 1, C.eye],
    [7, 7, 2, 1, C.skin2],
    // neck
    [7, 8, 2, 1, C.skin],
    // shirt + vest + bowtie
    [5, 8, 6, 3, C.white],
    [5, 8, 1, 3, C.vest], [10, 8, 1, 3, C.vest],
    [7, 8, 2, 1, C.tie],
    [5, 11, 6, 1, C.vest],
    // arms
    [4, 8, 1, 3, C.white], [11, 8, 1, 3, C.white],
    [4, 11, 1, 1, C.skin], [11, 11, 1, 1, C.skin],
    ...legs,
  ];
}

export function Waiter({ scale = 4, flip, moving, style }: { scale?: number; flip?: boolean; moving?: boolean; style?: CSSProperties }) {
  const step = useCycle(2, 7, !!moving);
  return <PixelArt rects={waiterRects(step)} unit={scale} w={GRID} h={GRID} flip={flip} style={style} />;
}

// ── Chef (upper body behind the counter) ───────────────────────────
function chefRects(step: number): Rect[] {
  const arm: Rect[] = step === 0
    ? [[10, 9, 2, 1, C.white], [12, 9, 1, 1, C.skin], [12, 9, 1, 3, C.spoon]]
    : [[10, 8, 2, 1, C.white], [12, 7, 1, 1, C.skin], [12, 7, 1, 3, C.spoon]];
  return [
    // hat
    [4, 0, 8, 3, C.white], [5, 3, 6, 1, C.white2],
    // head
    [5, 4, 6, 4, C.skin],
    [6, 6, 1, 1, C.eye], [9, 6, 1, 1, C.eye],
    [6, 7, 4, 1, C.must],
    // body + apron
    [5, 8, 6, 4, C.white],
    [5, 10, 6, 2, C.apron],
    // left arm
    [4, 8, 1, 3, C.white], [4, 11, 1, 1, C.skin],
    ...arm,
  ];
}

export function Chef({ scale = 4, flip, cooking, style }: { scale?: number; flip?: boolean; cooking?: boolean; style?: CSSProperties }) {
  const step = useCycle(2, 4, !!cooking);
  return <PixelArt rects={chefRects(step)} unit={scale} w={GRID} h={GRID} flip={flip} style={style} />;
}

// ── Customer ───────────────────────────────────────────────────────
export type Mood = 'idle' | 'wave' | 'happy' | 'sad';

function customerRects(step: number, mood: Mood, sit: boolean): Rect[] {
  const walkLegs: Rect[] = step === 0
    ? [[6, 12, 2, 3, C.cPants], [8, 12, 2, 3, C.cPants], [6, 15, 2, 1, C.shoe], [8, 15, 2, 1, C.shoe]]
    : [[5, 12, 2, 3, C.cPants], [9, 12, 2, 3, C.cPants], [5, 15, 2, 1, C.shoe], [9, 15, 2, 1, C.shoe]];
  // seated: thighs forward (lap), shins down at the front
  const sitLegs: Rect[] = [[5, 12, 6, 2, C.cPants], [9, 14, 2, 1, C.cPants], [8, 15, 2, 1, C.shoe]];
  const legs = sit ? sitLegs : walkLegs;

  // arms vary with mood
  let arms: Rect[];
  if (mood === 'wave') {
    arms = [[4, 8, 1, 3, C.cShirt], [4, 11, 1, 1, C.skin], [11, 6, 1, 3, C.cShirt], [11, 5, 1, 1, C.skin]];
  } else if (mood === 'happy') {
    arms = [[4, 6, 1, 3, C.cShirt], [4, 5, 1, 1, C.skin], [11, 6, 1, 3, C.cShirt], [11, 5, 1, 1, C.skin]];
  } else {
    arms = [[4, 8, 1, 3, C.cShirt], [11, 8, 1, 3, C.cShirt], [4, 11, 1, 1, C.skin], [11, 11, 1, 1, C.skin]];
  }

  const eyes: Rect[] = mood === 'sad'
    ? [[7, 6, 1, 1, C.eye], [9, 6, 1, 1, C.eye]]
    : [[7, 5, 1, 1, C.eye], [9, 5, 1, 1, C.eye]];

  return [
    [4, 1, 8, 2, C.hairBlk], [4, 3, 1, 2, C.hairBlk], [11, 3, 1, 2, C.hairBlk], [5, 3, 6, 1, C.hairBlk],
    [5, 4, 6, 4, C.skin],
    ...eyes,
    mood === 'sad' ? [6, 7, 4, 1, C.skin2] : [7, 7, 2, 1, C.skin2],
    [7, 8, 2, 1, C.skin],
    [5, 8, 6, 3, C.cShirt], [5, 10, 6, 1, C.cShirt2],
    ...arms,
    ...legs,
  ];
}

export function Customer({ scale = 4, flip, mood = 'idle', moving, sit, style }: {
  scale?: number; flip?: boolean; mood?: Mood; moving?: boolean; sit?: boolean; style?: CSSProperties;
}) {
  const step = useCycle(2, 7, !!moving);
  return <PixelArt rects={customerRects(step, mood, !!sit)} unit={scale} w={GRID} h={GRID} flip={flip} style={style} />;
}

// ── Items ──────────────────────────────────────────────────────────
export function Bowl({ scale = 3, steam, style }: { scale?: number; steam?: boolean; style?: CSSProperties }) {
  const rects: Rect[] = [
    [0, 4, 12, 1, C.bowlRim],
    [1, 5, 10, 3, C.bowl],
    [2, 5, 8, 2, C.broth],
    [3, 5, 5, 1, C.noodle],
    [8, 5, 1, 1, C.meat],
    [4, 5, 1, 1, C.herb],
    [1, 8, 10, 1, C.bowlRim],
  ];
  return (
    <div style={{ position: 'relative', ...style }}>
      {steam && <SteamPuffs scale={scale} />}
      <PixelArt rects={rects} unit={scale} w={12} h={9} />
    </div>
  );
}

export function Ticket({ scale = 3, style }: { scale?: number; style?: CSSProperties }) {
  const rects: Rect[] = [
    [0, 0, 8, 10, C.paper],
    [1, 2, 6, 1, C.ink], [1, 4, 6, 1, C.ink], [1, 6, 4, 1, C.ink], [1, 8, 5, 1, C.ink],
  ];
  return <PixelArt rects={rects} unit={scale} w={8} h={10} style={style} />;
}

// ── Furniture & decor ──────────────────────────────────────────────
const W = {
  wood: '#b9844f', woodDk: '#8a5e30', woodDr: '#6b4a25',
  cloth: '#d8313b', metal: '#cfc7b8',
  leaf: '#3fae5a', leafDk: '#369a4e', pot: '#c4622e', potDk: '#a8521f',
  glass: '#bfe0e8', frame: '#caa15f', sky: '#9fc7e0',
  lantern: '#d8313b', lanternDk: '#a8231f', gold: '#e8c24a',
};

export function TableProp({ scale = 3, style }: { scale?: number; style?: CSSProperties }) {
  const rects: Rect[] = [
    [3, 0, 2, 2, W.metal],            // napkin holder
    [11, 0, 1, 2, W.cloth],           // sauce bottle
    [1, 2, 14, 2, W.wood],            // tabletop
    [1, 4, 14, 1, W.woodDk],          // edge
    [7, 5, 2, 5, W.woodDk],           // pedestal
    [5, 10, 6, 2, W.woodDr],          // base
  ];
  return <PixelArt rects={rects} unit={scale} w={16} h={12} style={style} />;
}

export function Chair({ scale = 3, flip, style }: { scale?: number; flip?: boolean; style?: CSSProperties }) {
  const rects: Rect[] = [
    [0, 0, 2, 8, W.woodDk],   // back
    [0, 8, 6, 2, W.wood],     // seat
    [4, 10, 1, 2, W.woodDr],  // leg
    [1, 10, 1, 2, W.woodDr],  // leg
  ];
  return <PixelArt rects={rects} unit={scale} w={6} h={12} flip={flip} style={style} />;
}

export function Plant({ scale = 3, style }: { scale?: number; style?: CSSProperties }) {
  const rects: Rect[] = [
    [3, 0, 6, 2, W.leafDk],
    [1, 1, 10, 4, W.leaf],
    [0, 3, 3, 3, W.leafDk], [9, 3, 3, 3, W.leafDk],
    [4, 1, 1, 3, W.leafDk],
    [3, 6, 6, 4, W.pot],
    [2, 5, 8, 1, W.potDk],
  ];
  return <PixelArt rects={rects} unit={scale} w={12} h={10} style={style} />;
}

export function DoorProp({ scale = 3, style }: { scale?: number; style?: CSSProperties }) {
  const rects: Rect[] = [
    [0, 0, 12, 18, W.woodDk],   // frame
    [2, 2, 8, 16, W.woodDr],    // door
    [5, 2, 1, 16, W.woodDk],    // split
    [3, 9, 1, 1, W.gold], [8, 9, 1, 1, W.gold], // handles
    [2, 2, 8, 1, W.gold],       // lintel accent
  ];
  return <PixelArt rects={rects} unit={scale} w={12} h={18} style={style} />;
}

export function WindowProp({ scale = 3, style }: { scale?: number; style?: CSSProperties }) {
  const rects: Rect[] = [
    [0, 0, 16, 12, W.frame],
    [2, 2, 12, 8, W.glass],
    [2, 2, 5, 4, W.sky], [9, 2, 5, 4, W.sky],
    [2, 7, 5, 2, W.sky], [9, 7, 5, 2, W.sky],
    [7, 2, 2, 8, W.frame], [2, 5, 12, 1, W.frame],
  ];
  return <PixelArt rects={rects} unit={scale} w={16} h={12} style={style} />;
}

export function Picture({ scale = 3, style }: { scale?: number; style?: CSSProperties }) {
  const rects: Rect[] = [
    [0, 0, 10, 8, W.frame],
    [1, 1, 8, 6, W.sky],
    [3, 4, 4, 2, C.broth], [3, 3, 4, 1, C.bowlRim], // a little bowl picture
    [4, 5, 2, 1, C.noodle],
  ];
  return <PixelArt rects={rects} unit={scale} w={10} h={8} style={style} />;
}

export function Lantern({ scale = 3, style }: { scale?: number; style?: CSSProperties }) {
  const rects: Rect[] = [
    [1, 0, 2, 1, W.gold],
    [0, 1, 4, 4, W.lantern],
    [0, 2, 4, 1, W.lanternDk],
    [1, 5, 2, 1, W.gold],
  ];
  return <PixelArt rects={rects} unit={scale} w={4} h={6} style={style} />;
}

// rising steam — three puffs drifting up on a loop
export function SteamPuffs({ scale = 3 }: { scale?: number }) {
  return (
    <div style={{ position: 'absolute', left: '50%', bottom: '100%', transform: 'translateX(-50%)', width: scale * 8, height: scale * 8, pointerEvents: 'none' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 6, x: 0 }}
          animate={{ opacity: [0, .7, 0], y: [-2, -scale * 7], x: [0, i === 1 ? scale : -scale, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45, ease: 'easeOut' }}
          style={{ position: 'absolute', left: `${20 + i * 28}%`, bottom: 0, width: scale * 1.5, height: scale * 1.5, borderRadius: '50%', background: 'rgba(255,255,255,.85)' }}
        />
      ))}
    </div>
  );
}
