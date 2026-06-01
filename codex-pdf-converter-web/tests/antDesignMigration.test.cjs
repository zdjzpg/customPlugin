const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('main entry registers Ant Design Vue and its reset styles', () => {
  const source = read('src/main.js');

  assert.match(source, /from\s+['"]ant-design-vue['"]/);
  assert.match(source, /ant-design-vue\/dist\/reset\.css/);
  assert.match(source, /\.use\(Antd\)/);
});

test('/papers view uses Ant Design Vue controls instead of native form tags', () => {
  const source = read('src/views/ConfiguredPapersView.vue');

  assert.match(source, /<a-button\b/);
  assert.match(source, /<a-input\b/);
  assert.match(source, /<a-select\b/);
  assert.match(source, /<a-table\b/);

  assert.doesNotMatch(source, /<input\b/);
  assert.doesNotMatch(source, /<select\b/);
  assert.doesNotMatch(source, /<table\b/);
});

test('teacher list/detail pages use Ant Design Vue controls', () => {
  const usersSource = read('src/views/UserManagementView.vue');
  const usersNewSource = read('src/views/UserCreateView.vue');
  const answersSource = read('src/views/AllAnswersView.vue');

  assert.match(usersSource, /新增员工/);
  assert.match(usersSource, /router\.push\(\{ name: 'users-new' \}\)/);
  assert.match(usersSource, /<a-table\b/);
  assert.doesNotMatch(usersSource, /<table\b/);
  assert.doesNotMatch(usersSource, /<a-form\b/);

  assert.match(usersNewSource, /<a-form\b/);
  assert.match(usersNewSource, /<a-input\b/);
  assert.match(usersNewSource, /<a-select\b/);
  assert.doesNotMatch(usersNewSource, /<input\b/);
  assert.doesNotMatch(usersNewSource, /<select\b/);

  assert.match(answersSource, /<a-input\b/);
  assert.match(answersSource, /<a-table\b/);
  assert.match(answersSource, /<a-button\b/);
  assert.doesNotMatch(answersSource, /<input\b/);
  assert.doesNotMatch(answersSource, /<table\b/);
});

test('router exposes a dedicated user-creation page', () => {
  const source = read('src/router/index.js');

  assert.match(source, /path:\s*'\/users\/new'/);
  assert.match(source, /name:\s*'users-new'/);
});

test('paper editor uses Ant Design Vue form controls for teacher-side editing', () => {
  const source = read('src/views/NewPaperView.vue');
  const followInstructionSource = read('src/components/editors/FollowInstructionEditor.vue');
  const uploadSource = read('src/components/editors/ImageUploadField.vue');

  assert.match(source, /<a-button\b/);
  assert.match(source, /<a-form\b/);
  assert.match(source, /<a-input\b/);
  assert.match(source, /<a-textarea\b/);
  assert.match(source, /<a-select\b/);
  assert.match(source, /<a-input-number\b/);
  assert.match(source, /ImageUploadField/);

  assert.doesNotMatch(source, /<button\b/);
  assert.doesNotMatch(source, /<input\b/);
  assert.doesNotMatch(source, /<textarea\b/);
  assert.doesNotMatch(source, /<select\b/);

  assert.match(followInstructionSource, /ImageUploadField/);
  assert.match(uploadSource, /<a-upload\b/);
});
