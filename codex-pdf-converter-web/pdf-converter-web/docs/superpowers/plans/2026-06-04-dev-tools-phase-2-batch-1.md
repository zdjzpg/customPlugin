# Dev Tools Phase 2 Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first batch of remaining programming tools: JSON/CSV/PHP/JS conversion helpers, JSON merge/key-value extraction, RSA key generation, PHP password hashing, JS/CSS/HTML beautify/minify, and CSS/JS cleanup.

**Architecture:** Keep simple text-conversion tools inside the existing browser-side `runDevTool` runtime, because they only need textarea input and deterministic local output. Add a lightweight `server_dev_tool` kind for the small set of tools that benefit from Node dependencies or stronger compatibility guarantees, then route those through the existing `/api/dev-tools/run` endpoint.

**Tech Stack:** static ES modules, Node 24, existing dev-tools route/service, `js-beautify`, `terser`, `clean-css`, `html-minifier-terser`, `bcryptjs`

---

### File Map

**Browser-local additions**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolCatalog.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolRuntime.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`

**Server-backed additions**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\devToolsService.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\package.json`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\package-lock.json`

**Tests**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsService.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

