# UU-Style Buyer UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the buyer-facing UI into a UU-style desktop and mobile tool-station layout while keeping the existing login gate and conversion flows intact.

**Architecture:** Keep the backend and conversion logic unchanged, but replace the buyer-side DOM structure and rendering model with a new shell: top bar, desktop side navigation, mobile menu, search/filter area, and a denser tool list + detail layout. Share one buyer state model across desktop and mobile, with layout-specific render helpers for navigation and list shells.

**Tech Stack:** Node.js 24 tests, static HTML/CSS, frontend ES modules, existing buyer conversion flow modules

---

### Task 1: Add failing tests for the new buyer shell and navigation model

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerLandingCopy.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\mobileBuyerUiMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCategoryMarkup.test.cjs`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerShellMarkup.test.cjs`

- [ ] **Step 1: Add a failing desktop shell markup test**

```js
test('createBuyerShellMarkup renders UU-style top bar and desktop side navigation', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerShellMarkup.mjs')
  ).href;
  const { createBuyerShellMarkup } = await import(moduleUrl);

  const html = createBuyerShellMarkup({
    title: 'PPT 工具',
    searchKeyword: ''
  });

  assert.match(html, /UU风格工具站/);
  assert.match(html, /data-buyer-topbar/);
  assert.match(html, /data-desktop-side-nav/);
  assert.match(html, /data-tool-search-input/);
});
```

- [ ] **Step 2: Run the new shell test and verify it fails**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\buyerShellMarkup.test.cjs
```

Expected:

- FAIL because `public/buyerShellMarkup.mjs` does not exist yet

- [ ] **Step 3: Add failing mobile navigation assertions**

```js
assert.match(html, /data-mobile-nav-toggle/);
assert.match(html, /进入工具分类/);
assert.match(html, /data-mobile-category-list/);
```

- [ ] **Step 4: Run the mobile markup test and verify it fails**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\mobileBuyerUiMarkup.test.cjs
```

Expected:

- FAIL because the current mobile markup has no UU-style top bar/menu/search shell

- [ ] **Step 5: Add failing landing copy assertions for the new buyer shell**

```js
assert.match(html, /工具分类/);
assert.match(html, /搜索工具/);
assert.match(html, /PPT 工具/);
```

- [ ] **Step 6: Run the landing-copy test and verify it fails**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\buyerLandingCopy.test.cjs
```

Expected:

- FAIL because the current buyer page still uses the old hero/panel shell

### Task 2: Replace the buyer page shell and shared navigation/search renderers

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\index.html`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\buyerShellMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCategoryMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\mobileBuyerMarkup.mjs`

- [ ] **Step 1: Create a buyer shell renderer for the desktop shell**

```js
export function createBuyerShellMarkup(input) {
  return `
    <header class="buyer-topbar" data-buyer-topbar>...</header>
    <aside class="buyer-side-nav" data-desktop-side-nav>...</aside>
    <section class="buyer-main-shell">...</section>
  `;
}
```

- [ ] **Step 2: Replace the old hero-first HTML shell in `index.html` with buyer app hosts**

```html
<main class="buyer-app">
  <section class="login-shell" id="buyer-login-panel">...</section>
  <section class="hidden" id="buyer-dashboard">
    <div id="buyer-shell-host"></div>
    <div id="buyer-content-host"></div>
    <p class="message" id="conversion-message"></p>
  </section>
</main>
```

- [ ] **Step 3: Extend category and mobile markup helpers for UU-style shell content**

```js
export function createCategoryOverviewMarkup(categories, options = {}) { ... }
export function createMobileCategoryOverviewMarkup(categories, options = {}) { ... }
```

- [ ] **Step 4: Run the targeted shell tests and verify they pass**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\buyerShellMarkup.test.cjs tests\toolCategoryMarkup.test.cjs tests\mobileBuyerUiMarkup.test.cjs tests\buyerLandingCopy.test.cjs
```

Expected:

- PASS for all shell/navigation markup tests

### Task 3: Rebuild the buyer state machine for search + list + detail

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`

- [ ] **Step 1: Add the new buyer shell DOM references and state**

```js
const buyerShellHost = document.querySelector('#buyer-shell-host');
const buyerContentHost = document.querySelector('#buyer-content-host');

