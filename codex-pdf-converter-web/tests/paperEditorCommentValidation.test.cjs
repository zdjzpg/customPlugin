const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('paper editor save flow references comment band validation before saving', () => {
  const appSource = read('src/App.vue');

  assert.match(appSource, /editingCommentValidation/);
});

test('paper repository validates comment bands before persisting papers', () => {
  const source = read('server/paperRepository.js');

  assert.match(source, /validateReportCommentConfig/);
});
