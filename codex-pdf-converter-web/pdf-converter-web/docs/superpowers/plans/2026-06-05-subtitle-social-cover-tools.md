# Subtitle And Social Cover Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `SRT 字幕转文本 / 文本转字幕` under `文本工具` and `图片加边框 / 社媒封面留白` under `图像工具` using the existing local-tool architecture.

**Architecture:** Subtitle tools extend the current `local_text` runtime with SRT parsing/generation plus local download support. Social-cover padding extends the existing `local_image_tool` runtime with a second local image tool that renders a padded canvas using either solid-color or blurred-image backgrounds and exports the result locally.

**Tech Stack:** Static frontend modules, browser Blob downloads, Canvas 2D, existing Node test runner.

---

### Task 1: Subtitle Tool Catalog And Runtime

**Files:**
- Modify: `public/textToolCatalog.mjs`
- Modify: `public/textToolRuntime.mjs`
- Test: `tests/textToolRuntime.test.cjs`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run subtitle runtime tests to verify they fail**
- [ ] **Step 3: Add `text_srt_to_text` and `text_text_to_srt` to the text tool catalog**
- [ ] **Step 4: Implement SRT parsing and SRT generation in `runTextTool`**
- [ ] **Step 5: Run subtitle runtime tests to verify they pass**

### Task 2: Subtitle Tool Markup And Local Download Wiring

**Files:**
- Modify: `public/toolCatalogMarkup.mjs`
- Modify: `public/app.js`
- Test: `tests/toolCatalogMarkup.test.cjs`

- [ ] **Step 1: Write the failing markup assertions for subtitle tool inputs and download affordance**
- [ ] **Step 2: Run markup tests to verify they fail**
- [ ] **Step 3: Add subtitle-specific form controls in local text detail markup**
- [ ] **Step 4: Add local text download link handling in `public/app.js`**
- [ ] **Step 5: Run markup tests to verify they pass**

### Task 3: Social Cover Local Image Tool

**Files:**
- Modify: `public/localImageToolCatalog.mjs`
- Modify: `public/localImageToolRuntime.mjs`
- Modify: `public/toolCatalogMarkup.mjs`
- Modify: `public/app.js`
- Test: `tests/localImageToolCatalog.test.cjs`
- Test: `tests/localImageToolRuntime.test.cjs`
- Test: `tests/toolCatalogMarkup.test.cjs`

- [ ] **Step 1: Write the failing catalog/runtime/markup tests for the social-cover tool**
- [ ] **Step 2: Run the targeted local image tests to verify they fail**
- [ ] **Step 3: Add the local image tool catalog entry and form controls**
- [ ] **Step 4: Implement padded social-cover canvas rendering with solid and blurred backgrounds**
- [ ] **Step 5: Wire option collection in `public/app.js` and run targeted tests to verify they pass**

### Task 4: Full Verification

**Files:**
- Modify: `public/toolCardMeta.mjs`
- Test: `tests/*.test.cjs`

- [ ] **Step 1: Add tool card metadata for the new text and image tools if tests or UI need explicit mapping**
- [ ] **Step 2: Run the full test suite**
- [ ] **Step 3: Fix any regressions and rerun the full test suite until green**
