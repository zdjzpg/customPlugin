const test = require('node:test');
const assert = require('node:assert/strict');
const { canEditPaper, getPaperEditBlockedMessage } = require('../src/shared/paperEditPolicy');

test('canEditPaper allows papers with no submissions', () => {
  assert.equal(canEditPaper({ submissionCount: 0 }), true);
  assert.equal(canEditPaper({ submissionCount: 0.4 }), true);
});

test('canEditPaper blocks papers with one or more submissions', () => {
  assert.equal(canEditPaper({ submissionCount: 1 }), false);
  assert.equal(canEditPaper({ submissionCount: 8 }), false);
  assert.equal(getPaperEditBlockedMessage(), '该卷子已经有答题记录，不能再进入编辑页；如需修改，请先复制一份新卷子。');
});
