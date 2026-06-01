const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('reward wheel overlay uses a capsule-machine cabinet layout instead of a plain card', () => {
  const source = read('src/components/shared/RewardWheelOverlay.vue');
  const styles = read('src/styles.css');

  assert.match(source, /reward-machine-shell/);
  assert.match(source, /reward-machine-window/);
  assert.match(source, /reward-machine-console/);
  assert.match(source, /reward-machine-lights/);
  assert.match(source, /reward-prize-chute/);
  assert.match(source, /reward-wheel-center/);

  assert.match(styles, /\.reward-machine-shell\s*\{/);
  assert.match(styles, /\.reward-machine-window\s*\{/);
  assert.match(styles, /\.reward-machine-console\s*\{/);
  assert.match(styles, /\.reward-machine-lights\s*\{/);
  assert.match(styles, /\.reward-prize-chute\s*\{/);
  assert.match(styles, /\.reward-wheel-center\s*\{/);
});
