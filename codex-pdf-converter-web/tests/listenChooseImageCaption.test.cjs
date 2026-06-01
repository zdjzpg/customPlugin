const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('listen-choose-image removes the buddy block entirely without changing other buddy states', () => {
  const listenChooseImageSource = read('src/components/questions/ListenChooseImage.vue');
  const audioBuddySource = read('src/components/shared/AudioBuddy.vue');

  assert.doesNotMatch(listenChooseImageSource, /<AudioBuddy\b/);
  assert.doesNotMatch(listenChooseImageSource, /listening-buddy-wrap/);
  assert.match(audioBuddySource, /showCaption:\s*\{\s*type:\s*Boolean,\s*default:\s*true\s*\}/);
  assert.match(audioBuddySource, /v-if="showCaption && resolvedCaption"/);
});
