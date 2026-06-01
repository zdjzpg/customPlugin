const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('listen choose image and look choose word use more playful student-side structures', () => {
  const listenChooseImageSource = read('src/components/questions/ListenChooseImage.vue');
  const lookChooseWordSource = read('src/components/questions/LookChooseWord.vue');
  const stylesSource = read('src/styles.css');

  assert.match(listenChooseImageSource, /listen-image-stage/);
  assert.match(listenChooseImageSource, /choice-card sticker-choice-card/);
  assert.match(listenChooseImageSource, /听一听，点它！/);

  assert.match(lookChooseWordSource, /look-word-stage/);
  assert.match(lookChooseWordSource, /word-sticker/);
  assert.match(lookChooseWordSource, /看看是谁，点单词！/);

  assert.match(stylesSource, /\.sticker-choice-card\s*\{/);
  assert.match(stylesSource, /\.look-word-stage\s*\{/);
  assert.match(stylesSource, /\.word-sticker\s*\{/);
  assert.match(stylesSource, /\.choice-image\s*\{[\s\S]*object-fit:\s*contain;/);
  assert.doesNotMatch(stylesSource, /\.choice-image-board\s*\{[^}]*border:/);
  assert.doesNotMatch(stylesSource, /\.choice-image-board\s*\{[^}]*background:/);
  assert.doesNotMatch(stylesSource, /\.look-word-image-card\s*\{[^}]*border:/);
});

test('look choose word fills the question stage with a larger visual focus', () => {
  const stylesSource = read('src/styles.css');

  assert.match(stylesSource, /\.look-word-stage\s*\{[\s\S]*min-height:\s*100%;/);
  assert.match(stylesSource, /\.look-word-playboard\s*\{[\s\S]*flex:\s*1\s+1\s+auto;[\s\S]*width:\s*min\(100%,\s*980px\);[\s\S]*justify-content:\s*center;/);
  assert.match(stylesSource, /\.look-word-image-card\s+\.question-asset-image\s*\{[\s\S]*max-height:\s*clamp\(220px,\s*42vh,\s*340px\);/);
});
