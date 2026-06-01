function getPaperScoreSummary(questions = []) {
  const total = questions.reduce((sum, item) => sum + Number(item.score || 0), 0);
  if (total === 100) {
    return { total, isValid: true, message: '' };
  }
  const diff = Math.abs(total - 100);
  return {
    total,
    isValid: false,
    message: total < 100
      ? `卷子总分必须等于 100 分，当前还差 ${diff} 分。`
      : `卷子总分必须等于 100 分，当前超出 ${diff} 分。`
  };
}

module.exports = {
  getPaperScoreSummary
};
