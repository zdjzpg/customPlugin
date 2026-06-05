const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('shared tool card meta exposes scraped UU-style data for dev, text, ppt, and image tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCardMeta.mjs')
  ).href;
  const { getToolCardMeta } = await import(moduleUrl);

  const devMeta = getToolCardMeta('dev_base64_codec');
  const textMeta = getToolCardMeta('text_unique');
  const pptMeta = getToolCardMeta('pdf_to_word');
  const imageMeta = getToolCardMeta('image_resize_exact');

  assert.equal(devMeta.iconClass, 'fa fa-exchange');
  assert.equal(devMeta.badge, 'base64');
  assert.equal(devMeta.styleClass, 'style2');

  assert.equal(textMeta.iconClass, 'fa fa-filter');
  assert.equal(textMeta.badge, '文本');
  assert.equal(textMeta.styleClass, 'style14');

  assert.equal(pptMeta.iconClass, 'fa fa-file-word-o');
  assert.equal(pptMeta.badge, 'Word');
  assert.match(pptMeta.styleClass, /^style\d+$/);

  assert.equal(imageMeta.badge, '尺寸');
  assert.equal(imageMeta.iconClass, 'fa fa-arrows-alt');
  assert.match(imageMeta.styleClass, /^style\d+$/);
});

test('shared tool card meta includes scraped uu icon mapping for newly added dev tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCardMeta.mjs')
  ).href;
  const { getToolCardMeta } = await import(moduleUrl);

  const qqMeta = getToolCardMeta('dev_qq_block_check');
  const ckeditorMeta = getToolCardMeta('dev_ckeditor5');
  const fontawesomeMeta = getToolCardMeta('dev_fontawesome_to_image');

  assert.equal(qqMeta.iconClass, 'fa fa-qq');
  assert.equal(qqMeta.badge, 'qq');
  assert.equal(qqMeta.styleClass, 'style5');

  assert.equal(ckeditorMeta.iconClass, 'fa fa-pencil-square-o');
  assert.equal(ckeditorMeta.badge, 'CKEditor5');
  assert.equal(ckeditorMeta.styleClass, 'style13');

  assert.equal(fontawesomeMeta.iconClass, 'fa fa-font-awesome');
  assert.equal(fontawesomeMeta.badge, 'FontAwesome');
  assert.equal(fontawesomeMeta.styleClass, 'style6');
});

test('shared tool card meta exposes uu-style icon and palette mapping for media tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCardMeta.mjs')
  ).href;
  const { getToolCardMeta } = await import(moduleUrl);

  const ttsMeta = getToolCardMeta('media_text_to_speech');
  const clipMeta = getToolCardMeta('media_audio_clip');
  const playerMeta = getToolCardMeta('media_audio_player');

  assert.equal(ttsMeta.iconClass, 'fa fa-volume-up');
  assert.equal(ttsMeta.badge, '语音');
  assert.equal(ttsMeta.styleClass, 'style9');

  assert.equal(clipMeta.iconClass, 'fa fa-scissors');
  assert.equal(clipMeta.badge, '音频');
  assert.equal(clipMeta.styleClass, 'style10');

  assert.equal(playerMeta.iconClass, 'fa fa-headphones');
  assert.equal(playerMeta.badge, '试听');
  assert.equal(playerMeta.styleClass, 'style13');
});

test('shared tool card meta exposes image-add-text and heic-convert mappings', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCardMeta.mjs')
  ).href;
  const { getToolCardMeta } = await import(moduleUrl);

  const addTextMeta = getToolCardMeta('image_add_text');
  const heicMeta = getToolCardMeta('image_heic_convert');

  assert.equal(addTextMeta.badge, '文字');
  assert.equal(addTextMeta.iconClass, 'fa fa-font');
  assert.match(addTextMeta.styleClass, /^style\d+$/);

  assert.equal(heicMeta.badge, 'HEIC');
  assert.equal(heicMeta.iconClass, 'fa fa-file-image-o');
  assert.match(heicMeta.styleClass, /^style\d+$/);
});

test('shared tool card meta exposes mappings for border template and annotation local image tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCardMeta.mjs')
  ).href;
  const { getToolCardMeta } = await import(moduleUrl);

  const borderMeta = getToolCardMeta('image_add_border_frame');
  const templateMeta = getToolCardMeta('image_platform_cover_template');
  const annotateMeta = getToolCardMeta('image_annotate_canvas');

  assert.equal(borderMeta.badge, '边框');
  assert.equal(borderMeta.iconClass, 'fa fa-square-o');
  assert.match(borderMeta.styleClass, /^style\d+$/);

  assert.equal(templateMeta.badge, '模板');
  assert.equal(templateMeta.iconClass, 'fa fa-object-group');
  assert.match(templateMeta.styleClass, /^style\d+$/);

  assert.equal(annotateMeta.badge, '标注');
  assert.equal(annotateMeta.iconClass, 'fa fa-pencil');
  assert.match(annotateMeta.styleClass, /^style\d+$/);
});

test('shared tool card meta exposes mappings for flip metadata blur rotate and erase image tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCardMeta.mjs')
  ).href;
  const { getToolCardMeta } = await import(moduleUrl);

  assert.equal(getToolCardMeta('image_flip_mirror').badge, '翻转');
  assert.equal(getToolCardMeta('image_metadata_view_clear').badge, '元数据');
  assert.equal(getToolCardMeta('image_blur_redact').badge, '打码');
  assert.equal(getToolCardMeta('image_rotate_adjust').badge, '旋转');
  assert.equal(getToolCardMeta('image_object_erase_light').badge, '消除');
});
