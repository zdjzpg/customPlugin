const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

function getCssBlock(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `Expected CSS block for ${selector}`);
  return match[1];
}

test('teacher shell scrolls inside admin content instead of locking the paper editor columns', () => {
  const stylesSource = read('src/styles.css');
  const newPaperViewSource = read('src/views/NewPaperView.vue');
  const adminContentBlock = getCssBlock(stylesSource, '.admin-content');

  assert.match(adminContentBlock, /overflow-y:\s*auto;/);
  assert.doesNotMatch(adminContentBlock, /overflow:\s*hidden;/);
  assert.doesNotMatch(newPaperViewSource, /class="stack admin-editor-scroll"/);
});
