const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('listen-choose-letter uses playful nest targets and scattered loose letters', () => {
  const source = read('src/components/questions/ListenChooseLetter.vue');
  const styles = read('src/styles.css');

  assert.match(source, /letter-home-board/);
  assert.match(source, /loose-letter-garden/);
  assert.match(source, /loose-letter-card/);
  assert.match(source, /@pointerdown=/);
  assert.match(source, /window\.addEventListener\('pointermove'/);
  assert.match(source, /window\.addEventListener\('pointerup'/);
  assert.match(source, /drag-ghost/);
  assert.match(source, /<Teleport to="body">/);
  assert.match(source, /snapLetterToHome/);
  assert.match(source, /resetLetterPosition/);
  assert.match(source, /celebrateHome/);
  assert.match(source, /--float-rise/);
  assert.match(source, /--float-duration/);
  assert.doesNotMatch(source, /@click="placeLetter/);
  assert.doesNotMatch(source, /letter-pool-label/);
  assert.doesNotMatch(source, /letter-choice-grid/);
  assert.doesNotMatch(source, /letter-drop-label/);

  assert.match(styles, /\.letter-home-board\s*\{/);
  assert.match(styles, /\.loose-letter-garden\s*\{/);
  assert.match(styles, /\.loose-letter-card\s*\{/);
  assert.match(styles, /\.loose-letter-card\.dragging\s*\{/);
  assert.match(styles, /\.loose-letter-card\.dragging\s*\{[^}]*opacity:\s*0\s*;/);
  assert.match(styles, /\.drag-ghost\s*\{/);
  assert.match(styles, /\.loose-letter-card\.returning\s*\{/);
  assert.match(styles, /\.letter-home-shell\.active\s*\{/);
  assert.match(styles, /\.letter-home-shell\.snap-glow\s*\{/);
  assert.match(styles, /animation:\s*looseLetterFloat var\(--float-duration/);
  assert.match(styles, /var\(--float-rise/);
});
