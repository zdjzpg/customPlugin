const QUESTION_TYPE_LABELS = {
  listen_choose_image: '听音选图',
  listen_follow_instruction: '听音做指令',
  look_choose_word: '看图选词',
  sentence_sort: '拖拽组句',
  read_aloud: '跟读练习',
  spell_blank: '拼写填空',
  listen_answer_question: '听题口答',
  listen_choose_letter: '听音选字母',
  read_sentence_with_image: '图文跟读',
  match_image_word: '图片连线'
};

function getQuestionTypeLabel(type = '') {
  return QUESTION_TYPE_LABELS[type] || type || '未知题型';
}

module.exports = {
  QUESTION_TYPE_LABELS,
  getQuestionTypeLabel
};
