const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/views/AllAnswersView.vue'), 'utf8');

test('answer detail hides 未识别 when an audio playback bar is available', () => {
  assert.match(
    source,
    /const shouldShowStudentText = record\.studentText !== '未识别' \|\| !record\.audioUrl;/,
    'expected AllAnswersView to suppress 未识别 when audioUrl exists'
  );
  assert.match(
    source,
    /if \(shouldShowStudentText\) \{\s*nodes\.push\(\s*h\('div', \{ class: 'admin-answer-text' \}, record\.studentText \|\| '未作答'\)\s*\)\s*;\s*\}/s,
    'expected student text node to be conditional instead of always rendered'
  );
});
