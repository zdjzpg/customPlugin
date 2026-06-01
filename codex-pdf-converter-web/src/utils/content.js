import demoFollowInstructionBoy from '../assets/follow-instruction-boy.png';
import followInstructionUtils from '../shared/followInstruction';
import listenChooseImageUtils from '../shared/listenChooseImage';
import lookChooseWordUtils from '../shared/lookChooseWord';
import questionAbilitiesUtils from '../shared/questionAbilities';
import questionDifficultyUtils from '../shared/questionDifficulty';
import questionTypeSupport from '../shared/questionTypeSupport';
import reportCommentsUtils from '../shared/reportComments';
import studentExperienceUtils from '../shared/studentExperience';

const {
  DEFAULT_DRAGGABLE_OBJECT,
  SAMPLE_INSTRUCTION_IMAGE,
  normalizeInstructionQuestion
} = followInstructionUtils;
const {
  createListenChooseImageChoices,
  normalizeListenChooseImageQuestion
} = listenChooseImageUtils;
const {
  createLookChooseWordChoices,
  normalizeLookChooseWordQuestion
} = lookChooseWordUtils;
const {
  getDefaultAbilitiesForType,
  normalizeQuestionAbilities
} = questionAbilitiesUtils;
const { normalizeQuestionDifficulty } = questionDifficultyUtils;
const { createDefaultReportCommentConfig } = reportCommentsUtils;
const {
  getNewQuestionTypeDefaults,
  normalizeNewQuestionType
} = questionTypeSupport;
const { createDefaultRewardConfig } = studentExperienceUtils;

export const TYPE_META = {
  listen_choose_image: { label: '听音选图', icon: '🔊', ability: '听' },
  listen_follow_instruction: { label: '听音做指令', icon: '🎯', ability: '听' },
  look_choose_word: { label: '看图选词', icon: '🖼️', ability: '读' },
  sentence_sort: { label: '拖拽组句', icon: '🧩', ability: '读' },
  read_aloud: { label: '跟读练习', icon: '🎙️', ability: '说' },
  spell_blank: { label: '拼写填空', icon: '✍️', ability: '写' },
  listen_answer_question: { label: '听题口答', icon: '🗣️', ability: '说' },
  listen_choose_letter: { label: '听音选字母', icon: '🔠', ability: '听' },
  read_sentence_with_image: { label: '图文跟读', icon: '🖼️', ability: '说' },
  match_image_word: { label: '图片连线', icon: '🧷', ability: '读' }
};

export const INSTRUCTION_IMAGE_MAP = {
  [SAMPLE_INSTRUCTION_IMAGE]: demoFollowInstructionBoy
};

export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function wordsFromText(text) {
  return (text || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function sentenceWords(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean);
}

export function shuffle(list) {
  const copy = list.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function safeWord(word) {
  return (word || '').trim().toLowerCase();
}

export function resolveInstructionImage(imageUrl) {
  const key = (imageUrl || '').trim();
  return INSTRUCTION_IMAGE_MAP[key] || key;
}

export function encodeConfig(config) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(config))));
}

export function decodeConfig(value) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(value))));
  } catch (error) {
    return null;
  }
}

export function buildWaveBars() {
  return Array.from({ length: 18 }, (_, index) => ({
    index,
    height: 28 + Math.round(Math.random() * 62)
  }));
}

export function defaultConfig() {
  return {
    examTitle: '',
    themeNote: '',
    welcomeSpeech: '',
    rewardConfig: createDefaultRewardConfig(),
    commentConfig: createDefaultReportCommentConfig(),
    questions: []
  };
}

function withAbilities(question, normalized) {
  return {
    ...normalized,
    abilities: normalizeQuestionAbilities(question.abilities, getDefaultAbilitiesForType(question.type)),
    difficulty: normalizeQuestionDifficulty(question.difficulty)
  };
}

export function getQuestionDefaults(type) {
  if (type === 'listen_choose_image') {
    const choices = createListenChooseImageChoices(() => uid('choice'));
    return withAbilities({ type }, {
      id: uid('q'),
      type,
      score: 10,
      prompt: '听一听，点出正确图片。',
      choices,
      correctChoiceId: choices[0]?.id || ''
    });
  }
  if (type === 'listen_follow_instruction') {
    return withAbilities({ type }, {
      id: uid('q'),
      type,
      score: 10,
      prompt: '听一听，拖动物品完成指令。',
      instructionText: 'Touch your eyes',
      imageUrl: '',
      mode: 'drag_place',
      draggableObject: { ...DEFAULT_DRAGGABLE_OBJECT },
      autoPlay: true,
      correctTargetId: '',
      targets: []
    });
  }
  if (type === 'look_choose_word') {
    const choices = createLookChooseWordChoices(() => uid('choice'));
    return withAbilities({ type }, {
      id: uid('q'),
      type,
      score: 10,
      prompt: '看看图片，选出正确单词。',
      imageUrl: '',
      choices,
      correctChoiceId: choices[0]?.id || ''
    });
  }
  if (type === 'sentence_sort') {
    return withAbilities({ type }, { id: uid('q'), type, score: 15, prompt: '拖动单词组成句子。', sentence: 'I like apples' });
  }
  if (type === 'read_aloud') {
    return withAbilities({ type }, { id: uid('q'), type, score: 20, prompt: '请跟着读出内容。', phrase: 'banana', mascotWord: 'banana' });
  }
  if (type === 'listen_answer_question' || type === 'listen_choose_letter' || type === 'read_sentence_with_image' || type === 'match_image_word') {
    return withAbilities({ type }, { id: uid('q'), ...getNewQuestionTypeDefaults(type) });
  }
  return withAbilities({ type }, { id: uid('q'), type, score: 15, prompt: '把单词补完整。', answerWord: 'schoolbag', blankIndexesText: '2,4' });
}

export function normalizeQuestion(question) {
  if (question.type === 'listen_choose_image') {
    return withAbilities(question, normalizeListenChooseImageQuestion(question, () => uid('choice')));
  }
  if (question.type === 'listen_follow_instruction') {
    return withAbilities(question, normalizeInstructionQuestion(question));
  }
  if (question.type === 'look_choose_word') {
    return withAbilities(question, normalizeLookChooseWordQuestion(question, () => uid('choice')));
  }
  if (question.type === 'sentence_sort') {
    const tokens = sentenceWords(question.sentence);
    return withAbilities(question, {
      id: question.id,
      type: question.type,
      score: Number(question.score) || 0,
      prompt: question.prompt,
      sentence: question.sentence,
      tokens,
      shuffledTokens: shuffle(tokens)
    });
  }
  if (question.type === 'read_aloud') {
    return withAbilities(question, {
      id: question.id,
      type: question.type,
      score: Number(question.score) || 0,
      prompt: question.prompt,
      phrase: question.phrase,
      mascotWord: question.mascotWord || question.phrase
    });
  }
  if (question.type === 'listen_answer_question' || question.type === 'listen_choose_letter' || question.type === 'read_sentence_with_image' || question.type === 'match_image_word') {
    const normalized = normalizeNewQuestionType(question);
    if (normalized?.type === 'listen_choose_letter') {
      return withAbilities(question, {
        ...normalized,
        displayOptions: shuffle(normalized.options)
      });
    }
    return withAbilities(question, normalized);
  }
  return withAbilities(question, {
    id: question.id,
    type: question.type,
    score: Number(question.score) || 0,
    prompt: question.prompt,
    answerWord: (question.answerWord || '').trim(),
    blankIndexes: wordsFromText(question.blankIndexesText).map(Number).filter((item) => !Number.isNaN(item) && item >= 0)
  });
}
