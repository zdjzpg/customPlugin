const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function getCatalogModuleUrl() {
  return pathToFileURL(
    path.join(__dirname, '..', 'public', 'localImageToolCatalog.mjs')
  ).href;
}

test('localImageToolCatalog exposes the current local image tool batch under the image_tools category', async () => {
  const { localImageToolCatalog, getLocalImageToolByKey } = await import(getCatalogModuleUrl());

  assert.equal(localImageToolCatalog.length, 12);
  assert.deepEqual(
    localImageToolCatalog.map((item) => item.key),
    [
      'image_add_text',
      'image_add_border_frame',
      'image_platform_cover_template',
      'image_annotate_canvas',
      'image_social_cover_pad',
      'image_privacy_redact',
      'image_blur_background_fill',
      'image_flip_mirror',
      'image_metadata_view_clear',
      'image_blur_redact',
      'image_rotate_adjust',
      'image_object_erase_light'
    ]
  );
  assert.equal(getLocalImageToolByKey('image_add_text')?.label, '图片加文字');
  assert.equal(getLocalImageToolByKey('image_add_border_frame')?.label, '图片加边框 / 描边');
  assert.equal(getLocalImageToolByKey('image_platform_cover_template')?.label, '平台封面尺寸模板');
  assert.equal(getLocalImageToolByKey('image_annotate_canvas')?.label, '图片标注 / 箭头框选');
  assert.equal(getLocalImageToolByKey('image_social_cover_pad')?.label, '图片加边框 / 社媒封面留白');
  assert.equal(getLocalImageToolByKey('image_privacy_redact')?.label, '图片隐私打码');
  assert.equal(getLocalImageToolByKey('image_blur_background_fill')?.label, '图片模糊背景填充');
  assert.equal(getLocalImageToolByKey('image_flip_mirror')?.label, '图片翻转 / 镜像');
  assert.equal(getLocalImageToolByKey('image_metadata_view_clear')?.label, '图片元数据查看 / 清除');
  assert.equal(getLocalImageToolByKey('image_blur_redact')?.label, '图片局部模糊 / 打码');
  assert.equal(getLocalImageToolByKey('image_rotate_adjust')?.label, '图片旋转校正');
  assert.equal(getLocalImageToolByKey('image_object_erase_light')?.label, '对象移除 / 涂抹消除');
  assert.equal(getLocalImageToolByKey('missing_key'), null);
});
