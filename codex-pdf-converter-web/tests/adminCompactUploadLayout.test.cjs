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

test('compact image upload stays stacked inside narrow admin editor columns', () => {
  const stylesSource = read('src/styles.css');
  const fieldSource = read('src/components/editors/ImageUploadField.vue');
  const compactFieldBlock = getCssBlock(stylesSource, '.image-upload-field.compact');
  const compactActionsBlock = getCssBlock(stylesSource, '.image-upload-actions.compact');

  assert.match(fieldSource, /v-if="props\.compact"/);
  assert.match(fieldSource, /list-type="picture-card"/);
  assert.match(fieldSource, /showRemoveIcon:\s*true/);
  assert.match(compactFieldBlock, /grid-template-columns:\s*1fr;/);
  assert.match(compactActionsBlock, /display:\s*grid;/);
  assert.match(compactActionsBlock, /justify-items:\s*start;/);
});
