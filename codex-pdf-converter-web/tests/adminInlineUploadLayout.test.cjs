const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

function getCssBlock(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `Expected CSS block for ${selector}`);
  return match[1];
}

test('choice editors keep compact upload slots while large target images stay on the default upload layout', () => {
  const listenChooseImageEditorSource = read('src/components/editors/ListenChooseImageEditor.vue');
  const lookChooseWordEditorSource = read('src/components/editors/LookChooseWordEditor.vue');
  const imageUploadFieldSource = read('src/components/editors/ImageUploadField.vue');
  const stylesSource = read('src/styles.css');
  const sideActionsFieldBlock = getCssBlock(stylesSource, '.image-upload-field.compact.side-actions');
  const choiceRowBlock = getCssBlock(stylesSource, '.listen-choice-editor-row');

  assert.match(listenChooseImageEditorSource, /layout="side-actions"/);
  assert.doesNotMatch(lookChooseWordEditorSource, /layout="side-actions"/);
  assert.match(imageUploadFieldSource, /layout:\s*\{\s*type:\s*String,\s*default:\s*'default'\s*\}/);
  assert.match(sideActionsFieldBlock, /grid-template-columns:\s*96px minmax\(0,\s*1fr\);/);
  assert.match(choiceRowBlock, /grid-template-columns:\s*72px minmax\(0,\s*220px\) minmax\(0,\s*1fr\) 120px auto;/);
});
