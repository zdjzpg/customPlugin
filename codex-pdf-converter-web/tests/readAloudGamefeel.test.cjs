const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('read aloud question removes in-question score display and emphasizes phrase + record controls only', () => {
  const componentSource = read('src/components/questions/ReadAloud.vue');
  const stylesSource = read('src/styles.css');

  assert.doesNotMatch(componentSource, /score-ring/);
  assert.doesNotMatch(componentSource, /识别文本/);
  assert.doesNotMatch(componentSource, /使用演示结果/);
  assert.match(componentSource, /read-word-card/);
  assert.match(componentSource, /read-phrase-pop/);
  assert.match(componentSource, /read-start-btn/);
  assert.match(componentSource, /结束录音/);

  assert.match(stylesSource, /\.read-word-card\s*\{/);
  assert.match(stylesSource, /\.read-phrase-pop\s*\{/);
  assert.match(stylesSource, /\.read-start-btn\s*\{/);
});

test('speech-answer question hides in-question score and transcript and lets the learner stop recording manually', () => {
  const componentSource = read('src/components/questions/ListenAnswerQuestion.vue');

  assert.doesNotMatch(componentSource, /score-ring/);
  assert.doesNotMatch(componentSource, /识别文本/);
  assert.doesNotMatch(componentSource, /使用演示回答/);
  assert.match(componentSource, /结束录音/);
});

test('image reading question hides in-question score and transcript and lets the learner stop recording manually', () => {
  const componentSource = read('src/components/questions/ReadSentenceWithImage.vue');

  assert.doesNotMatch(componentSource, /score-ring/);
  assert.doesNotMatch(componentSource, /识别文本/);
  assert.doesNotMatch(componentSource, /使用演示评分/);
  assert.match(componentSource, /结束录音/);
});
