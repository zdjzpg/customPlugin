# Submission Audio And Chinese Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Chinese question-type labels in answer records and save/play back microphone-answer audio from the submissions detail view.

**Architecture:** Keep database schema unchanged by storing recording metadata inside `submission_answers.student_answer_json`. Add a dedicated upload endpoint that saves audio files under `/home/admin/EnglishQuestion/uploads/records`, then submit only the returned `audioPath` with the final answers. Render localized type labels and inline audio playback in the submissions detail table.

**Tech Stack:** Vue 3, Express, mysql2, browser MediaRecorder, HTML audio playback

---

### Task 1: Add failing tests for Chinese labels and recording metadata flow

**Files:**
- Modify: `tests/studentExperience.test.cjs`
- Modify: `tests/paperEditorFollowInstructionValidation.test.cjs`
- Modify: `tests/reportResponsiveLayout.test.cjs`
- Create: `tests/submissionAudioFlow.test.cjs`

- [ ] **Step 1: Write failing tests for the new API/client/store flow**
- [ ] **Step 2: Run the focused test files and confirm they fail for the missing upload/playback behavior**
- [ ] **Step 3: Commit the red tests only if needed after review checkpoint**

### Task 2: Add backend upload endpoint and file persistence

**Files:**
- Modify: `server/index.js`
- Modify: `server/paperRepository.js`
- Create: `server/uploadRepository.js`

- [ ] **Step 1: Add a dedicated upload helper that creates dated folders under `/home/admin/EnglishQuestion/uploads/records` and returns a relative audio path**
- [ ] **Step 2: Add `POST /api/uploads/answer-audio` to accept a single audio file and return `audioPath`, `audioUrl`, and mime metadata**
- [ ] **Step 3: Expose uploaded recordings for authenticated playback with a stable `/uploads/...` URL**
- [ ] **Step 4: Save `audioPath`, `audioUrl`, and `audioMimeType` inside `submission_answers.student_answer_json` when submissions are persisted**
- [ ] **Step 5: Return the saved recording metadata from `listSubmissionsByPaper()` so the admin detail table can render playback controls**

### Task 3: Add frontend recording upload support for microphone-answer questions

**Files:**
- Modify: `src/api/client.js`
- Modify: `src/store/examStore.js`
- Modify: `src/components/questions/ReadAloud.vue`
- Modify: `src/components/questions/ListenAnswerQuestion.vue`
- Modify: `src/components/questions/ReadSentenceWithImage.vue`

- [ ] **Step 1: Add a client helper that uploads an audio blob with `FormData` and returns recording metadata**
- [ ] **Step 2: Extend the speech-recording flow to capture microphone audio via `MediaRecorder` alongside speech recognition**
- [ ] **Step 3: Upload the finished audio blob after recording stops and store `audioPath` metadata on the answer object**
- [ ] **Step 4: Include audio metadata in the `records` payload sent by `createSubmission()` for microphone-answer questions**
- [ ] **Step 5: Keep the existing recognition transcript/score behavior intact if upload fails, with a user-visible warning only for the recording save part**

### Task 4: Localize question-type labels and add inline playback in answer details

**Files:**
- Modify: `src/views/AllAnswersView.vue`
- Modify: `src/utils/content.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Reuse the existing type metadata labels so the detail table shows Chinese type names**
- [ ] **Step 2: Render a compact inline audio player/button for records with `audioUrl` in the student-answer column**
- [ ] **Step 3: Keep transcript text visible for microphone-answer questions and place playback control beside or below it**
- [ ] **Step 4: Add minimal styling so the playback control fits inside the existing admin detail table layout**

### Task 5: Verify end-to-end behavior

**Files:**
- Modify: `tests/submissionAudioFlow.test.cjs`
- Verify: `npm run build`

- [ ] **Step 1: Run focused node tests covering upload, persistence, Chinese labels, and playback rendering**
- [ ] **Step 2: Run `npm run build` and confirm no compile failures**
- [ ] **Step 3: Manually verify one microphone-answer submission can be uploaded, saved, listed, and played back**
