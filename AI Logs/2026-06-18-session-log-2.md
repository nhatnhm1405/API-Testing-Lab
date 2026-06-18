# AI Log — API Testing Lab (Session 2)

**Date:** 2026-06-18
**Project:** API Testing Lab (React 18 + TypeScript + Vite 6 + Tailwind v4 + Motion)
**Assistant:** Claude Code (Opus 4.8)

Chronological log of the second working session of the day. Focus: porting the
interactive **API Simulator** from the `figma fix/` design exports into the live app,
a direct entry point for it, plus several UX/animation/logic fixes surfaced while
testing lessons. `npm run build` (Vite) was run after every change — all passed.

---

## 0. Context + `figma fix/` recon

Confirmed project context and explored `figma fix/` (parallel design exports). Findings:

- `figma fix/src` mirrors the live `src` but adds **`APISimulator.tsx`** (the interactive
  simulator) which the live app lacked. Its `App.tsx` already wired a `'simulator'` view.
- `figma fix/src2` is another variant: an **upgraded `APISimulator.tsx`** (5 demo modes
  vs 2) but an **older `ConceptDiagrams.tsx`** (static diagrams only, no phở/API story).
- Live `src` had the more evolved per-module flow; `ApiTestingLab.tsx` was the lab used
  at the end of the "How API works?" story (`ConceptDiagrams` stage `lab`).

---

## 1. Port APISimulator into the live app (replace the lab)

User: bring the Interactive Simulator over and replace the part **after the two stories
(phở + API)**.

- Copied `figma fix/src/app/components/APISimulator.tsx` → `src/app/components/`.
- `ConceptDiagrams.tsx`: swapped import + usage `ApiTestingLab` → `APISimulator` at the
  `lab` stage (the cinematic 🚀 "Welcome to API Testing Lab" already precedes it).
