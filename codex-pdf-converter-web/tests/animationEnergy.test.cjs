const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('overlay animations use larger entry offsets and less-regular looping motion', () => {
  const openingSource = read('src/components/shared/StudentOpeningOverlay.vue');
  const finishSource = read('src/components/shared/StudentFinishOverlay.vue');
  const playbackSource = read('src/components/shared/PlaybackAnimalOverlay.vue');
  const wheelSource = read('src/components/shared/RewardWheelOverlay.vue');
  const stylesSource = read('src/styles.css');

  assert.match(openingSource, /rotateY:\s*-72/);
  assert.match(openingSource, /repeatRefresh:\s*true/);
  assert.match(finishSource, /scale:\s*0\.58/);
  assert.match(finishSource, /particleCount:\s*180/);
  assert.match(playbackSource, /playback-radar-core/);
  assert.match(playbackSource, /rotate:\s*360/);
  assert.match(playbackSource, /repeatRefresh:\s*true/);
  assert.match(wheelSource, /scale:\s*0\.64/);
  assert.match(wheelSource, /particleCount:\s*220/);
  assert.match(stylesSource, /@keyframes drift\s*\{[\s\S]*translate\(8px,\s*18px\)/);
  assert.match(stylesSource, /@keyframes pop-in\s*\{[\s\S]*translateY\(70px\)/);
});
