function defaultId() {
  return `choice_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeWord(value) {
  return String(value || '').trim();
}

function createLookChooseWordChoices(makeId = defaultId) {
  return ['apple', 'banana', 'orange'].map((word) => ({
    id: makeId(),
    word
  }));
}

function normalizeDraftChoices(question, makeId = defaultId) {
  if (Array.isArray(question.choices) && question.choices.length) {
    return question.choices
      .map((choice) => ({
        id: choice.id || makeId(),
        word: normalizeWord(choice.word)
      }))
      .filter((choice) => choice.word);
  }

  return createLookChooseWordChoices(makeId);
}

function resolveCorrectChoiceId(choices, correctChoiceId) {
  if (correctChoiceId && choices.some((choice) => choice.id === correctChoiceId)) {
    return correctChoiceId;
  }

  return choices[0]?.id || '';
}

function ensureLookChooseWordDraft(question, makeId = defaultId) {
  const choices = normalizeDraftChoices(question, makeId);
  const correctChoiceId = resolveCorrectChoiceId(choices, question.correctChoiceId);

  return {
    ...question,
    imageUrl: String(question.imageUrl || '').trim(),
    choices,
    correctChoiceId
  };
}

function normalizeLookChooseWordQuestion(question, makeId = defaultId) {
  const draft = ensureLookChooseWordDraft(question, makeId);
  const choices = draft.choices.filter((choice) => choice.word);
  const correctChoiceId = resolveCorrectChoiceId(choices, draft.correctChoiceId);
  const correctChoice = choices.find((choice) => choice.id === correctChoiceId) || null;

  return {
    id: question.id,
    type: question.type,
    score: Number(question.score) || 0,
    prompt: question.prompt || '',
    imageUrl: draft.imageUrl,
    choices,
    correctChoiceId,
    targetWord: correctChoice?.word || '',
    options: choices.map((choice) => choice.word)
  };
}

module.exports = {
  createLookChooseWordChoices,
  ensureLookChooseWordDraft,
  normalizeLookChooseWordQuestion
};
