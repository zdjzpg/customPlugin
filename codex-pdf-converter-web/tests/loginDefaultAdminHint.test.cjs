const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('login view does not show the default admin credentials hint', () => {
  const source = read('src/views/LoginView.vue');

  assert.doesNotMatch(source, /默认管理员：admin \/ 123456/);
});
