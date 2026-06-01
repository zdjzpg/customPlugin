function getSubmissionCount(value) {
  return Number(value?.submissionCount || 0);
}

function canEditPaper(paper = {}) {
  return getSubmissionCount(paper) < 1;
}

function getPaperEditBlockedMessage() {
  return '该卷子已经有答题记录，不能再进入编辑页；如需修改，请先复制一份新卷子。';
}

module.exports = {
  canEditPaper,
  getPaperEditBlockedMessage
};
