const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('paper repository persists listen choose image questions as choice lists', () => {
  const source = read('server/paperRepository.js');

  assert.match(source, /choices:\s*Array\.isArray\(question\.choices\)/);
  assert.match(source, /correctChoiceId:\s*question\.correctChoiceId \|\| ''/);
  assert.doesNotMatch(source, /wordsText:\s*question\.wordsText \|\| ''/);
});

test('paper repository persists look choose word target image url', () => {
  const source = read('server/paperRepository.js');
  const start = source.indexOf("if (question.type === 'look_choose_word') {");
  const end = source.indexOf("if (question.type === 'sentence_sort') {");
  const block = source.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.match(block, /imageUrl:\s*question\.imageUrl \|\| ''/);
});

test('paper repository persists follow instruction drag mode fields', () => {
  const source = read('server/paperRepository.js');
  const start = source.indexOf("if (question.type === 'listen_follow_instruction') {");
  const end = source.indexOf("if (question.type === 'look_choose_word') {");
  const block = source.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.match(block, /mode:\s*question\.mode \|\| 'tap'/);
  assert.match(block, /draggableObject:\s*question\.draggableObject \|\| \{\}/);
});
