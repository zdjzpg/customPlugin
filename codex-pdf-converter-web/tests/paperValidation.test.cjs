const test = require('node:test');
const assert = require('node:assert/strict');
const { getPaperScoreSummary } = require('../src/shared/paperValidation');

test('getPaperScoreSummary marks total 100 as valid', () => {
  const summary = getPaperScoreSummary([{ score: 40 }, { score: 60 }]);
  assert.equal(summary.total, 100);
  assert.equal(summary.isValid, true);
  assert.equal(summary.message, '');
});

test('getPaperScoreSummary reports when total is below 100', () => {
  const summary = getPaperScoreSummary([{ score: 30 }, { score: 60 }]);
  assert.equal(summary.total, 90);
  assert.equal(summary.isValid, false);
  assert.equal(summary.message, '卷子总分必须等于 100 分，当前还差 10 分。');
});

test('getPaperScoreSummary reports when total is above 100', () => {
  const summary = getPaperScoreSummary([{ score: 70 }, { score: 50 }]);
  assert.equal(summary.total, 120);
  assert.equal(summary.isValid, false);
  assert.equal(summary.message, '卷子总分必须等于 100 分，当前超出 20 分。');
});
