const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('paper editor removes the summary config block and exposes actions in the page header area', () => {
  const appSource = read('src/App.vue');
  const newPaperSource = read('src/views/NewPaperView.vue');

  assert.doesNotMatch(newPaperSource, /新增卷子配置/);
  assert.doesNotMatch(newPaperSource, /admin-kpis compact/);
  assert.match(appSource, /paper-editor-top-actions/);
  assert.match(appSource, /返回卷子列表/);
  assert.match(appSource, /预览学生页/);
  assert.match(appSource, /答题情况/);
  assert.match(appSource, /保存卷子/);
});

test('paper editor places the add-question-type section before the basic info section', () => {
  const newPaperSource = read('src/views/NewPaperView.vue');
  const addTypeIndex = newPaperSource.indexOf('<h2>添加题型</h2>');
  const basicInfoIndex = newPaperSource.indexOf('<h2>卷子基础信息</h2>');

  assert.notEqual(addTypeIndex, -1);
  assert.notEqual(basicInfoIndex, -1);
  assert.ok(addTypeIndex < basicInfoIndex);
});

test('paper editor keeps save button clickable and warns when total score is not 100', () => {
  const appSource = read('src/App.vue');

  assert.doesNotMatch(appSource, /:disabled="!editingScoreSummary\.isValid"/);
  assert.match(appSource, /message\.warning\(editingScoreSummary\.value\.message \|\| '卷子总分必须等于 100 分后才能保存。'\)/);
});

test('paper editor top actions stay on the same row as the title', () => {
  const stylesSource = read('src/styles.css');

  assert.match(stylesSource, /\.admin-topbar-main\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;/);
  assert.match(stylesSource, /\.admin-topbar-title\s*\{[^}]*margin:\s*0;/);
});
