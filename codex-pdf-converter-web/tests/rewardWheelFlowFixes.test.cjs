const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('PaperView no longer auto-continues from finish overlay into the reward wheel', () => {
  const source = read('src/views/PaperView.vue');

  assert.doesNotMatch(source, /window\.setTimeout\(\(\)\s*=>\s*\{\s*completeFinishAnimation\(\)/);
  assert.doesNotMatch(source, /finishTimer/);
});

test('exam store does not preload rewardResult before the player draws on the wheel', () => {
  const source = read('src/store/examStore.js');

  assert.doesNotMatch(source, /state\.rewardResult\s*=\s*submission\.reward\s*\|\|\s*null/);
  assert.match(source, /state\.rewardResult\s*=\s*null/);
  assert.match(source, /async drawCurrentReward\(\)/);
});

test('reward wheel only reveals the prize after the wheel animation completes', () => {
  const source = read('src/components/shared/RewardWheelOverlay.vue');

  assert.match(source, /const revealedResult = ref\(null\)/);
  assert.match(source, /revealedResult\.value = value/);
  assert.match(source, /v-if="revealedResult"/);
  assert.match(source, /v-else-if="spinningToResult"/);
  assert.doesNotMatch(source, /v-if="result"/);
});

test('reward wheel shows the drawn prize in a separate modal instead of extending the machine card', () => {
  const source = read('src/components/shared/RewardWheelOverlay.vue');
  const styles = read('src/styles.css');

  assert.match(source, /reward-result-modal/);
  assert.match(source, /reward-result-popup/);
  assert.match(source, /reward-result-button/);
  assert.doesNotMatch(source, /class="reward-prize-chute reward-result-card"/);
  assert.match(styles, /\.reward-result-modal\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(styles, /\.reward-machine-card\s*\{[\s\S]*overflow:\s*hidden;/);
});

test('reward result popup keeps its contents centered after moving into a separate modal layer', () => {
  const styles = read('src/styles.css');

  assert.match(styles, /\.reward-result-popup\s*\{[^}]*display:\s*grid;[^}]*justify-items:\s*center;[^}]*text-align:\s*center;/);
});

test('reward wheel overlay still constrains machine height to fit shorter viewports', () => {
  const styles = read('src/styles.css');

  assert.match(styles, /\.reward-machine-card\s*\{[\s\S]*max-height:\s*calc\(100vh\s*-\s*48px\);/);
  assert.match(styles, /\.reward-machine-card\s*\{[\s\S]*overflow:\s*hidden;/);
});
