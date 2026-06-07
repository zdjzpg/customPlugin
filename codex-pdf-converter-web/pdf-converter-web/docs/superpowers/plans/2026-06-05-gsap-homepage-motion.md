# GSAP Homepage Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light, sales-oriented motion to the buyer login page and buyer homepage/list page without changing the admin UI or tool detail flows.

**Architecture:** Keep the current static-page architecture and add a small browser-only motion layer that enhances existing markup. Use data attributes and a focused motion helper so login and buyer-home animations stay isolated from conversion logic and degrade cleanly if GSAP or reduced-motion disables animation.

**Tech Stack:** Node.js 24, static HTML/CSS/ES modules, GSAP, existing buyer shell renderer

---

### Task 1: Add failing tests for motion hooks

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerShellMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerLandingCopy.test.cjs`

- [ ] Add tests for login-page motion scaffolding
- [ ] Add tests for buyer-shell motion data attributes
- [ ] Add tests for category-card and tool-list animation hook markup

### Task 2: Add motion scaffolding to markup and styles

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\index.html`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\buyerShellMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\styles.css`

- [ ] Add lightweight login-page background and animation targets
- [ ] Add buyer-shell data hooks for topbar, search, category cards, and tool cards
- [ ] Add CSS states and reduced-motion-safe fallbacks

### Task 3: Add GSAP loading and motion runtime

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\index.html`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\buyerMotion.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Add vendor asset: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\vendor\gsap\gsap.min.js`

- [ ] Load GSAP in the buyer page only
- [ ] Implement login-page entrance and floating-glow motion
- [ ] Implement buyer-home/list stagger motion and category-switch refresh motion

### Task 4: Verify motion behavior

**Files:**
- Use temp artifacts under: `D:\temp\gsap-homepage-20260605\`

- [ ] Run targeted markup tests
- [ ] Run full Node test suite
- [ ] Run one browser smoke test for login and buyer-home motion visibility
