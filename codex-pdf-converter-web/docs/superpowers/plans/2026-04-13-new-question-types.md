# New Question Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new teacher-configurable question types covering spoken Q&A, letter selection, image-assisted sentence reading, and image-word matching.

**Architecture:** Extend the existing fixed question-type pipeline end to end: teacher config defaults and normalization in `src/utils/content.js`, runtime scoring and answer capture in `src/store/examStore.js`, persistence in `server/paperRepository.js`, and dedicated student renderer components under `src/components/questions/`. Keep first-version image inputs string-based (`imageUrl`) and reuse current speech-recognition / mock-score flow.

**Tech Stack:** Vue 3, Vue Router, existing local store pattern, Express/MySQL repository layer, Node built-in test runner.

---

### Task 1: Model and validation
- [ ] Add failing tests for normalization / validation / persistence shape of the four new question types.
- [ ] Extend type metadata, defaults, and normalization in `src/utils/content.js`.
- [ ] Extend repository serialization in `server/paperRepository.js`.
- [ ] Verify tests pass.

### Task 2: Student answering and scoring
- [ ] Add failing tests for record generation and scoring rules in `src/store/examStore.js` helpers.
- [ ] Implement spoken keyword matching, letter-case scoring, sentence read-aloud scoring reuse, and image-word matching scoring.
- [ ] Verify tests pass.

### Task 3: Student question components
- [ ] Add the four new question components under `src/components/questions/`.
- [ ] Wire them into `src/views/PaperView.vue`.
- [ ] Keep first version simple: click/select/tap interactions are enough.

### Task 4: Teacher config UI
- [ ] Extend `src/views/NewPaperView.vue` to expose all new type-specific fields.
- [ ] Add lightweight helper editors only where the inline form would become unclear.
- [ ] Ensure existing save/load flow works with all new types.

### Task 5: End-to-end verification
- [ ] Run focused node tests for new helpers and existing paper validation.
- [ ] Run `npm run build` and fix any regressions.
