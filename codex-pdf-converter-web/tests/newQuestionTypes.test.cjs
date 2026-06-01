const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getNewQuestionTypeDefaults,
  normalizeNewQuestionType,
  evaluateNewQuestionAnswer
} = require('../src/shared/questionTypeSupport');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('getNewQuestionTypeDefaults returns keyword-based spoken question defaults', () => {
  const question = getNewQuestionTypeDefaults('listen_answer_question');

  assert.equal(question.type, 'listen_answer_question');
  assert.equal(question.answerKeywordsText, 'apple, red apple');
  assert.equal(question.minMatchCount, 1);
  assert.equal(question.autoPlay, true);
});

test('normalizeNewQuestionType prepares upper and lower case targets for letter selection', () => {
  const question = normalizeNewQuestionType({
    id: 'q1',
    type: 'listen_choose_letter',
    score: 10,
    prompt: '听音选字母',
    targetLetter: 'a',
    candidateLettersText: 'a, b, c, d',
    requireBothCases: true,
    autoPlay: true
  });

  assert.deepEqual(question.targetLetters, ['A', 'a']);
  assert.deepEqual(question.options, ['A', 'a', 'B', 'b', 'C', 'c', 'D', 'd']);
});

test('evaluateNewQuestionAnswer matches spoken answers by keywords', () => {
  const result = evaluateNewQuestionAnswer(
    {
      type: 'listen_answer_question',
      score: 15,
      answerKeywords: ['rabbit', 'bunny'],
      minMatchCount: 1,
      questionText: 'What animal is it?'
    },
    {
      transcript: 'It is a little rabbit'
    }
  );

  assert.equal(result.gained, 15);
  assert.equal(result.studentText, 'It is a little rabbit');
  assert.match(result.correctText, /rabbit/);
});

test('evaluateNewQuestionAnswer enforces both-case letter matching when enabled', () => {
  const result = evaluateNewQuestionAnswer(
    {
      type: 'listen_choose_letter',
      score: 10,
      targetLetter: 'a',
      requireBothCases: true,
      targetLetters: ['A', 'a']
    },
    {
      selectedLetters: ['A']
    }
  );

  assert.equal(result.gained, 0);
  assert.equal(result.studentText, 'A');
  assert.equal(result.correctText, 'A + a');
});

test('evaluateNewQuestionAnswer scores image-word matching by number of correct pairs', () => {
  const result = evaluateNewQuestionAnswer(
    {
      type: 'match_image_word',
      score: 20,
      pairs: [
        { id: 'p1', imageUrl: 'apple.png', word: 'apple' },
        { id: 'p2', imageUrl: 'pear.png', word: 'pear' }
      ]
    },
    {
      matches: {
        p1: 'apple',
        p2: 'orange'
      }
    }
  );

  assert.equal(result.gained, 10);
  assert.match(result.studentText, /apple/);
  assert.match(result.correctText, /pear/);
});

test('new paper editor keeps 图文跟读 visible in the add-question palette', () => {
  const source = read('src/views/NewPaperView.vue');

  assert.doesNotMatch(source, /HIDDEN_QUESTION_TYPES = \[[^\]]*read_sentence_with_image/);
  assert.match(source, /question\.type === 'read_sentence_with_image'/);
});
