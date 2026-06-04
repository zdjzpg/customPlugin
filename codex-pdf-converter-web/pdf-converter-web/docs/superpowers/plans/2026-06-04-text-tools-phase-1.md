# Text Tools Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `文本工具` category and implement the first high-frequency batch of client-side text tools inside the buyer UI.

**Architecture:** Keep current file-conversion tools as backend-backed items, add a separate local text-tool catalog and runtime layer on the frontend, and let the buyer shell render both categories through one unified state model. Text tools use local forms and instant in-browser processing instead of upload/convert APIs.

**Tech Stack:** Node.js 24 tests, static HTML/CSS, frontend ES modules, current buyer UI shell

---

### Task 1: Add failing tests for text-tool routing and runtime

**Files:**
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\textToolRuntime.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerShellMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerRouteState.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

- [ ] **Step 1: Add failing runtime tests for the 6 Phase 1 text tools**
- [ ] **Step 2: Add failing buyer shell test for the `文本工具` category**
- [ ] **Step 3: Add failing route-state test for a text tool detail URL**
- [ ] **Step 4: Add failing detail-markup test for a local text tool form**

### Task 2: Create the text-tool catalog and runtime

**Files:**
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\textToolCatalog.mjs`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\textToolRuntime.mjs`

- [ ] **Step 1: Add the local text-tool catalog entries**
- [ ] **Step 2: Implement runtime functions for**
  - `text_unique`
  - `text_remove_blank_lines`
  - `text_remove_spaces`
  - `text_replace_batch`
  - `text_char_count`
  - `text_case_convert`
- [ ] **Step 3: Run the new runtime tests and make them pass**

### Task 3: Integrate `文本工具` into the buyer shell and detail flow

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\buyerShellMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\buyerRouteState.mjs`

- [ ] **Step 1: Add `text_tools` to the category catalog**
- [ ] **Step 2: Merge local text tools into search and category listing**
- [ ] **Step 3: Allow route state to restore a text-tool detail page**
- [ ] **Step 4: Branch detail rendering between conversion tools and local text tools**

### Task 4: Add text-tool detail UI and local execution flow

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\styles.css`

- [ ] **Step 1: Add local text-tool detail markup**
- [ ] **Step 2: Add input/output/summary rendering for runtime results**
- [ ] **Step 3: Add local submit handling in `app.js`**
- [ ] **Step 4: Keep mobile and desktop detail pages usable**

### Task 5: Verify end-to-end behavior

**Files:**
- Modify: existing tests as needed

- [ ] **Step 1: Run targeted tests for text-tool runtime and UI**
- [ ] **Step 2: Run the full Node test suite**
- [ ] **Step 3: Smoke-test `文本工具` category, one runtime tool, and refresh-on-detail locally**