let currentViewState = {
  view: 'tool_list',
  categoryKey: 'ppt_tools',
  conversionKey: null,
  searchKeyword: ''
};
```

- [ ] **Step 2: Add a filtered-tool helper**

```js
function getVisibleTools(categoryKey, searchKeyword = '') {
  const tools = getToolsForCategory(categoryKey);
  const keyword = searchKeyword.trim().toLowerCase();
  if (!keyword) {
    return tools;
  }

  return tools.filter((item) =>
    item.label.toLowerCase().includes(keyword) ||
    (item.helperText || '').toLowerCase().includes(keyword)
  );
}
```

- [ ] **Step 3: Replace `renderCategories()` / `renderCategoryTools()` with a unified buyer shell render**

```js
function renderToolList() {
  currentViewState.view = 'tool_list';
  renderBuyerShell();
  renderBuyerContent();
}
```

- [ ] **Step 4: Wire desktop/mobile nav clicks, search input, and detail return**

```js
if (event.target.closest('[data-open-category]')) { ... }
if (event.target.closest('[data-mobile-nav-toggle]')) { ... }
if (event.target.closest('[data-back-to-tool-list]')) { ... }
```

- [ ] **Step 5: Keep current conversion submit/detail logic intact under the new shell**

```js
if (currentViewState.view === 'detail' && currentViewState.conversionKey) {
  renderDetail(currentViewState.conversionKey);
}
```

- [ ] **Step 6: Run front-end focused tests**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\toolCatalogMarkup.test.cjs tests\toolCategoryMarkup.test.cjs tests\mobileBuyerUiMarkup.test.cjs tests\buyerLandingCopy.test.cjs
```

Expected:

- PASS with the new buyer shell state model

### Task 4: Replace the visual system with UU-style desktop and mobile styling

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\styles.css`

- [ ] **Step 1: Replace the current warm hero layout with a clean tool-station base**

```css
:root {
  --bg: #f5f7fb;
  --surface: #ffffff;
  --surface-soft: #f9fbff;
  --line: #e3e8f2;
  --text: #24324a;
  --muted: #7b8aa3;
  --brand: #3f7cff;
}
```

- [ ] **Step 2: Add desktop topbar + side-nav + content-area layout**

```css
.buyer-topbar { ... }
.buyer-layout { ... }
.buyer-side-nav { ... }
.buyer-main-shell { ... }
```

- [ ] **Step 3: Add mobile topbar, menu, search, and card styling**

```css
@media (max-width: 720px) {
  .buyer-side-nav { display: none; }
  .mobile-nav-panel { ... }
  .buyer-search-panel { ... }
}
```

- [ ] **Step 4: Tighten tool card density and UU-style interaction**

```css
.tool-overview-card { ... }
.tool-overview-card:hover { ... }
.tool-tag { ... }
```

- [ ] **Step 5: Run visual-markup tests and syntax checks**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check public\app.js
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\buyerShellMarkup.test.cjs tests\toolCategoryMarkup.test.cjs tests\mobileBuyerUiMarkup.test.cjs tests\toolCatalogMarkup.test.cjs
```

Expected:

- PASS with no syntax errors

### Task 5: Verify the end-to-end buyer flow under the new shell

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerLandingCopy.test.cjs`
- Create or reuse: `D:\temp\buyer-ui-redesign-selftest-20260604\*.js`

- [ ] **Step 1: Run the full Node test suite**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\*.test.cjs
```

Expected:

- PASS with zero failing tests

- [ ] **Step 2: Smoke-test the logged-in buyer flow locally**

Run:

```powershell
try { (Invoke-WebRequest 'http://127.0.0.1:3015/api/health' -UseBasicParsing).Content } catch { $_.Exception.Message }
```

Expected:

- local service responds
- after login, desktop opens the UU-style tool-station shell
- category/tool list/detail transitions still work

- [ ] **Step 3: Smoke-test the mobile buyer view locally**

Run:

```powershell
try { (Invoke-WebRequest 'http://127.0.0.1:3015/' -UseBasicParsing).StatusCode } catch { $_.Exception.Message }
```

Expected:

- page is reachable
- mobile viewport shows the new topbar, menu entry, search area, and tool list
