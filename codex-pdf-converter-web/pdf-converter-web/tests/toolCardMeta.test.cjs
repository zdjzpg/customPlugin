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
