# Dev Tools Phase 2 Batch 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the stable network/query subset of the remaining programming tools: Nslookup, IP reverse lookup, dead-link check, SSL cert chain download, batch request, API batch request, browser fingerprint inspection, and a browser-side multi-source IP check.

**Architecture:** Keep device-dependent inspection tools inside the existing browser-side dev runtime so the result reflects the buyer’s actual browser/device. Put DNS, certificate, and request-batch tools behind the existing `/api/dev-tools/run` service so request control, timeout handling, and status collection stay on the server side.

**Tech Stack:** static ES modules, Node 24, built-in `dns/promises`, built-in `tls`, existing dev-tools route/service, browser `fetch`

---

### File Map

- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolCatalog.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolRuntime.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCardMeta.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\devToolsService.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsService.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

