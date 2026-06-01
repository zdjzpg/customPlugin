# Submission Radar Capture Align Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the radar chart position in submission PNG exports match the on-screen report layout.

**Architecture:** Keep the shared `StudentCraftReport` and `AbilityRadarChart` rendering path unchanged, and remove the capture-only SVG text font override that makes the offscreen submission export diverge from the live page. Lock that behavior with a focused source test so the capture path stays aligned with the normal report view.

**Tech Stack:** Vue 3 SFCs, scoped CSS, node:test source assertions

---

### Task 1: Lock the capture-path rule with a failing test

**Files:**
- Create: `tests/submissionRadarCaptureAlign.test.cjs`
- Modify: `src/components/shared/SubmissionReportCapture.vue`

- [ ] **Step 1: Add a failing test that forbids capture-only `:deep(text)` SVG font overrides**
- [ ] **Step 2: Run `node --test tests/submissionRadarCaptureAlign.test.cjs` and confirm it fails**
- [ ] **Step 3: Remove the capture-only SVG text override and keep the rest of the fallback fonts intact**
- [ ] **Step 4: Re-run the focused test and confirm it passes**
