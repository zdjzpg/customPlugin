const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('paper list exposes a direct copy button in the actions column', () => {
  const source = read('src/views/ConfiguredPapersView.vue');

  assert.match(source, /@click="copyPaperAndRefresh\(record\.id\)"/);
  assert.match(source, /<a-button size="small" @click="copyPaperAndRefresh\(record\.id\)">/);
  assert.doesNotMatch(source, /<a-menu-item key="copy">/);
});
