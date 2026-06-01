const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('exam store routes speech playback through the cached Tencent TTS audio endpoint before falling back', () => {
  const source = read('src/store/examStore.js');

  assert.match(source, /function buildTtsAudioUrl\(text\)/);
  assert.match(source, /new Audio\(buildTtsAudioUrl\(text\)\)/);
  assert.match(source, /playWithBrowserSpeechFallback/);
});

test('server exposes a public tts audio endpoint for question playback', () => {
  const source = read('server/index.js');

  assert.match(source, /app\.get\('\/api\/tts'/);
});
