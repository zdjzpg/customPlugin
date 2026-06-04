# PDF 转 PPTX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an open-source `pdf_to_pptx` conversion that produces one editable PPT slide per PDF page with OCR fallback for scanned PDFs.

**Architecture:** Reuse the current upload and conversion pipeline. Add one new conversion key in Node, then implement PDF text/image extraction in Python using `PyMuPDF`, generate slides with `python-pptx`, and trigger OCR pre-processing with `ocrmypdf` only when the source PDF has too little extractable text.

**Tech Stack:** Node.js 24, Express, Python, `PyMuPDF`, `python-pptx`, `ocrmypdf`

---

### Task 1: Add failing tests

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionService.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionRoutes.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

- [ ] Add a failing catalog test for `pdf_to_pptx`
- [ ] Add a failing route test that forwards the uploaded PDF to `conversionService`
- [ ] Add a failing service test that generates a `.pptx`
- [ ] Add a failing markup test for the simple upload form

### Task 2: Implement backend conversion

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\conversionService.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\scripts\run_conversion.py`

- [ ] Add `pdf_to_pptx` to the catalog
- [ ] Add Node-side validation and output naming
- [ ] Add Python command dispatch for `pdf_to_pptx`
- [ ] Implement OCR fallback detection
- [ ] Implement PPT slide generation from text and image blocks
- [ ] Add page-level screenshot fallback for extraction failures

### Task 3: Expose the tool in buyer UI and admin labels

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\adminUsageStatsMarkup.mjs`

- [ ] Add buyer-facing helper text for `PDF 转 PPT`
- [ ] Add admin-side Chinese label mapping

### Task 4: Update deployment notes and verify

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\README.md`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\docs\deployment-ubuntu-22.04.md`

- [ ] Document the new Python dependencies
- [ ] Run targeted tests for service, route, and markup
- [ ] Run the full Node test suite
