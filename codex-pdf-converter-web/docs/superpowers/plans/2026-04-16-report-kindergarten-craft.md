# Report Kindergarten Craft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the student report screens into a kindergarten craft style without changing report data, export behavior, or score logic.

**Architecture:** Keep the existing report data flow and export hooks intact, but replace the report-state template wording and structure in `PaperView.vue` and `ReportView.vue` with a shared “growth record” layout. Update the report-specific CSS and radar styling so the visual language shifts from admin dashboard to classroom craft board while remaining export-safe and responsive.

**Tech Stack:** Vue 3 SFCs, shared CSS in `src/styles.css`, node:test source assertions

---

### Task 1: Lock The New Report Contract With Tests

**Files:**
- Create: `tests/reportKindergartenCraft.test.cjs`
- Modify: `package.json`
- Reference: `src/views/ReportView.vue`
- Reference: `src/views/PaperView.vue`
- Reference: `src/styles.css`
- Reference: `src/components/shared/AbilityRadarChart.vue`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('report views use kindergarten craft wording and shared report blocks', () => {
  const reportViewSource = read('src/views/ReportView.vue');
  const paperViewSource = read('src/views/PaperView.vue');

  assert.match(reportViewSource, /今日英语成长记录/);
  assert.match(reportViewSource, /成长档案/);
  assert.match(reportViewSource, /手工贴纸栏/);
  assert.match(reportViewSource, /老师想对你说/);
  assert.match(reportViewSource, /听说读表现/);

  assert.match(paperViewSource, /今日英语成长记录/);
  assert.match(paperViewSource, /成长档案/);
  assert.match(paperViewSource, /手工贴纸栏/);
  assert.match(paperViewSource, /老师想对你说/);
});

