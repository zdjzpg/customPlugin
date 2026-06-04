# PDF 页面整理与密码工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add delete-pages, reorder-pages, and protect/unlock PDF tools with buyer-facing detail pages and working backend conversions.

**Architecture:** Reuse the current conversion pipeline and `pypdf`-based page operations. Add three new conversion keys, expose their forms in the shared tool detail renderer, and use a lightweight thumbnail/selection model for browser-side page organization.

**Tech Stack:** Node.js 24, Express, static frontend modules, Python, `pypdf`, existing `pdf2image + poppler`

---

### Task 1: Add failing tests

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionService.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionRoutes.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

- [ ] Add failing tests for catalog exposure and backend behavior of the three tools
- [ ] Add route tests for option forwarding
- [ ] Add detail markup tests for the three forms

### Task 2: Implement backend conversions

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\conversionService.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\scripts\run_conversion.py`

- [ ] Add conversion keys and helper text
- [ ] Implement delete-pages conversion
- [ ] Implement reorder-pages conversion
- [ ] Implement protect/unlock conversion

### Task 3: Add frontend forms and interaction

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\styles.css`

- [ ] Add delete-pages inputs
- [ ] Add reorder-pages inputs and thumbnail interaction shell
- [ ] Add protect/unlock inputs

### Task 4: Verify end to end

**Files:**
- Add/update: `D:\temp\pdf-page-tools-test-20260601\*.py`

- [ ] Run targeted tests
- [ ] Run full test suite
- [ ] Run browser flows for delete-pages, reorder-pages, protect, and unlock
