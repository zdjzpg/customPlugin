const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('project no longer relies on EMOJI_MAP word-to-emoji fallback', () => {
  const contentSource = read('src/utils/content.js');
  const listenChooseImageSource = read('src/components/questions/ListenChooseImage.vue');
  const lookChooseWordSource = read('src/components/questions/LookChooseWord.vue');
  const spellBlankSource = read('src/components/questions/SpellBlank.vue');
  const stylesSource = read('src/styles.css');

  assert.doesNotMatch(contentSource, /EMOJI_MAP/);
  assert.doesNotMatch(contentSource, /emojiForWord/);
  assert.doesNotMatch(listenChooseImageSource, /emojiForWord/);
  assert.doesNotMatch(lookChooseWordSource, /emojiForWord/);
  assert.doesNotMatch(spellBlankSource, /emojiForWord/);
  assert.match(stylesSource, /\.word-fallback-board\s*\{/);
});
