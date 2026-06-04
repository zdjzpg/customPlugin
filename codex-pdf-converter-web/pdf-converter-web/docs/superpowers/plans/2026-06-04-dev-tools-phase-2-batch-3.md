# Dev Tools Phase 2 Batch 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the next programming-tool batch focused on JSON / Excel-like table text / data structure transforms that are still missing from the buyer toolbox.

**Architecture:** Keep this batch browser-local and text-first. Spreadsheet-related tools will use pasted Excel/TSV table text as input and emit JSON, array syntax, HTML table markup, or tab-delimited output that can be copied back into Excel, avoiding a new download/file pipeline inside the dev-tool runtime.

**Tech Stack:** static ES modules, existing browser-side dev tool runtime, existing buyer tool detail renderer and tests

---

### File Map

- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolCatalog.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolRuntime.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCardMeta.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

