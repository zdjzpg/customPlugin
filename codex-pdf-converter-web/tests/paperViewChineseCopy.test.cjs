const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('PaperView shows intact Chinese copy in the intake header', () => {
  const source = read('src/views/PaperView.vue');

  assert.match(source, /📝 \{\{ state\.currentPaper\.questions\.length \}\} 道题/);
  assert.match(source, /⭐ 总分 \{\{ currentPaperTotal \}\}/);
  assert.match(source, /<h2>填写学生信息<\/h2>/);

  assert.doesNotMatch(source, /馃摑/);
  assert.doesNotMatch(source, /閬撻/);
  assert.doesNotMatch(source, /猸/);
  assert.doesNotMatch(source, /鎬诲垎/);
  assert.doesNotMatch(source, /濉啓瀛︾敓淇℃伅/);
});
