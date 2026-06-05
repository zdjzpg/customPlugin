# Office And Teaching Document Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add searchable-scan PDF, batch Office/PDF conversions, exam paper cleanup, image-to-Word, and table-to-Excel tools to the buyer-facing conversion catalog.

**Architecture:** Extend the existing conversion catalog and shared Node/Python pipeline instead of introducing a second document-processing stack. Implement the new tools as additional conversion keys with small shared helpers for OCR, ZIP packaging, exam-image preprocessing, and workbook/docx export.

**Tech Stack:** Node.js 24, Express, static frontend modules, Python, `PyMuPDF`, `opencv-python`, `openpyxl`, `python-docx`, `ocrmypdf`, existing upload/download pipeline

---

### Task 1: Lock failing tests for the new catalog, routes, and forms

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionService.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\conversionRoutes.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

- [ ] Add failing catalog and backend behavior tests for `scan_to_searchable_pdf`
- [ ] Add failing route forwarding tests for batch Office/PDF, exam cleanup, image-to-Word, and Excel tools
- [ ] Add failing detail markup tests for the new option forms

### Task 2: Implement catalog entries and Node-side orchestration

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\conversionService.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\adminToolLabels.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\adminToolLabels.mjs`

- [ ] Add the 9 buyer-facing conversion keys to the catalog with limits and helper text
- [ ] Implement Node-side validation and command dispatch for the new tools
- [ ] Reuse ZIP packaging and OCR-language normalization helpers where possible
- [ ] Add admin label coverage for the new conversion keys

### Task 3: Implement Python conversions

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\scripts\run_conversion.py`

- [ ] Add searchable-PDF OCR command
- [ ] Add batch Office/PDF packaging commands
- [ ] Add exam-paper cleanup command
- [ ] Add image-to-Word command
- [ ] Add PDF/image table extraction to Excel commands

### Task 4: Add frontend detail forms and option collection

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`

- [ ] Add OCR/searchable-PDF form controls
- [ ] Add exam cleanup options
- [ ] Add image-to-Word and table-to-Excel options
- [ ] Add option collection logic in the shared buyer form submit path

### Task 5: Update docs and verify

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\README.md`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\docs\deployment-ubuntu-22.04.md`

- [ ] Update README feature list and environment notes
- [ ] Update Ubuntu deployment docs with the new Python/runtime requirements
- [ ] Run targeted tests first, then full Node test suite
- [ ] Run at least one real conversion flow per new tool family if local dependencies allow
