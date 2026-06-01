const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createListenChooseImageChoices,
  ensureListenChooseImageDraft,
  normalizeListenChooseImageQuestion
} = require('../src/shared/listenChooseImage');

test('createListenChooseImageChoices builds three default option rows', () => {
  const choices = createListenChooseImageChoices(() => 'fixed_id');

  assert.equal(choices.length, 3);
  assert.deepEqual(choices.map((choice) => choice.word), ['cat', 'dog', 'rabbit']);
});

test('ensureListenChooseImageDraft upgrades legacy word text to editable choices', () => {
  let id = 0;
  const draft = ensureListenChooseImageDraft(
    {
      type: 'listen_choose_image',
      wordsText: 'cat, dog, rabbit',
      answer: 'dog'
    },
    () => `choice_${++id}`
  );

  assert.equal(draft.choices.length, 3);
  assert.equal(draft.correctChoiceId, 'choice_2');
  assert.equal(draft.choices[1].word, 'dog');
});

test('normalizeListenChooseImageQuestion keeps choice ids and derives the answer word', () => {
  const question = normalizeListenChooseImageQuestion({
    id: 'q1',
    type: 'listen_choose_image',
    score: 10,
    prompt: '听一听，点出正确图片。',
    choices: [
      { id: 'c1', imageUrl: 'cat.png', word: 'cat' },
      { id: 'c2', imageUrl: 'dog.png', word: 'dog' },
      { id: 'c3', imageUrl: 'rabbit.png', word: 'rabbit' }
    ],
    correctChoiceId: 'c2'
  });

  assert.equal(question.correctChoiceId, 'c2');
  assert.equal(question.answerWord, 'dog');
  assert.equal(question.answer, 'dog');
  assert.equal(question.choices[1].imageUrl, 'dog.png');
});
