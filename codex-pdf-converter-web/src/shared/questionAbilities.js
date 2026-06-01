const REPORT_ABILITIES = ['听', '说', '读'];

const TYPE_ABILITY_DEFAULTS = {
  listen_choose_image: ['听'],
  listen_follow_instruction: ['听'],
  look_choose_word: ['读'],
  sentence_sort: ['读'],
  read_aloud: ['说'],
  spell_blank: ['读'],
  listen_answer_question: ['说'],
  listen_choose_letter: ['听'],
  read_sentence_with_image: ['说'],
  match_image_word: ['读']
};

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function getDefaultAbilitiesForType(type) {
  return TYPE_ABILITY_DEFAULTS[type] ? [...TYPE_ABILITY_DEFAULTS[type]] : ['读'];
}

function normalizeQuestionAbilities(value, fallback = ['读']) {
  const normalized = unique(
    (Array.isArray(value) ? value : [value])
      .map((item) => String(item || '').trim())
      .filter((item) => REPORT_ABILITIES.includes(item))
  );

  if (normalized.length) {
    return normalized.slice(0, 2);
  }

  const fallbackList = unique(
    (Array.isArray(fallback) ? fallback : [fallback])
      .map((item) => String(item || '').trim())
      .filter((item) => REPORT_ABILITIES.includes(item))
  );

  return (fallbackList.length ? fallbackList : ['读']).slice(0, 2);
}

module.exports = {
  REPORT_ABILITIES,
  getDefaultAbilitiesForType,
  normalizeQuestionAbilities
};
