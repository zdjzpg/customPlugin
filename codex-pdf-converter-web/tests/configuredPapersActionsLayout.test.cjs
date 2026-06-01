const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const viewSource = fs.readFileSync(path.join(__dirname, '../src/views/ConfiguredPapersView.vue'), 'utf8');
const stylesSource = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');

function getActionsColumnWidth(source) {
  const conditionalMatch = source.match(/key:\s*["']actions["'][\s\S]*?width:\s*isCompactTableViewport\.value\s*\?\s*(\d+)\s*:\s*(\d+)/);
  if (conditionalMatch) {
    return conditionalMatch.slice(1).map(Number);
  }
  const singleMatch = source.match(/key:\s*["']actions["'][\s\S]*?width:\s*(\d+)/);
  return singleMatch ? [Number(singleMatch[1])] : null;
}

function getCssBlock(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, 'm'));
  return match ? match[1] : '';
}

test('configured papers actions column keeps enough reserved width for four actions', () => {
  const widths = getActionsColumnWidth(viewSource);
  assert.ok(Array.isArray(widths) && widths.length > 0, 'expected actions column width declaration');
  widths.forEach((width) => {
    assert.ok(width >= 300, `expected actions column width >= 300, got ${width}`);
  });
});

test('configured papers table uses its own internal horizontal scroll width instead of a hard-coded narrow viewport', () => {
  assert.match(viewSource, /:scroll="\{\s*x:\s*tableScrollX\s*\}"/, 'expected table scroll x to be driven by computed width');
  assert.match(viewSource, /const tableScrollX = computed\(\(\)\s*=>\s*columns\.value\.reduce/, 'expected computed table scroll width from columns');
});

test('configured papers actions container fills the table cell so wrapped buttons stay visible', () => {
  const block = getCssBlock(stylesSource, '.admin-papers-actions');
  assert.match(block, /display:\s*flex\s*;/, 'expected .admin-papers-actions to use display: flex');
  assert.match(block, /width:\s*100%\s*;/, 'expected .admin-papers-actions to use width: 100%');
});

test('configured papers keeps copy action inside the more menu to fit the narrow fixed actions column', () => {
  assert.doesNotMatch(viewSource, /copyPaperAndRefresh\(record\.id\).*复制卷子/s, 'expected copy action to be removed from the visible actions row');
  assert.match(viewSource, /<a-menu-item key=['"]copy['"]>/, 'expected copy action inside the more menu');
  assert.match(viewSource, /if \(actionKey === ['"]copy['"]\)\s*\{\s*copyPaperAndRefresh\(paper\.id\);/s, 'expected more-menu handler to trigger copy');
});
