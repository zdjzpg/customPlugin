const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('buyer category catalog exposes media and image tools as top-level categories', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerCategoryCatalog.mjs')
  ).href;
  const { buyerCategoryCatalog } = await import(moduleUrl);

  assert.deepEqual(
    buyerCategoryCatalog.map((item) => item.key),
    ['ppt_tools', 'text_tools', 'dev_tools', 'media_tools', 'image_tools']
  );

  const mediaCategory = buyerCategoryCatalog.find((item) => item.key === 'media_tools');
  assert.deepEqual(mediaCategory, {
    key: 'media_tools',
    label: '音视频工具',
    description: '覆盖文字转语音、音频剪切合并、音频试听和视频倍速预览能力。',
    iconLabel: 'M'
  });

  const imageCategory = buyerCategoryCatalog.find((item) => item.key === 'image_tools');
  assert.deepEqual(imageCategory, {
    key: 'image_tools',
    label: '图像工具',
    description: '覆盖图片压缩、裁剪、拼接、GIF 和常用图像处理能力。',
    iconLabel: 'I'
  });
});
