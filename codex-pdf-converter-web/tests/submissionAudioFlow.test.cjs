const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('client exposes a dedicated answer-audio upload API helper', () => {
  const source = read('src/api/client.js');

  assert.match(source, /export async function uploadAnswerAudio\(/);
  assert.match(source, /\/uploads\/answer-audio/);
});

test('exam store captures microphone audio and uploads it before final submission', () => {
  const source = read('src/store/examStore.js');
  const readAloudSource = read('src/components/questions/ReadAloud.vue');

  assert.match(source, /MediaRecorder/);
  assert.match(source, /prewarmAnswerAudioRecorder/);
  assert.match(source, /playRecordingStartCue/);
  assert.match(source, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(source, /await startAnswerAudioRecording/);
  assert.match(source, /isPreparingMic/);
  assert.match(source, /audioUi\.isRecording = true/);
  assert.match(source, /AudioContext|webkitAudioContext/);
  assert.match(source, /maxLevel/);
  assert.match(source, /showStudentNotice\(/);
  assert.match(source, /uploadAnswerAudio/);
  assert.match(source, /audioPath/);
  assert.match(readAloudSource, /:disabled="audioState\.isPreparingMic"/);
});

test('exam store keeps the student in a generating-report state until the backend returns the final report', () => {
  const source = read('src/store/examStore.js');
  const viewSource = read('src/views/PaperView.vue');

  assert.match(source, /reportGeneratingVisible/);
  assert.match(source, /submission\.report/);
  assert.match(source, /state\.reportGeneratingVisible = true/);
  assert.match(source, /state\.reportGeneratingVisible = false/);
  assert.match(viewSource, /ReportGeneratingOverlay/);
});

test('microphone warnings use a playful in-app bubble instead of browser alerts', () => {
  const source = read('src/store/examStore.js');
  const viewSource = read('src/views/PaperView.vue');

  assert.match(source, /studentNotice/);
  assert.match(source, /showStudentNotice\(/);
  assert.match(source, /closeStudentNotice\(/);
  assert.doesNotMatch(source, /window\.alert\(/);
  assert.match(viewSource, /StudentNoticeBubble/);
  assert.match(viewSource, /StudentNoticeBubble/);
});

test('speech recognition fallback does not alert and directly records a full score', () => {
  const source = read('src/store/examStore.js');

  assert.match(source, /recognition\.onerror = \(\) => \{/);
  assert.match(source, /answer\.autoScore = 100/);
  assert.match(source, /flashScored\(questionId\)/);
  assert.doesNotMatch(source, /window\.alert\('璇煶璇嗗埆澶辫触/);
});

test('server exposes upload storage and persists recording metadata with submission answers', () => {
  const indexSource = read('server/index.js');
  const repositorySource = read('server/paperRepository.js');

  assert.match(indexSource, /\/api\/uploads\/answer-audio/);
  assert.match(indexSource, /app\.use\('\/api\/uploads'/);
  assert.match(repositorySource, /audioPath/);
  assert.match(repositorySource, /audioMimeType/);
  assert.match(repositorySource, /\/api\/uploads\//);
});

test('answer records use Chinese type labels and render inline audio playback controls', () => {
  const viewSource = read('src/views/AllAnswersView.vue');
  const metaSource = read('src/shared/questionTypeMeta.js');

  assert.match(metaSource, /listen_choose_image:\s*'听音选图'/);
  assert.match(metaSource, /read_aloud:\s*'跟读练习'/);
  assert.match(metaSource, /listen_answer_question:\s*'听题口答'/);
  assert.match(viewSource, /admin-answer-audio/);
  assert.match(viewSource, /createElementVNode|h\(/);
});
