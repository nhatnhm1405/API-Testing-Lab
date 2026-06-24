import { CSSProperties, useEffect, useState } from "react";

// ── Tiny pixel-art engine ──────────────────────────────────────────
// A sprite is a flat list of rectangles on an integer grid. Authoring
// with rects (instead of per-pixel chars) keeps the data compact and
// impossible to mis-count, while still rendering as crisp pixel art.
// [x, y, w, h, color]
export type Rect = [number, number, number, number, string];

export function PixelArt({ rects, unit, w, h, flip, style }: {
  rects: Rect[]; unit: number; w: number; h: number; flip?: boolean; style?: CSSProperties;
}) {
  return (
    <div style={{ position: 'relative', width: w * unit, height: h * unit, transform: flip ? 'scaleX(-1)' : undefined, transformOrigin: 'center', ...style }}>
      {rects.map((r, i) => (
        <div key={i} style={{ position: 'absolute', left: r[0] * unit, top: r[1] * unit, width: r[2] * unit, height: r[3] * unit, background: r[4] }} />
      ))}
    </div>
  );
}

// Advance through `frames` at `fps` while `playing`; rest on frame 0.
export function useCycle(frames: number, fps: number, playing: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!playing) { setI(0); return; }
    const id = setInterval(() => setI(p => (p + 1) % frames), 1000 / fps);
    return () => clearInterval(id);
  }, [frames, fps, playing]);
  return playing ? i : 0;
}
