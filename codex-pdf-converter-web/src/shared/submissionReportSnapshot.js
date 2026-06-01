const questionAbilitiesUtils = require('./questionAbilities');
const reportAbilitiesUtils = require('./reportAbilities');
const reportCommentsUtils = require('./reportComments');

const { REPORT_ABILITIES, getDefaultAbilitiesForType } = questionAbilitiesUtils;
const { buildWeightedAbilityMap, toAbilityItems } = reportAbilitiesUtils;
const { resolveReportComments } = reportCommentsUtils;

function hasInlineComments(comments = {}) {
  return Boolean(comments.opening || comments.middle || comments.closing);
}

function hasAbilityItems(report = {}) {
  return Array.isArray(report.abilityItems) && report.abilityItems.length > 0;
}

function hasAbilityMap(report = {}) {
  return Boolean(report.abilityMap) && Object.keys(report.abilityMap).length > 0;
}

function normalizeRecordAbilities(record) {
  const explicit = Array.isArray(record.abilities) ? record.abilities.filter(Boolean) : [];
  if (explicit.length) {
    return explicit;
  }
  return getDefaultAbilitiesForType(record.meta?.type || record.type || '');
}

function buildSubmissionReportSnapshot({ submission = {}, paper = {} }) {
  const baseReport = submission.report || {};
  const records = Array.isArray(submission.records) ? submission.records : [];

  const comments = hasInlineComments(baseReport.comments)
    ? baseReport.comments
    : resolveReportComments(paper.commentConfig || {}, Number(baseReport.total || 0));

  let abilityMap = hasAbilityMap(baseReport) ? baseReport.abilityMap : {};
  let abilityItems = hasAbilityItems(baseReport) ? baseReport.abilityItems : [];

  if (!abilityItems.length) {
    if (!Object.keys(abilityMap).length && records.length) {
      const weightedRecords = records.map((record) => ({
        ...record,
        abilities: normalizeRecordAbilities(record)
      }));
      abilityMap = buildWeightedAbilityMap(weightedRecords);
    }
    abilityItems = toAbilityItems(abilityMap, REPORT_ABILITIES);
  }

  return {
    student: submission.student || {},
    reward: submission.reward || null,
    questionCount: Array.isArray(paper.questions) && paper.questions.length ? paper.questions.length : records.length,
    report: {
      ...baseReport,
      comments,
      abilityMap,
      abilityItems
    }
  };
}

module.exports = {
  buildSubmissionReportSnapshot
};
