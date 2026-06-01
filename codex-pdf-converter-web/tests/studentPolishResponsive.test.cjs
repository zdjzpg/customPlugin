const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('finish overlay and student shell include richer celebration cues and ipad-oriented sizing', () => {
  const finishSource = read('src/components/shared/StudentFinishOverlay.vue');
  const stylesSource = read('src/styles.css');

  assert.match(finishSource, /finish-ribbon/);
  assert.match(finishSource, /finish-mascot/);
  assert.match(finishSource, /finish-burst/);

  assert.match(stylesSource, /\.finish-ribbon\s*\{/);
  assert.match(stylesSource, /\.finish-mascot\s*\{/);
  assert.match(stylesSource, /\.finish-burst\s*\{/);
  assert.match(stylesSource, /\.public-root\s*\{[\s\S]*width:\s*min\(94vw,\s*1800px\);/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*1366px\)\s*and\s*\(min-width:\s*768px\)/);
});
