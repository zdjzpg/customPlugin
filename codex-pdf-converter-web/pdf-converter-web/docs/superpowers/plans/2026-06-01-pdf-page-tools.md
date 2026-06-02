# PDF Page Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `PDF 提取页面` and `拆分 PDF` to the existing buyer tool, reusing the current upload, conversion, and download pipeline.

**Architecture:** Extend the existing conversion catalog and `runConversion` flow with two new conversion keys. Parse buyer-supplied page selections into explicit page orders on the server, then use the shared Python conversion entrypoint to write either one extracted PDF or a ZIP of multiple split PDFs.

**Tech Stack:** Node.js 24, Express, Multer, bundled/system Python, `pypdf`

---

### Task 1: Add failing backend tests

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionService.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionRoutes.test.cjs`

- [ ] Write failing tests for `pdf_extract_pages` and `split_pdf`
- [ ] Run targeted tests and confirm the new assertions fail for the expected missing-feature reason

### Task 2: Implement request parsing and conversion logic

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\app.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\conversionService.cjs`
- Add: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\pageSelectionParser.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\scripts\run_conversion.py`

- [ ] Implement minimal parsing and execution to make the new tests pass
- [ ] Re-run targeted tests until green

### Task 3: Expose the new buyer-facing inputs

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\index.html`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\styles.css`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerLandingCopy.test.cjs`

- [ ] Add the new tool cards and page-range form controls
- [ ] Update copy to mention the new capabilities

### Task 4: Verify and document runtime requirements

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\README.md`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\deploy\ubuntu-22.04\install-system-deps.sh`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\docs\deployment-ubuntu-22.04.md`

- [ ] Add the Python dependency needed for PDF page extraction/splitting
- [ ] Run the full test suite and capture the result before reporting completion
