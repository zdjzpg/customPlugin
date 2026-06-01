const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('router restores a public report view from the report token query before re-entering the exam flow', () => {
  const source = read('src/router/index.js');

  assert.match(source, /loadPublicSubmissionReport/);
  assert.match(source, /const reportToken = typeof to\.query\.report === 'string' \? to\.query\.report : '';/);
  assert.match(source, /if \(reportToken\) \{/);
});

test('api client exposes a public submission report fetcher', () => {
  const source = read('src/api/client.js');

  assert.match(source, /export function fetchPublicSubmissionReport\(shareCode, reportToken\)/);
  assert.match(source, /request\(`\/public\/papers\/code\/\$\{shareCode\}\/reports\/\$\{reportToken\}`\)/);
});

test('exam store tracks report token state and can hydrate a static report page from the server', () => {
  const source = read('src/store/examStore.js');

  assert.match(source, /reportToken:\s*''/);
  assert.match(source, /async loadPublicSubmissionReport\(shareCode, reportToken\)/);
  assert.match(source, /state\.rewardResult = result\.reward \|\| null/);
  assert.match(source, /state\.sessionStarted = false/);
  assert.match(source, /state\.finishAnimationVisible = false/);
  assert.match(source, /state\.rewardWheelVisible = false/);
});

test('paper view updates the URL to the report token after submit succeeds', () => {
  const source = read('src/views/PaperView.vue');

  assert.match(source, /reportToken/);
  assert.match(source, /window\.history\.replaceState/);
  assert.match(source, /report=\$\{encodeURIComponent\(state\.reportToken\)\}/);
});
