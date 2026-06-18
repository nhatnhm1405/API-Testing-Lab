# AI Log — API Testing Lab

**Date:** 2026-06-18
**Project:** API Testing Lab (React 18 + TypeScript + Vite 6 + Tailwind v4 + Motion)
**Assistant:** Claude Code (Opus 4.8)

A chronological log of everything done in this session: the user's requests, the
approach taken, and the concrete code changes. Each task ends with a verification
note (`npm run build` was run after every change — all passed).

---

## 0. Context gathering

Read the codebase to understand structure before any work:

- `src/app/App.tsx` — root, view state machine (`home → path → lesson → result → skill-check → diagrams`), `useState`-based (no real backend/router).
- `src/app/data/courseData.ts` — 4 static modules, 5 exercise types (`mcq`, `fill-blank`, `drag-categorize`, `drag-order`, `postman`).
- Components: `HomeDashboard`, `LearningPath`, `LessonScreen`, `ResultScreen`, `SkillCheckScreen`, `ConceptDiagrams`, `MiniPostman`, `OptionCard`, `TactileButton`, etc.
- Design system in `src/styles/theme.css`: `--atl-*` tokens, Bricolage Grotesque (display) + Plus Jakarta Sans (body), tactile buttons, warm-paper canvas. Components mostly use inline `style={{}}`.

---

## 1. Two home / completion refinements

### 1a. Per-module completion notification (bug fix)
**Problem:** the result/celebration screen only appeared after the *entire course*
was finished, not after each module.

**Root cause:** `App.tsx` `handleLessonComplete` used `getCurrentModule(newCompleted)`
which returns the *first incomplete* module — so after finishing module 1's last
lesson it already pointed at module 2 (not done) → `modDone = false`.

**Fix (`App.tsx`):**
- Detect the module that the just-finished lesson belongs to, and celebrate only on
  the transition incomplete → complete (`!wasComplete && nowComplete`).
- Added `resultModuleIdx` state; passed `moduleNumber`, `moduleTitle`, `isLastModule`,
  and correct score/XP to `ResultScreen`.

**`ResultScreen.tsx`:** replaced hard-coded "Module 1 · API là gì?" with dynamic
module title/number; last module shows "Course complete 🏆"; fixed misleading
"Làm lại" → "Home" (Home icon); last module CTA → "View learning path".

### 1b. "All Modules" selector updates the RECOMMENDED card
**Problem:** clicking a module chip navigated to `path` (duplicating "View learning path")
instead of changing the featured card.

**Fix (`HomeDashboard.tsx`):**
- Added `selectedIdx` state; `activeIdx = selectedIdx ?? currentIdx`. The RECOMMENDED
  card now previews the selected module.
- Chip click → `setSelectedIdx(mi)` (only unlocked modules), with a selected highlight
  + completed-module ✓ icon.
- Dynamic badge: **Recommended** (current) ↔ **Completed** (done).
- Start button: completed → "Review in learning path"; in-progress → "Continue/Start".
- Kept the left "Modules x/4" stat tied to real progress (`currentIdx`), not the preview.

---

## 2. Translate everything to English

Searched for Vietnamese diacritics across `src` and translated all remaining strings
in: `WhyModal`, `HomeDashboard`, `ResultScreen`, `SkillCheckScreen`, `ConceptDiagrams`.
Confirmed zero Vietnamese characters left.

---

## 3. SkillCheckScreen — dynamic per module

