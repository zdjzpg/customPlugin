const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const difficulty = require('../src/shared/questionDifficulty');

const contentSource = fs.readFileSync(path.join(__dirname, '../src/utils/content.js'), 'utf8');

const {
  DEFAULT_QUESTION_DIFFICULTY,
  QUESTION_DIFFICULTY_META,
  normalizeQuestionDifficulty,
  getQuestionDifficultyLabel
} = difficulty;

test('question difficulty normalizes missing and invalid values to beginner', () => {
  assert.equal(DEFAULT_QUESTION_DIFFICULTY, 'beginner');
  assert.equal(normalizeQuestionDifficulty(''), 'beginner');
  assert.equal(normalizeQuestionDifficulty('unknown'), 'beginner');
  assert.equal(normalizeQuestionDifficulty('advanced'), 'advanced');
});

test('question difficulty labels expose beginner intermediate and advanced in Chinese', () => {
  assert.equal(QUESTION_DIFFICULTY_META.beginner.label, '\u521d\u7ea7');
  assert.equal(QUESTION_DIFFICULTY_META.intermediate.label, '\u4e2d\u7ea7');
  assert.equal(QUESTION_DIFFICULTY_META.advanced.label, '\u9ad8\u7ea7');
  assert.equal(getQuestionDifficultyLabel('beginner'), '\u521d\u7ea7');
});

test('question defaults and normalization apply beginner difficulty through shared helper', () => {
  assert.match(contentSource, /difficulty:\s*normalizeQuestionDifficulty\(question\.difficulty\)/, 'expected normalized questions to carry difficulty');
});
