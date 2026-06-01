function defaultId() {
  return `choice_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeWord(value) {
  return String(value || '').trim().toLowerCase();
}

function splitCsv(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createListenChooseImageChoices(makeId = defaultId) {
  return ['cat', 'dog', 'rabbit'].map((word) => ({
    id: makeId(),
    imageUrl: '',
    word
  }));
}

function normalizeDraftChoices(question, makeId = defaultId) {
  if (Array.isArray(question.choices) && question.choices.length) {
    return question.choices.map((choice) => ({
      id: choice.id || makeId(),
      imageUrl: String(choice.imageUrl || '').trim(),
      word: String(choice.word || '').trim()
    }));
  }

  const legacyWords = splitCsv(question.wordsText);
  if (legacyWords.length) {
    return legacyWords.map((word) => ({
      id: makeId(),
      imageUrl: '',
      word
    }));
  }

  return createListenChooseImageChoices(makeId);
}

function resolveCorrectChoiceId(choices, correctChoiceId, answerWord) {
  if (correctChoiceId && choices.some((choice) => choice.id === correctChoiceId)) {
    return correctChoiceId;
  }

  const normalizedAnswer = normalizeWord(answerWord);
  if (normalizedAnswer) {
    const matchedChoice = choices.find((choice) => normalizeWord(choice.word) === normalizedAnswer);
    if (matchedChoice) {
      return matchedChoice.id;
    }
  }

  return choices[0]?.id || '';
}

function ensureListenChooseImageDraft(question, makeId = defaultId) {
  const choices = normalizeDraftChoices(question, makeId);
  const correctChoiceId = resolveCorrectChoiceId(choices, question.correctChoiceId, question.answer);

  return {
    ...question,
    choices,
    correctChoiceId
  };
}

function normalizeListenChooseImageQuestion(question, makeId = defaultId) {
  const draft = ensureListenChooseImageDraft(question, makeId);
  const choices = draft.choices.filter((choice) => choice.word);
  const correctChoiceId = resolveCorrectChoiceId(choices, draft.correctChoiceId, question.answer);
  const correctChoice = choices.find((choice) => choice.id === correctChoiceId) || null;

  return {
    id: question.id,
    type: question.type,
    score: Number(question.score) || 0,
    prompt: question.prompt || '',
    choices,
    correctChoiceId,
    answerWord: correctChoice?.word || '',
    answer: correctChoice?.word || ''
  };
}

module.exports = {
  createListenChooseImageChoices,
  ensureListenChooseImageDraft,
  normalizeListenChooseImageQuestion
};
