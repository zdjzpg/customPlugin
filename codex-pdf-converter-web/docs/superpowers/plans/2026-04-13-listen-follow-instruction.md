# Listen Follow Instruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a formal `听音做指令（点击型）` question type to the paper configuration flow and student exam flow, using a demo body image with rectangle hotspot authoring.

**Architecture:** Introduce a shared hotspot utility for rectangle normalization and hit testing, extend question serialization to support the new type, embed a dedicated editor in the teacher configuration page, and render a responsive student question component that reuses stored hotspot data.

**Tech Stack:** Vue 3, Vue Router, existing Express + mysql2 API, Node built-in test runner for shared utility behavior.

---

### Task 1: Shared hotspot helpers

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\tests\followInstruction.test.cjs`
- Create: `D:\aa-workplace\EnglishQuestion\src\shared\followInstruction.js`

- [ ] Write a failing test for rectangle normalization and hit testing.
- [ ] Run `node --test tests/followInstruction.test.cjs` and confirm failure.
- [ ] Implement shared helpers for normalized rectangle storage and hit testing.
- [ ] Re-run `node --test tests/followInstruction.test.cjs` and confirm pass.

### Task 2: Persist the new question type

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\src\utils\content.js`
- Modify: `D:\aa-workplace\EnglishQuestion\server\paperRepository.js`
- Modify: `D:\aa-workplace\EnglishQuestion\src\store\examStore.js`

- [ ] Add type metadata, default question payload, and normalization for `listen_follow_instruction`.
- [ ] Save/load `instructionText`, `imageUrl`, `targets`, `correctTargetId`, and `autoPlay` in `content_json`.
- [ ] Add report scoring support for teacher records and student submissions.

### Task 3: Teacher-side hotspot authoring UI

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\src\components\editors\FollowInstructionEditor.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\views\NewPaperView.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\styles.css`

- [ ] Render the demo image in the formal paper editor.
- [ ] Let teachers drag to create rectangle hotspots.
- [ ] Keep a region list for rename/delete/set-correct actions.
- [ ] Bind the editor to the saved question data.

### Task 4: Student question experience

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\src\components\questions\ListenFollowInstruction.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\views\PaperView.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\styles.css`

- [ ] Render the instruction card with the saved image and playback button.
- [ ] Make hotspots responsive using percentage-based positioning.
- [ ] Show answer state and support replaying the spoken instruction.

### Task 5: Demo asset and verification

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\src\assets\follow-instruction-boy.png`
- Modify: `D:\aa-workplace\EnglishQuestion\package.json`

- [ ] Add the provided body-image asset into the app bundle.
- [ ] Add a reusable verification command for the shared utility test.
- [ ] Run the utility test and `npm run build` to verify the end-to-end integration.
