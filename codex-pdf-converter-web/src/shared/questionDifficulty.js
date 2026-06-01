const DEFAULT_QUESTION_DIFFICULTY = 'beginner';

const QUESTION_DIFFICULTY_META = {
  beginner: {
    value: 'beginner',
    label: '\u521d\u7ea7',
    color: 'green'
  },
  intermediate: {
    value: 'intermediate',
    label: '\u4e2d\u7ea7',
    color: 'orange'
  },
  advanced: {
    value: 'advanced',
    label: '\u9ad8\u7ea7',
    color: 'red'
  }
};

const QUESTION_DIFFICULTY_OPTIONS = Object.values(QUESTION_DIFFICULTY_META).map((item) => ({
  value: item.value,
  label: item.label
}));

function normalizeQuestionDifficulty(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return QUESTION_DIFFICULTY_META[normalized] ? normalized : DEFAULT_QUESTION_DIFFICULTY;
}

function getQuestionDifficultyLabel(value) {
  return QUESTION_DIFFICULTY_META[normalizeQuestionDifficulty(value)].label;
}

function getQuestionDifficultyColor(value) {
  return QUESTION_DIFFICULTY_META[normalizeQuestionDifficulty(value)].color;
}

module.exports = {
  DEFAULT_QUESTION_DIFFICULTY,
  QUESTION_DIFFICULTY_META,
  QUESTION_DIFFICULTY_OPTIONS,
  normalizeQuestionDifficulty,
  getQuestionDifficultyLabel,
  getQuestionDifficultyColor
};