test('report styles define kindergarten craft layout tokens', () => {
  const stylesSource = read('src/styles.css');
  const radarSource = read('src/components/shared/AbilityRadarChart.vue');

  assert.match(stylesSource, /\.report-craft-shell\s*\{/);
  assert.match(stylesSource, /\.craft-kpi\.craft-kpi-score\s*\{/);
  assert.match(stylesSource, /\.craft-note-card\s*\{/);
  assert.match(stylesSource, /\.craft-progress-fill\s*\{/);
  assert.match(radarSource, /report-radar-card/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/reportKindergartenCraft.test.cjs`
Expected: FAIL because the report views still use the old “测评报告已生成 / 卷子作答结果 / 教师评语 / 能力雷达图” wording and the new craft classes do not exist yet.

- [ ] **Step 3: Add a script for repeated local runs**

```json
"test:report-style": "node --test tests/reportKindergartenCraft.test.cjs"
```

- [ ] **Step 4: Run the focused test again through the script**

Run: `npm run test:report-style`
Expected: FAIL with the same missing-markup assertions, confirming the new script points at the right test file.

- [ ] **Step 5: Commit**

```bash
git add tests/reportKindergartenCraft.test.cjs package.json
git commit -m "test: lock kindergarten craft report contract"
```

### Task 2: Rebuild Report Markup Around The Craft Layout

**Files:**
- Modify: `src/views/ReportView.vue`
- Modify: `src/views/PaperView.vue`
- Reference: `src/store/examStore.js`

- [ ] **Step 1: Replace the report-state heading copy in `src/views/ReportView.vue`**

```vue
<h1 class="hero-title">今日英语成长记录</h1>
<p class="hero-subtitle">
  成长档案：{{ state.student.name || '-' }} · 年龄：{{ state.student.age || '-' }} ·
  学校：{{ state.student.school || '-' }} · 联系方式：{{ state.student.phone || '-' }}
</p>
```

- [ ] **Step 2: Introduce the craft sticker row and hero summary blocks in `src/views/ReportView.vue`**

```vue
<div class="chip-row craft-sticker-row">
  <div class="chip craft-sticker">🌟 手工贴纸栏</div>
  <div class="chip craft-sticker">🏆 总分 {{ state.report.total }} / {{ state.report.totalPossible }}</div>
  <div class="chip craft-sticker">📈 完成率 {{ state.report.percent }}%</div>
</div>
```

- [ ] **Step 3: Replace the KPI and panel layout in `src/views/ReportView.vue` with craft blocks**

```vue
<div class="report-grid report-craft-shell">
  <div class="summary-kpis craft-kpi-grid">
    <div class="kpi craft-kpi craft-kpi-score">...</div>
    <div class="kpi craft-kpi craft-kpi-total">...</div>
    <div class="kpi craft-kpi craft-kpi-percent">...</div>
    <div class="kpi craft-kpi craft-kpi-count">...</div>
  </div>

  <div class="report-panels craft-report-panels">
    <div class="card craft-progress-card">...</div>
    <div class="card craft-radar-card">...</div>
  </div>

  <div class="card craft-note-card">...</div>
</div>
```

- [ ] **Step 4: Mirror the same report-state structure in `src/views/PaperView.vue`**

```vue
<h1 class="hero-title">今日英语成长记录</h1>
<p class="hero-subtitle">
  成长档案：{{ state.student.name || '-' }} · 年龄：{{ state.student.age || '-' }} ·
  学校：{{ state.student.school || '-' }} · 联系方式：{{ state.student.phone || '-' }}
</p>
```

- [ ] **Step 5: Keep the data contract unchanged while renaming section labels**

```vue
<h2>听说读表现</h2>
<h2>老师想对你说</h2>
<span class="tag">成长档案</span>
```

- [ ] **Step 6: Run the focused test**

Run: `npm run test:report-style`
Expected: still FAIL, but now only on the missing CSS and radar styling assertions.

- [ ] **Step 7: Commit**

```bash
git add src/views/ReportView.vue src/views/PaperView.vue
git commit -m "feat: reshape report views into craft layout"
```

### Task 3: Apply The Kindergarten Craft Visual System

**Files:**
- Modify: `src/styles.css`
- Modify: `src/components/shared/AbilityRadarChart.vue`
- Test: `tests/reportKindergartenCraft.test.cjs`

- [ ] **Step 1: Add report craft layout classes in `src/styles.css`**

```css
.report-craft-shell {
  gap: 20px;
}

.craft-kpi-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.craft-kpi {
  border-radius: 24px;
  border: 2px solid rgba(152, 128, 92, 0.12);
  box-shadow: 0 12px 28px rgba(122, 107, 74, 0.08);
}
```

- [ ] **Step 2: Add sticker, progress, and note styling in `src/styles.css`**

```css
.craft-sticker-row { gap: 12px; }
.craft-sticker { border-radius: 999px; }
.craft-progress-fill {
  background: linear-gradient(90deg, #7fd9ff 0%, #7fe6b7 100%);
}
.craft-note-card {
  background: linear-gradient(180deg, #fff7cf 0%, #fffdf3 100%);
}
```

- [ ] **Step 3: Make the radar card feel lighter in `src/components/shared/AbilityRadarChart.vue`**

```vue
<div class="ability-radar-wrap report-radar-card">
```

```vue
stroke="rgba(143, 189, 222, 0.28)"
fill="rgba(122, 216, 198, 0.24)"
stroke="#63bfa6"
fill="#4f8fcc"
```

- [ ] **Step 4: Keep responsive behavior for desktop and iPad in `src/styles.css`**

```css
@media (max-width: 960px) {
  .craft-kpi-grid,
  .craft-report-panels {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run the focused report test**

Run: `npm run test:report-style`
Expected: PASS

- [ ] **Step 6: Run regression checks**

Run: `npm run test:report-style && npm run test:paper-validation && npm run test:audio-feedback`
Expected: all PASS

- [ ] **Step 7: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/styles.css src/components/shared/AbilityRadarChart.vue tests/reportKindergartenCraft.test.cjs package.json
git commit -m "feat: apply kindergarten craft report styling"
```
