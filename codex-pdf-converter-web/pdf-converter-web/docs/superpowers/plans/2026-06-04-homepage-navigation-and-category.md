# Homepage Navigation And Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a logged-in homepage category layer so buyers first land on a single `PPT 工具` category card, then enter the current tool list, then existing tool detail pages.

**Architecture:** Keep the backend catalog unchanged and add a small frontend category configuration layer. Extend the buyer page state machine from `overview/detail` to `categories/category_tools/detail`, render the new category cards and category tool list in dedicated markup helpers, and preserve the current detail-page conversion flow.

**Tech Stack:** Node.js 24 tests, static HTML/CSS, frontend ES modules, existing buyer dashboard state/rendering

---

### Task 1: Add failing tests for the new buyer navigation states

**Files:**
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCategoryMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\mobileBuyerUiMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerLandingCopy.test.cjs`

- [ ] **Step 1: Write the failing desktop category markup test**

```js
test('createCategoryOverviewMarkup renders the PPT tool category card', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCategoryMarkup.mjs')
  ).href;
  const { createCategoryOverviewMarkup } = await import(moduleUrl);

  const html = createCategoryOverviewMarkup([
    {
      key: 'ppt_tools',
      label: 'PPT 工具',
      description: '进入后查看当前全部已实现工具。',
      iconLabel: 'PPT'
    }
  ]);

  assert.match(html, /PPT 工具/);
  assert.match(html, /进入后查看当前全部已实现工具。/);
  assert.match(html, /data-open-category="ppt_tools"/);
});
```

- [ ] **Step 2: Run the category markup test and verify it fails**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\toolCategoryMarkup.test.cjs
```

Expected:

- FAIL because `public/toolCategoryMarkup.mjs` does not exist yet

- [ ] **Step 3: Write the failing mobile category markup test**

```js
test('createMobileCategoryOverviewMarkup renders a single-column PPT tool category card', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'mobileBuyerMarkup.mjs')
  ).href;
  const { createMobileCategoryOverviewMarkup } = await import(moduleUrl);

  const html = createMobileCategoryOverviewMarkup([
    {
      key: 'ppt_tools',
      label: 'PPT 工具',
      description: '进入后查看当前全部已实现工具。'
    }
  ]);

  assert.match(html, /PPT 工具/);
  assert.match(html, /data-open-category="ppt_tools"/);
});
```

- [ ] **Step 4: Run the mobile markup test and verify it fails**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\mobileBuyerUiMarkup.test.cjs
```

Expected:

- FAIL because `createMobileCategoryOverviewMarkup` does not exist yet

- [ ] **Step 5: Write the failing landing-copy test for the new category wording**

```js
assert.match(script, /PPT 工具/);
assert.match(script, /返回分类首页/);
```

- [ ] **Step 6: Run the landing-copy test and verify it fails**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\buyerLandingCopy.test.cjs
```

Expected:

- FAIL because the current buyer source does not include the new category-layer wording

### Task 2: Implement category markup helpers and buyer state transitions

**Files:**
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCategoryMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\mobileBuyerMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\index.html`

- [ ] **Step 1: Create the minimal desktop category markup helper**

```js
export function createCategoryOverviewMarkup(categories) {
  return categories
    .map(
      (category) => `
        <article class="category-card" data-open-category="${category.key}">
          <div class="category-card-icon" aria-hidden="true">${category.iconLabel || 'PPT'}</div>
          <div class="category-card-copy">
            <h3>${category.label}</h3>
            <p>${category.description || ''}</p>
          </div>
          <button class="button category-card-button" type="button" data-open-category="${category.key}">进入分类</button>
        </article>
      `
    )
    .join('');
}
```

- [ ] **Step 2: Create the minimal mobile category markup helper**

```js
export function createMobileCategoryOverviewMarkup(categories) {
  return `
    <div class="mobile-tool-list">
      ${categories
        .map(
          (category) => `
            <article class="mobile-tool-card">
              <div class="mobile-tool-copy">
                <h3>${category.label}</h3>
                <p>${category.description || ''}</p>
              </div>
              <button class="button mobile-tool-button" type="button" data-open-category="${category.key}">进入分类</button>
            </article>
          `
        )
        .join('')}
    </div>
  `;
}
```

- [ ] **Step 3: Extend the buyer dashboard state model in `app.js`**

```js
const CATEGORY_CATALOG = [
  {
    key: 'ppt_tools',
    label: 'PPT 工具',
    description: '进入后查看当前全部已实现工具。',
    iconLabel: 'PPT'
  }
];