Mirrored `ResultScreen`'s prop-driven approach. `App.tsx` passes `moduleNumber`,
`moduleTitle`, `accent`, `topics` (the module's lesson titles), `isLastModule`.
`SkillCheckScreen.tsx` now tints glow/ring/circle with the module accent, renders
topic chips from lessons, and shows a context-appropriate CTA (continue to next module
vs. view learning path).

---

## 4. "Concept Diagrams" → interactive phở illustration

Built `PhoApiFlow.tsx` — an interactive analogy: **Customer = Client, Waiter = API,
Chef = Server**. Initially a **drag-and-drop** ordering puzzle (native HTML5 drag,
matching the project's existing pattern) with pool + ordered slots, plus a 3-station
animated payoff. Placed it as the hero of the Concept Diagrams screen, with the two
existing technical diagrams kept below.

---

## 5. Looping animation + conversation

- Rewrote the `Scene` into a **self-looping timeline state machine** (`setTimeout`
  recursion, `frame % TIMELINE.length`) — runs continuously after solving.
- Added **speech bubbles** per station (who's "speaking"), active-station pulse, a
  smoothly gliding 📝→🍜 token (request → response).
- Added a **~1.6s pause** frame between loops to separate cycles.
- Removed the "Run again" button (no longer needed since it loops).

---

## 6. Fix: speech bubble offset to the right

**Cause:** the bubble/token were `motion.div`s animating `scale`/`y`; Motion writes
its own `transform`, overriding the inline `transform: translateX(-50%)` → lost
centering. **Fix:** moved centering into Motion props via `x: '-50%'` and removed the
inline transform. Bubble and token now sit centered over the station.

---

## 7. "How API works?" cinematic flow

Renamed the screen and turned `ConceptDiagrams` into a staged experience:

`intro (big fading text "You walk into a phở restaurant…") → interactive → transition
(big fading text "Now, let's dive into the real API") → technical layout`

- New `Cinematic` component: emoji + headline + subtitle fade in/hold/out (keyframe
  `opacity [0→1→1→0]`), auto-advances after ~3.8s, **tap-to-skip**.
- `PhoApiFlow` gained an `onContinue` prop ("Continue →" in its success banner) to
  advance the parent stage.

---

## 8. Phở interactive → conversation + MCQ

Per request, replaced drag-drop with a **conversation-driven quiz** (felt less boring):

- 5 chat beats; each shows a spoken phở line, then a **2-option** "what's happening?"
  question. Reuses `OptionCard` for visual consistency.
- Wrong → shake + "try the other answer"; correct → reveals the API mapping on the
  bubble + "Next →".
- After 5 correct → the looping animation plays. Progress dots + "Step X of 5".
- Removed the old drag/slot logic.

---

## 9. Minimal card + bubble pop animation

- Stripped the card to **just conversation + Q&A** (removed the "INTERACTIVE" pill,
  heading, and description).
- Reworked the `Bubble` entrance: avatar springs in first, then the bubble **grows
  out of the avatar** (`transformOrigin: 'left center'`, scale 0.3 → 1) for liveliness.

---

## 10. Home discovery — featured hero banner

**Problem:** the entry point was a small, low-visibility card with outdated copy, so
users might never discover the best part of the app.

**Solution (`HomeDashboard.tsx`):** a **full-width animated hero banner at the very top**
of the dashboard:
- Warm→cool gradient, floating `🔌 📦 ⚡` emojis, a bobbing 🍜 medallion, glow blob.
- Badge "✨ START HERE · INTERACTIVE", headline "How does an API actually work?",
  subtitle framing it as a 2-minute interactive phở story, and an "Explore →" CTA.
- Removed the old small card; adjusted grid padding.

---

## 11. Phở answers → everyday food language

Rewrote all 5 questions/options to plain food-ordering language (no jargon), keeping
the technical term only in the post-answer reveal. Example: "Placing an order with the
staff" vs "Bringing food out to a table". Distractors became plausible-but-wrong
everyday actions.

---

## 12. "Dive into API" → parallel API story

Extracted a shared conversation engine and added a second story in HTTP terms:

- **`StoryFlow.tsx`** — generic engine (transcript bubbles with pop animation,
  progress, Q&A, reveal, final scene, banner). Props: `beats`, `finalScene`,
  `doneNote`, `doneSummary`, `revealPrefix`, `onContinue`.
- **`PhoApiFlow.tsx`** — now a thin wrapper: phở beats + 3-station phở `Scene`.
- **`ApiStoryFlow.tsx`** — new: Client 💻 ↔ Server 🖥️ beats (request line, headers,
  processing, 200 OK, JSON body) with a **2-station client/server** looping animation
  (📨 request → 📦 response, monospace HTTP bubbles). `revealPrefix="Key takeaway:"`.
- Flow updated: `… → transition → API story → recap (technical diagrams)`.

---

## 13. API Testing Lab — Postman-style console

**`ApiTestingLab.tsx`** — "Welcome to API Testing Lab 🚀", a mini console to test all
four methods:

- 4 method tabs (GET/POST/PUT/DELETE) in Postman colors; tested tabs get a ✓; a
  "Tested X/4" badge encourages trying all.
- Request shown in the **anatomy style** the user liked (Request line / Headers /
  Body JSON with syntax highlighting), dynamic per method.
- Tactile **Send** button (method-colored) → spinner → **Response** panel with a
  status pill colored by family (200/201 green, etc.), timing, JSON body.
- Simulated CRUD on `/api/users`: GET 200 (list), POST 201 (created), PUT 200
  (updated), DELETE 204 No Content (with explanatory note).

**Flow finalized (7 stages):**
`intro (phở) → phở story → transition → API story → 🚀 Welcome cinematic → 🧪 Lab → recap`
The Lab has "📋 Request anatomy reference" (→ recap) and "↻ Restart story"; recap has
"← Back to the Lab" so the original diagrams stay in use.

---

## 14. Tooling

- Added **`.gitignore`** for a Vite/Node/Windows project (`node_modules/`, `dist/`,
  `.vite/`, `*.tsbuildinfo`, `.env*` with `.env.example` kept, IDE/OS files).
- Note: the directory is not yet a git repository.

---

## Files created this session
- `src/app/components/PhoApiFlow.tsx` (phở story, later refactored onto StoryFlow)
- `src/app/components/StoryFlow.tsx` (shared conversation engine)
- `src/app/components/ApiStoryFlow.tsx` (HTTP/API story)
- `src/app/components/ApiTestingLab.tsx` (Postman-style 4-method console)
- `.gitignore`
- `AI Logs/2026-06-18-session-log.md` (this file)

## Files modified this session
- `src/app/App.tsx`
- `src/app/components/HomeDashboard.tsx`
- `src/app/components/ResultScreen.tsx`
- `src/app/components/SkillCheckScreen.tsx`
- `src/app/components/ConceptDiagrams.tsx`
- `src/app/components/WhyModal.tsx`

## Verification
`npm run build` (Vite) was run after every change and succeeded each time — final
bundle built clean with no errors.
