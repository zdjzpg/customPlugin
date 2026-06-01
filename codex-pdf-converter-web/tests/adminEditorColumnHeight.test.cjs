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

test('admin editor columns align to the top instead of stretching to equal height', () => {
  const stylesSource = read('src/styles.css');
  const editorGridBlock = getCssBlock(stylesSource, '.admin-editor-grid');

  assert.match(editorGridBlock, /display:\s*grid;/);
  assert.match(editorGridBlock, /align-items:\s*start;/);
});
