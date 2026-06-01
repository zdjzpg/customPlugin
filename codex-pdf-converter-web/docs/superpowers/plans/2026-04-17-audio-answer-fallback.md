# Audio Answer Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `未识别` text in answer records whenever a voice question already has an `audioUrl` playback bar.

**Architecture:** Keep the stored submission data unchanged and fix the issue only in the admin detail rendering layer. Update `AllAnswersView.vue` so the fallback text is suppressed only for the narrow case of `studentText === '未识别'` plus a truthy `audioUrl`, leaving all other text/audio combinations intact.

**Tech Stack:** Vue 3 render functions, node:test source assertions

---

### Task 1: Lock the display rule with a failing test

**Files:**
- Create: `tests/answersAudioFallback.test.cjs`
- Modify: `src/views/AllAnswersView.vue`

- [ ] **Step 1: Add a failing source assertion for the audio + 未识别 case**
- [ ] **Step 2: Run the focused test and confirm it fails before the code change**
- [ ] **Step 3: Implement the minimal conditional render in `renderStudentAnswer`**
- [ ] **Step 4: Re-run the focused test and confirm it passes**
