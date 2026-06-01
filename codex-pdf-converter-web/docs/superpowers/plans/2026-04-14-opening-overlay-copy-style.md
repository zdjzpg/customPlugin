# Opening Overlay Copy And Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the mismatched top badge from the student opening overlay while keeping the original paper title and making the title/subtitle styling feel more playful.

**Architecture:** Keep the existing overlay component and animation structure, but remove the standalone badge node and let the title area carry the visual hierarchy. Add a narrow regression test around the rendered copy/structure, then adjust the component markup and shared CSS so only the opening overlay typography becomes more child-friendly without affecting the rest of the app.

**Tech Stack:** Vue 3, Node test runner, shared CSS in `src/styles.css`

---

### Task 1: Lock the opening overlay copy and structure

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\tests\studentExperience.test.cjs`
- Modify: `D:\aa-workplace\EnglishQuestion\src\components\shared\StudentOpeningOverlay.vue`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the targeted test and confirm it fails for the expected reason**
- [ ] **Step 3: Implement the minimal markup/text update**
- [ ] **Step 4: Re-run the targeted test and confirm it passes**

### Task 2: Refresh the overlay typography and spacing

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\src\styles.css`

- [ ] **Step 1: Update the opening overlay CSS selectors to remove badge-specific dependency**
- [ ] **Step 2: Add playful title/subtitle styling scoped to the opening overlay**
- [ ] **Step 3: Verify the targeted test still passes and the app build stays green**
