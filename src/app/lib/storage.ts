// ── Progress persistence ───────────────────────────────────────────────────────
// Saves the learner's XP, completed lessons and noted mistakes to localStorage so
// progress survives a page refresh (previously everything was in-memory only).

import { USER_XP } from "../data/courseData";

const KEY = 'atl.progress.v1';

export interface Progress {
  xp: number;
  completedLessons: Set<string>;
  mistakes: Set<string>;
}

export function loadProgress(): Progress {
  const fallback: Progress = { xp: USER_XP, completedLessons: new Set(), mistakes: new Set() };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const o = JSON.parse(raw) as Partial<{ xp: number; completedLessons: string[]; mistakes: string[] }>;
    return {
      xp: typeof o.xp === 'number' ? o.xp : USER_XP,
      completedLessons: new Set(Array.isArray(o.completedLessons) ? o.completedLessons : []),
      mistakes: new Set(Array.isArray(o.mistakes) ? o.mistakes : []),
    };
  } catch {
    return fallback;
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      xp: p.xp,
      completedLessons: [...p.completedLessons],
      mistakes: [...p.mistakes],
    }));
  } catch {
    /* ignore quota / unavailable storage */
  }
}
