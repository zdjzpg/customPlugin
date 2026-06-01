const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('image upload field keeps non-compact delete buttons and switches compact mode to picture-card', () => {
  const source = read('src/components/editors/ImageUploadField.vue');

  assert.match(source, /DeleteOutlined,\s*UploadOutlined/);
  assert.match(source, /v-if="props\.compact"/);
  assert.match(source, /list-type="picture-card"/);
  assert.match(source, /<a-button v-if="props\.modelValue" danger @click="clearImage">[\s\S]*<DeleteOutlined \/>[\s\S]*删除图片/);
});
