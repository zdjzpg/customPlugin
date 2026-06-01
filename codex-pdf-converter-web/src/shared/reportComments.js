function uniqueId() {
  return `comment_${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultReportCommentConfig() {
  return {
    opening: '',
    closing: '',
    bands: [
      { id: uniqueId(), minScore: 90, text: '' },
      { id: uniqueId(), minScore: 60, text: '' }
    ]
  };
}

function validateReportCommentConfig(config = {}) {
  const bands = Array.isArray(config.bands) ? config.bands : [];
  const seen = new Set();

  for (const item of bands) {
    const minScore = Math.max(0, Number(item?.minScore || 0));
    if (seen.has(minScore)) {
      return {
        isValid: false,
        message: `报告评语的分数段不能重复，${minScore} 分已被设置过。`
      };
    }
    seen.add(minScore);
  }

  return {
    isValid: true,
    message: ''
  };
}

function normalizeReportCommentConfig(config = {}) {
  return {
    opening: String(config.opening || '').trim(),
    closing: String(config.closing || '').trim(),
    bands: (Array.isArray(config.bands) ? config.bands : [])
      .map((item, index) => ({
        id: item.id || `comment_${index + 1}`,
        minScore: Math.max(0, Number(item.minScore || 0)),
        text: String(item.text || '').trim()
      }))
      .filter((item) => item.text)
      .sort((left, right) => right.minScore - left.minScore)
  };
}

function resolveReportComments(config, totalScore) {
  const normalized = normalizeReportCommentConfig(config);
  const score = Number(totalScore || 0);
  const matched = normalized.bands.find((item) => score >= item.minScore) || null;

  return {
    opening: normalized.opening,
    middle: matched?.text || '',
    closing: normalized.closing
  };
}

function formatReportCommentsInline(comments = {}) {
  return [
    String(comments.opening || '').trim(),
    String(comments.middle || '').trim(),
    String(comments.closing || '').trim()
  ].filter(Boolean).join('; ');
}

module.exports = {
  createDefaultReportCommentConfig,
  formatReportCommentsInline,
  normalizeReportCommentConfig,
  resolveReportComments,
  validateReportCommentConfig
};
