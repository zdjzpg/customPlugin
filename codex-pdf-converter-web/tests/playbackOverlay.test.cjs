const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('playback overlay waits for mounted refs before starting GSAP animation', () => {
  const source = read('src/components/shared/PlaybackAnimalOverlay.vue');
  const styles = read('src/styles.css');
  const storeSource = read('src/store/examStore.js');

  assert.match(source, /import\s+\{\s*nextTick,\s*onBeforeUnmount,\s*ref,\s*watch\s*\}\s+from\s+'vue'/);
  assert.match(source, /await nextTick\(\);/);
  assert.match(source, /if\s*\(!targets\)\s*\{\s*return;\s*\}/);
  assert.match(source, /watch\(\(\)\s*=>\s*props\.open,[\s\S]*flush:\s*'post'/);
  assert.match(styles, /\.playback-overlay-card\s*\{/);
  assert.match(styles, /\.playback-overlay-animal\s*\{/);
  assert.match(storeSource, /playbackFallbackTimer/);
  assert.match(storeSource, /window\.setTimeout\(\(\)\s*=>\s*\{[\s\S]*stopSpeakingVisuals\(\)/);
});

test('playback overlay no longer renders the extra helper caption text', () => {
  const source = read('src/components/shared/PlaybackAnimalOverlay.vue');

  assert.doesNotMatch(source, /playback-overlay-text/);
});
