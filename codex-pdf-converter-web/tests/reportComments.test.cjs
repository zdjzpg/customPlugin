const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createDefaultReportCommentConfig,
  formatReportCommentsInline,
  normalizeReportCommentConfig,
  resolveReportComments
} = require('../src/shared/reportComments');

test('createDefaultReportCommentConfig creates the three-part structure', () => {
  const config = createDefaultReportCommentConfig();

  assert.equal(typeof config.opening, 'string');
  assert.equal(typeof config.closing, 'string');
  assert.equal(Array.isArray(config.bands), true);
});

test('normalizeReportCommentConfig keeps only non-empty middle comments sorted by threshold', () => {
  const config = normalizeReportCommentConfig({
    opening: 'opening',
    closing: 'closing',
    bands: [
      { id: 'b1', minScore: 60, text: 'pass' },
      { id: 'b2', minScore: 90, text: 'great' },
      { id: 'b3', minScore: 30, text: '' }
    ]
  });

  assert.deepEqual(config.bands.map((item) => item.id), ['b2', 'b1']);
});

test('resolveReportComments picks the highest matching middle comment by score', () => {
  const result = resolveReportComments({
    opening: 'opening',
    closing: 'closing',
    bands: [
      { id: 'b1', minScore: 90, text: 'great' },
      { id: 'b2', minScore: 60, text: 'good' }
    ]
  }, 75);

  assert.equal(result.opening, 'opening');
  assert.equal(result.middle, 'good');
  assert.equal(result.closing, 'closing');
});

test('formatReportCommentsInline joins non-empty comments with semicolons on one line', () => {
  const text = formatReportCommentsInline({
    opening: 'continue',
    middle: 'score 60',
    closing: 'nice job'
  });

  assert.equal(text, 'continue; score 60; nice job');
});