- Verified deps already present: `canvas-confetti` (used by `ResultScreen` too), `Mascot`,
  `TactileButton`, `motion/react`, `lucide-react`. Kept the evolved `ConceptDiagrams`
  (did **not** copy figma fix's `App.tsx`/`ConceptDiagrams` over the live ones).

---

## 2. Delete dead `ApiTestingLab.tsx`

Confirmed no remaining references (only the previous usage in `ConceptDiagrams`), then
removed `src/app/components/ApiTestingLab.tsx`.

---

## 3. Use the richer `src2` simulator

Checked `figma fix/src2` "and do the same". The `src2` `APISimulator` is a strict
drop-in (same `export function APISimulator({ onClose })`, same local deps) but richer:
all 5 modes (`normal | debug | post | put | delete`), request-body editing, a verify
phase (~994 lines vs ~696). Overwrote the live `APISimulator.tsx` with the `src2`
version; no other change needed since `ConceptDiagrams` already renders `<APISimulator/>`.
Deliberately kept the live `ConceptDiagrams` (the `src2` one is the older static version).

---

## 4. Direct entry to the API Testing Lab

User wanted a tile on the home page that opens the simulator directly (previously only
reachable through the whole phở/API story).

- **`App.tsx`:** added `'simulator'` to the `View` union, imported `APISimulator`, and
  rendered `<APISimulator onClose={() => navigate('home')}/>` for `view === 'simulator'`.
- **`HomeDashboard.tsx`:** new blue "API Testing Lab" card in the left column under the
  quick-stats (floating Send icon, "Interactive" badge, "Send real requests · test all 4
  methods") → `onNavigate('simulator')`.

---

## 5. Replace ugly stat emojis

The two quick-stat cards used bare emojis (📚 / 🎯) that looked off. Swapped for lucide
icons in soft rounded tiles: **Lessons done** → `GraduationCap` (blue tile),
**Modules** → `Layers` (green tile).

---

## 6. FillBlank — intuitive word-placement animation

**Problem:** clicking a word made it vanish from the bank and instantly appear in a blank
— no visual link.

**Fix (`FillBlank.tsx`):** motion **shared-layout** transition — each chip carries
`layoutId={word}`; it now **glides** from the word bank into the target blank (and back on
clear). Bank chips and blank slots use `layout`; blanks got a fixed min-height + soft fill
so the line doesn't jump. Kept the wrong-answer shake and correct/wrong coloring.

> Gotcha: the placeholder line `{value ?? '     '}` used **non-breaking spaces** (U+00A0),
> so string-edit matching failed — replaced that exact line via a Python line-edit.

---

## 7. DragDropOrder — answer leak + jittery drag

**Two bugs (`DragDropOrder.tsx`):**

1. **Answer leaked.** The right-side badges ("1st/2nd/3rd/4th") are each item's *correct*
   position (data is defined in correct order) → the answer was visible while solving.
   Now the badge is **hidden during answering** and only shown **after Check** as feedback
   (green if right place, red if not). The left circle still shows current position.
2. **Jittery native drag.** Replaced the native HTML5 drag (`draggable`/`onDragOver`/
   `onDrop` + `layout`, which fought each other) with motion **`Reorder.Group` /
   `Reorder.Item`**: only the held card follows the pointer (`whileDrag` lift), siblings
   slide naturally, dragging gated by `dragListener={isAnswering}`. Wrong-answer shake
   moved to an inner `motion.div` so it never conflicts with the drag transform.

---

## 8. Restart module + mistakes tracking

User: couldn't replay a finished module, and wrong answers weren't recorded.
(Confirmed scope via a quick question: restart on **Home + Result + Learning Path**;
mistakes as a **list + explanation**.)

**State (`App.tsx`):**
- `mistakes: Set<string>` (lesson ids answered wrong) + `noteMistake(id)`.
- `restartModule(moduleIdx)`: deletes that module's lesson ids from `completedLessons`
  (and from `mistakes`), then `setView('lesson')` — the runner restarts that module at
  lesson 1.

**Tracking (`LessonScreen.tsx`):** new `onMistake` prop; called on any wrong answer
(MCQ and exercise/postman results).

**Surfaces:**
- New **`MistakesReview.tsx`** (`view === 'review'`): lists every missed question — module
  badge, lesson title, the prompt (`getLessonPrompt`), and the "Why" explanation; has a
  celebratory empty state.
- **Home:** red "Review your mistakes (N)" card (only when N > 0) → `'review'`; the
  completed-module card gained a "Restart module" button.
- **Result:** inline list of that module's mistakes (+ explanations) and a "Replay this
  module" button.
- **Learning Path:** a small ↺ restart button on each completed module's chapter pill.

**Helpers (`courseData.ts`):** `findLesson(id)` and `getLessonPrompt(data)`.

---

## 9. Scoring fix — reflect actual correct answers

**Problem:** the Result screen always showed full score (e.g. 4/4, 100%, +full XP) even
with wrong answers — `App` passed `score = total` and XP was awarded for every lesson.

**Fix:**
- `App.tsx`: `resultScore = total − (module mistakes)`, `resultXP` = sum of XP for lessons
  **not** in `mistakes`; passed `score={resultScore}`.
- `LessonScreen.tsx`: award XP only when correct — `onLessonComplete(id, isCorrect ? xp : 0)`.

Now one wrong answer shows e.g. **3/4 · 75%** with the heading downgrading from "Perfect!"
accordingly, and global NavBar XP stays consistent.

---

## Files created this session
- `src/app/components/APISimulator.tsx` (ported, then upgraded to the `src2` version)
- `src/app/components/MistakesReview.tsx`
- `AI Logs/2026-06-18-session-log-2.md` (this file)

## Files deleted this session
- `src/app/components/ApiTestingLab.tsx`

## Files modified this session
- `src/app/App.tsx`
- `src/app/components/ConceptDiagrams.tsx`
- `src/app/components/HomeDashboard.tsx`
- `src/app/components/LessonScreen.tsx`
- `src/app/components/ResultScreen.tsx`
- `src/app/components/LearningPath.tsx`
- `src/app/components/FillBlank.tsx`
- `src/app/components/DragDropOrder.tsx`
- `src/app/data/courseData.ts`

## Verification
`npm run build` (Vite) was run after every change and succeeded each time — final bundle
~463 KB JS (gzip ~135 KB), built clean with no errors.
