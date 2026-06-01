const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REPORT_ABILITIES,
  getDefaultAbilitiesForType,
  normalizeQuestionAbilities
} = require('../src/shared/questionAbilities');

test('report abilities are limited to listening speaking and reading', () => {
  assert.deepEqual(REPORT_ABILITIES, ['听', '说', '读']);
});

test('normalizeQuestionAbilities keeps only supported unique abilities', () => {
  const abilities = normalizeQuestionAbilities(['听', '说', '听', '写'], ['读']);

  assert.deepEqual(abilities, ['听', '说']);
});

test('getDefaultAbilitiesForType falls back to reading for unsupported legacy write type', () => {
  assert.deepEqual(getDefaultAbilitiesForType('spell_blank'), ['读']);
});
