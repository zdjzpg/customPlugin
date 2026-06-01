const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('teacher paper editor exposes difficulty selector and header badge', () => {
  const source = read('src/views/NewPaperView.vue');
  assert.match(source, /questionDifficultyOptions/, 'expected teacher editor to define difficulty options');
  assert.match(source, /questionDifficultyLabel\(question\)/, 'expected teacher editor to render a difficulty label');
});

test('student answer page exposes current question difficulty badge', () => {
  const source = read('src/views/PaperView.vue');
  assert.match(source, /currentQuestionDifficultyLabel/, 'expected PaperView to compute difficulty label');
  assert.match(source, /question-difficulty-tag/, 'expected PaperView to render difficulty badge');
});

test('paper repository persists difficulty with question content', () => {
  const source = read('server/paperRepository.js');
  assert.match(source, /normalizeQuestionDifficulty/, 'expected repository to normalize question difficulty');
  assert.match(source, /difficulty:\s*normalizeQuestionDifficulty\(question\.difficulty\)/, 'expected repository to save difficulty into content json');
});
