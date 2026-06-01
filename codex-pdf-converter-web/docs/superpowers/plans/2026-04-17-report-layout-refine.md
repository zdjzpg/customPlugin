# Report Layout Refine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compress the teacher comment area, remove the duplicate summary card, and give the two core report panels more space.

**Architecture:** Keep the shared `StudentCraftReport` component as the single source of report layout for student and submission exports. Restructure the shared component so the note becomes a slim inline strip above the main panels, then remove the footer summary block and rebalance the CSS so the progress and radar cards become the dominant area.

**Tech Stack:** Vue 3 SFCs, shared CSS in `src/styles.css`, node:test source assertions

---

### Task 1: Lock the refined report layout with failing tests

**Files:**
- Modify: `tests/reportResponsiveLayout.test.cjs`
- Test: `tests/reportKindergartenCraft.test.cjs`

- [ ] **Step 1: Update report layout assertions to expect no footer summary card and an inline note strip**
- [ ] **Step 2: Run `node --test tests/reportResponsiveLayout.test.cjs tests/reportKindergartenCraft.test.cjs` and confirm it fails**

### Task 2: Reshape the shared report component

**Files:**
- Modify: `src/components/shared/StudentCraftReport.vue`

- [ ] **Step 1: Move the note block above the panel row and change it to a slim inline strip**
- [ ] **Step 2: Remove the `今日收获` summary card and footer row**
- [ ] **Step 3: Keep labels and props aligned with the existing data contract**

### Task 3: Rebalance report CSS and verify

**Files:**
- Modify: `src/styles.css`
- Test: `tests/reportResponsiveLayout.test.cjs`
- Test: `tests/reportKindergartenCraft.test.cjs`

- [ ] **Step 1: Remove footer layout rules and add compact note-strip rules**
- [ ] **Step 2: Increase the visual priority of the two main report panels**
- [ ] **Step 3: Run focused tests, eslint, and a production build**
