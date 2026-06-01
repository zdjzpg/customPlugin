# Audio Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a child-friendly “小熊老师陪伴” audio feedback system for read-aloud recording and listening playback states.

**Architecture:** Introduce a small shared state helper for buddy-state resolution, store per-question playback/recording flags in the exam store, and render a reusable `AudioBuddy` visual block across read-aloud and listening question components.

**Tech Stack:** Vue 3, existing exam store, CSS animations, Node test runner.

---

### Task 1: Shared buddy-state helper

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\tests\audioFeedback.test.cjs`
- Create: `D:\aa-workplace\EnglishQuestion\src\shared\audioFeedback.js`

- [ ] Write failing tests for read-aloud and listening buddy-state resolution.
- [ ] Run `node --test tests/audioFeedback.test.cjs` and confirm failure.
- [ ] Implement the minimal helper.
- [ ] Re-run the tests and confirm pass.

### Task 2: Store-driven audio state

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\src\store\examStore.js`

- [ ] Track per-question `listening`, `recording`, and `scored` visual states.
- [ ] Set states during speech synthesis, mock scoring, and browser recognition.
- [ ] Expose helpers for components to query the active state.

### Task 3: Reusable bear companion UI

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\src\components\shared\AudioBuddy.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\styles.css`

- [ ] Build the bear companion with listening/recording/scored visual variants.
- [ ] Add gentle CSS animations for ears, waves, glow, and confirmation.

### Task 4: Integrate read-aloud and listening questions

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\src\components\questions\ReadAloud.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\components\questions\ListenChooseImage.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\components\questions\ListenFollowInstruction.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\views\PaperView.vue`

- [ ] Replace the abstract read-aloud center with the new bear companion.
- [ ] Add listening-state feedback blocks to the listening question types.
- [ ] Pass enriched `speak` payloads so the store knows which question is playing.

### Task 5: Verification

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\package.json`

- [ ] Add a dedicated test command for audio feedback helpers.
- [ ] Run helper tests and production build.
