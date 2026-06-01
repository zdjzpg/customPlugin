const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('paper view uses fit wrappers for single-screen question rendering', () => {
  const source = read('src/views/PaperView.vue');

  assert.match(source, /question-fit-viewport/);
  assert.match(source, /question-fit-content/);
  assert.match(source, /questionScale/);
  assert.match(source, /exam-single-screen/);
});

test('global styles define exam single-screen shell and fit content rules', () => {
  const source = read('src/styles.css');

  assert.match(source, /body\.exam-single-screen/);
  assert.match(source, /\.question-fit-viewport\s*\{[\s\S]*justify-content:\s*flex-start;/);
  assert.match(source, /\.question-fit-content\s*\{[^}]*width:\s*calc\(100%\s*\/\s*var\(--question-fit-scale,\s*1\)\);/);
  assert.match(source, /\.question-fit-content\s*\{[^}]*(flex:\s*0\s+0\s+auto;|flex-shrink:\s*0;)/);
  assert.match(source, /\.question-fit-content\s*\{[^}]*transform-origin:\s*top left;/);
  assert.match(source, /overflow:\s*hidden;/);
});
