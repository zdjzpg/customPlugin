const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('audio-driven question views remove buddy chrome and letter-slot labels', () => {
  const listenChooseLetterSource = read('src/components/questions/ListenChooseLetter.vue');
  const listenFollowInstructionSource = read('src/components/questions/ListenFollowInstruction.vue');
  const readAloudSource = read('src/components/questions/ReadAloud.vue');
  const listenAnswerQuestionSource = read('src/components/questions/ListenAnswerQuestion.vue');

  assert.doesNotMatch(listenChooseLetterSource, /<AudioBuddy\b/);
  assert.doesNotMatch(listenChooseLetterSource, /listening-buddy-wrap/);
  assert.doesNotMatch(listenChooseLetterSource, /大写框/);
  assert.doesNotMatch(listenChooseLetterSource, /小写框/);

  assert.doesNotMatch(listenFollowInstructionSource, /<AudioBuddy\b/);
  assert.doesNotMatch(listenFollowInstructionSource, /listening-buddy-wrap/);

  assert.doesNotMatch(readAloudSource, /<AudioBuddy\b/);
  assert.doesNotMatch(listenAnswerQuestionSource, /<AudioBuddy\b/);
});
