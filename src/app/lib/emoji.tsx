import React from "react";

// Render emoji in Apple's style on every platform (Windows/Android included) by
// swapping the native glyph for an Apple-styled image from a CDN. Use <Emoji/>
// for a single glyph, or emojify() to convert any string that mixes text + emoji.
//
// Note: relies on an external image service (emojicdn) and Apple's emoji artwork —
// fine for this learning app; revisit if it ever needs to run fully offline.

const CDN = (e: string) => `https://emojicdn.elk.sh/${encodeURIComponent(e)}?style=apple`;

// Pictographic emoji, including ZWJ sequences (👨‍🍳) and flags (🇻🇳).
const EMOJI_RE = /(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*|\p{Regional_Indicator}{2})/gu;

export function Emoji({ e, size = '1em', label }: { e: string; size?: number | string; label?: string }) {
  return (
    <img
      src={CDN(e)}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      loading="lazy"
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: '-0.15em', objectFit: 'contain' }}
    />
  );
}

// Split a string into text + Apple-emoji <img> segments. Returns the original
// string untouched when it contains no emoji.
export function emojify(text: string, size: number | string = '1.1em'): React.ReactNode {
  if (!text) return text;
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(EMOJI_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    out.push(<Emoji key={key++} e={m[0]} size={size} />);
    last = idx + m[0].length;
  }
  if (out.length === 0) return text;
  if (last < text.length) out.push(text.slice(last));
  return out;
}
