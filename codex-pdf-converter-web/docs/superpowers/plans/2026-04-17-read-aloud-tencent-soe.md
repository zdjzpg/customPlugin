# Read Aloud Tencent SOE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Tencent Cloud oral evaluation for `read_aloud`, score after full submission, show a generating-report state, and fall back to 100 on scoring failure.

**Architecture:** Keep the current submission-first flow, then evaluate only `read_aloud` records on the backend using Tencent SOE and rebuild the final report from persisted scores. Frontend waits in a report-generating state until the backend finishes scoring and returns the completed report.

**Tech Stack:** Vue 3, Express, mysql2, Tencent Cloud SOE, Node crypto/websocket signing, existing submission/record model

---

### Task 1: Add failing tests for Tencent SOE scoring flow

**Files:**
- Create: `tests/tencentSoeFlow.test.cjs`
- Modify: `tests/submissionAudioFlow.test.cjs`

- [ ] **Step 1: Write failing tests for backend Tencent SOE service wiring**
- [ ] **Step 2: Write failing tests for submission flow waiting on scoring before report generation**
- [ ] **Step 3: Run `node --test tests/tencentSoeFlow.test.cjs tests/submissionAudioFlow.test.cjs` and confirm failure**

### Task 2: Add Tencent SOE backend service module

**Files:**
- Create: `server/tencentSoeService.js`
- Modify: `server/index.js`

- [ ] **Step 1: Read `TENCENT_SOE_APP_ID`, `TENCENT_SECRET_ID`, `TENCENT_SECRET_KEY` from `.env` usage sites only**
- [ ] **Step 2: Implement a focused SOE client for English word evaluation of `read_aloud` audio files**
- [ ] **Step 3: Return a normalized 0-100 score from Tencent response data**
- [ ] **Step 4: If credentials are missing or the API call fails, return fallback score 100 instead of throwing**

### Task 3: Persist and recalculate `read_aloud` scores after submission

**Files:**
- Modify: `server/paperRepository.js`

- [ ] **Step 1: Save submissions first as today, keeping uploaded audio metadata on answer rows**
- [ ] **Step 2: After insert, locate only `read_aloud` answers with audio paths and call Tencent SOE**
- [ ] **Step 3: Update the stored `submission_answers` row score fields with the evaluated score**
- [ ] **Step 4: Rebuild the submission report totals from persisted answer rows after scoring finishes**
- [ ] **Step 5: Return the fully scored report payload to the frontend only after scoring is complete**

### Task 4: Add frontend generating-report state

**Files:**
- Modify: `src/store/examStore.js`
- Modify: `src/views/PaperView.vue`
- Create: `src/components/shared/ReportGeneratingOverlay.vue`

- [ ] **Step 1: Add a dedicated `reportGeneratingVisible` state flag to the store**
- [ ] **Step 2: Show the generating overlay immediately after final submission starts**
- [ ] **Step 3: Keep the student on the submission screen until the backend returns the final scored report**
- [ ] **Step 4: Hide the overlay and continue to the report page once scoring is complete**

### Task 5: Verify fallback and end-to-end behavior

**Files:**
- Modify: `tests/tencentSoeFlow.test.cjs`
- Verify: `npm run build`

- [ ] **Step 1: Verify Tencent failure falls back to score 100 for `read_aloud`**
- [ ] **Step 2: Verify non-`read_aloud` microphone questions are untouched in this phase**
- [ ] **Step 3: Run focused tests and `npm run build`**
- [ ] **Step 4: Manually submit one `read_aloud` answer and confirm the final report waits for scoring**