let currentViewState = {
  view: 'categories',
  categoryKey: null,
  conversionKey: null
};
```

- [ ] **Step 4: Implement render functions for `categories` and `category_tools`**

```js
function renderCategories() {
  currentViewState = {
    view: 'categories',
    categoryKey: null,
    conversionKey: null
  };
}

function renderCategoryTools(categoryKey) {
  currentViewState = {
    view: 'category_tools',
    categoryKey,
    conversionKey: null
  };
}
```

- [ ] **Step 5: Wire click handling for `data-open-category` and category back-navigation**

```js
if (event.target.closest('[data-open-category]')) {
  renderCategoryTools(event.target.closest('[data-open-category]').dataset.openCategory);
  return;
}

if (event.target.closest('[data-back-to-categories]')) {
  renderCategories();
  return;
}
```

- [ ] **Step 6: Keep existing detail-page back-navigation pointed at the category tool list**

```js
if (event.target.closest('[data-back-to-overview]')) {
  renderCategoryTools(currentViewState.categoryKey || 'ppt_tools');
  return;
}
```

- [ ] **Step 7: Run the targeted tests and verify they pass**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\toolCategoryMarkup.test.cjs tests\mobileBuyerUiMarkup.test.cjs tests\buyerLandingCopy.test.cjs
```

Expected:

- PASS for all targeted category-navigation tests

### Task 3: Add the category-page shell and hover styling

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\index.html`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\styles.css`

- [ ] **Step 1: Add a dedicated category host to the buyer dashboard shell**

```html
<div id="category-overview"></div>
<div class="hidden" id="conversion-overview"></div>
<div class="hidden" id="conversion-detail"></div>
```

- [ ] **Step 2: Add desktop hover styling for the category card**

```css
.category-card {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.category-card:hover {
  transform: translateY(-8px);
  border-color: rgba(178, 92, 45, 0.42);
  box-shadow: 0 24px 56px rgba(117, 84, 41, 0.16);
}
```

- [ ] **Step 3: Add the same hover treatment to tool cards**

```css
.tool-overview-card {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.tool-overview-card:hover {
  transform: translateY(-6px);
  border-color: rgba(178, 92, 45, 0.42);
  box-shadow: 0 20px 48px rgba(117, 84, 41, 0.14);
}
```

- [ ] **Step 4: Run the markup tests again**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\toolCatalogMarkup.test.cjs tests\toolCategoryMarkup.test.cjs tests\mobileBuyerUiMarkup.test.cjs
```

Expected:

- PASS with the new category shell still rendering existing tool detail markup correctly

### Task 4: Run the full verification pass

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\mobileBuyerUiMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerLandingCopy.test.cjs`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCategoryMarkup.test.cjs`

- [ ] **Step 1: Run the complete Node test suite**

Run:

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\*.test.cjs
```

Expected:

- PASS with zero failing tests

- [ ] **Step 2: Smoke-test the logged-in buyer flow locally**

Run:

```powershell
try { (Invoke-WebRequest 'http://127.0.0.1:3015/api/conversions/catalog' -UseBasicParsing).Content } catch { $_.Exception.Message }
```

Expected:

- health/catalog still returns the existing tools
- the frontend now opens into the new `PPT 工具` category layer after login
