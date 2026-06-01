const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('match image word uses sticker-style pairing UI without exposing technical ids visually', () => {
  const source = read('src/components/questions/MatchImageWord.vue');
  const styles = read('src/styles.css');

  assert.match(source, /match-play-stage/);
  assert.match(source, /match-card image sticker-match-card/);
  assert.match(source, /match-card word word-sticker-match/);
  assert.match(source, /match-status-chip/);
  assert.match(source, /选一张图，再点单词！/);
  assert.doesNotMatch(source, /match-card-note/);

  assert.match(styles, /\.sticker-match-card\s*\{/);
  assert.match(styles, /\.word-sticker-match\s*\{/);
  assert.match(styles, /\.match-play-stage\s*\{/);
});
