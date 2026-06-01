const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSubmissionReportSnapshot } = require('../src/shared/submissionReportSnapshot');

test('buildSubmissionReportSnapshot falls back to the current paper comment config when the stored submission lacks comments', () => {
  const snapshot = buildSubmissionReportSnapshot({
    submission: {
      student: { name: 'Tom' },
      report: { total: 70, totalPossible: 100, percent: 70, comments: {} },
      records: []
    },
    paper: {
      questions: [{}, {}, {}],
      commentConfig: {
        opening: 'continue',
        closing: 'nice job',
        bands: [
          { id: 'b1', minScore: 60, text: 'good effort' }
        ]
      }
    }
  });

  assert.equal(snapshot.report.comments.opening, 'continue');
  assert.equal(snapshot.report.comments.middle, 'good effort');
  assert.equal(snapshot.report.comments.closing, 'nice job');
  assert.equal(snapshot.questionCount, 3);
});

test('buildSubmissionReportSnapshot rebuilds ability items from records when the stored submission lacks them', () => {
  const snapshot = buildSubmissionReportSnapshot({
    submission: {
      student: { name: 'Tom' },
      report: { total: 70, totalPossible: 100, percent: 70, abilityItems: [], abilityMap: {} },
      records: [
        { gained: 10, total: 20, meta: { type: 'listen_choose_letter' } },
        { gained: 20, total: 20, meta: { type: 'spell_blank' } }
      ]
    },
    paper: { questions: [{}, {}], commentConfig: {} }
  });

  assert.equal(snapshot.report.abilityItems.length >= 2, true);
  assert.equal(snapshot.report.abilityItems.every((item) => Number(item.total) > 0), true);
});
