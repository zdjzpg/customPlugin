const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const stylesSource = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');

function getCssBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stylesSource.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'm'));
  assert.ok(match, `Expected CSS block for ${selector}`);
  return match[1];
}

test('admin shell keeps the sidebar compact so the main area retains enough width', () => {
  const block = getCssBlock('.admin-shell');
  const match = block.match(/grid-template-columns:\s*(\d+)px\s+minmax\(0,\s*1fr\)/);
  assert.ok(match, 'Expected fixed sidebar width followed by flexible main column');
  assert.ok(Number(match[1]) <= 180, `expected sidebar width <= 180px, got ${match[1]}px`);
});

test('admin section headers wrap action buttons instead of pushing content off the right edge', () => {
  const block = getCssBlock('.admin-section-header');
  assert.match(block, /flex-wrap:\s*wrap;/, 'Expected .admin-section-header to allow wrapping');
});

test('admin content reserves enough room from the scrollbar gutter on the right', () => {
  const block = getCssBlock('.admin-content');
  const match = block.match(/padding-right:\s*(\d+)px;/);
  assert.ok(match, 'Expected .admin-content to define right padding');
  assert.ok(Number(match[1]) >= 16, `expected right padding >= 16px, got ${match[1]}px`);
  assert.match(block, /overflow-x:\s*hidden;/, 'expected page-level horizontal overflow to stay hidden so the table handles scrolling internally');
});
