const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createUploadProgressMarkup renders current percentage and stage text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'uploadProgress.mjs')
  ).href;
  const { createUploadProgressMarkup } = await import(moduleUrl);

  const html = createUploadProgressMarkup({
    stage: 'uploading',
    percent: 42,
    detail: '正在上传文件...'
  });

  assert.match(html, /42%/);
  assert.match(html, /正在上传文件/);
  assert.match(html, /progress-bar-fill/);
});

test('getUploadStageText maps stages to user-facing labels', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'uploadProgress.mjs')
  ).href;
  const { getUploadStageText } = await import(moduleUrl);

  assert.equal(getUploadStageText('uploading'), '正在上传文件...');
  assert.equal(getUploadStageText('processing'), '文件已上传，正在生成结果...');
  assert.equal(getUploadStageText('error'), '上传或转换失败。');
});
