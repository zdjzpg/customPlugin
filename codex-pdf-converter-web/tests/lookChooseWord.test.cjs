const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createLookChooseWordChoices,
  ensureLookChooseWordDraft,
  normalizeLookChooseWordQuestion
} = require('../src/shared/lookChooseWord');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('createLookChooseWordChoices builds three default word-only rows', () => {
  const choices = createLookChooseWordChoices(() => 'fixed_choice');

  assert.equal(choices.length, 3);
  assert.deepEqual(choices.map((choice) => choice.word), ['apple', 'banana', 'orange']);
  assert.ok(choices.every((choice) => !Object.hasOwn(choice, 'imageUrl')));
});

test('ensureLookChooseWordDraft keeps a single uploaded image and resolves the correct text option', () => {
  const draft = ensureLookChooseWordDraft({
    type: 'look_choose_word',
    imageUrl: 'pear.png',
    choices: [
      { id: 'choice_1', word: 'apple' },
      { id: 'choice_2', word: 'banana' },
      { id: 'choice_3', word: 'pear' }
    ],
    correctChoiceId: 'choice_3'
  });

  assert.equal(draft.imageUrl, 'pear.png');
  assert.equal(draft.choices.length, 3);
  assert.equal(draft.correctChoiceId, 'choice_3');
});

test('normalizeLookChooseWordQuestion exposes the single target image and all option words', () => {
  const question = normalizeLookChooseWordQuestion({
    id: 'q1',
    type: 'look_choose_word',
    score: 10,
    prompt: 'Look at the image and choose the correct word.',
    imageUrl: 'pear.png',
    choices: [
      { id: 'c1', word: 'pear' },
      { id: 'c2', word: 'apple' },
      { id: 'c3', word: 'banana' }
    ],
    correctChoiceId: 'c1'
  });

  assert.equal(question.targetWord, 'pear');
  assert.equal(question.imageUrl, 'pear.png');
  assert.deepEqual(question.options, ['pear', 'apple', 'banana']);
});

test('look-choose-word editor uses one target image uploader plus text options only', () => {
  const editorSource = read('src/components/editors/LookChooseWordEditor.vue');

  assert.match(editorSource, /label="目标图片"/);
  assert.match(editorSource, /question\.imageUrl/);
  assert.doesNotMatch(editorSource, /choice\.imageUrl/);
});

test('look-choose-word student view uses contain-style asset rendering for the target image', () => {
  const viewSource = read('src/components/questions/LookChooseWord.vue');

  assert.match(viewSource, /look-word-image-card/);
  assert.match(viewSource, /question-asset-image/);
  assert.doesNotMatch(viewSource, /class="choice-image"/);
});
