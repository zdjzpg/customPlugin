const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createDefaultReportCommentConfig,
  validateReportCommentConfig
} = require('../src/shared/reportComments');

test('default report comment config passes validation', () => {
  const result = validateReportCommentConfig(createDefaultReportCommentConfig());

  assert.equal(result.isValid, true);
});

test('report comment config rejects duplicate minScore bands', () => {
  const result = validateReportCommentConfig({
    opening: '',
    closing: '',
    bands: [
      { id: 'comment_1', minScore: 60, text: '综合能力60分' },
      { id: 'comment_2', minScore: 60, text: '另一条60分评语' }
    ]
  });

  assert.equal(result.isValid, false);
  assert.match(result.message, /重复|分数段/);
});
