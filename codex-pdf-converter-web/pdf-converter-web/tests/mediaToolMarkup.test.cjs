const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function getMarkupModuleUrl() {
  return pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
}

test('createToolDetailMarkup renders text-to-speech controls for a server media tool', async () => {
  const { createToolDetailMarkup } = await import(getMarkupModuleUrl());

  const html = createToolDetailMarkup({
    key: 'media_text_to_speech',
    kind: 'server_media_tool',
    label: '文字转语音',
    helperText: '支持中文普通话和英文文本合成音频。'
  });

  assert.match(html, /待合成文本/);
  assert.match(html, /中文普通话/);
  assert.match(html, /英文/);
  assert.match(html, /MP3/);
  assert.match(html, /WAV/);
  assert.match(html, /开始合成/);
  assert.doesNotMatch(html, /type="file"/);
});

test('createToolDetailMarkup renders audio clip upload and time-range controls', async () => {
  const { createToolDetailMarkup } = await import(getMarkupModuleUrl());

  const html = createToolDetailMarkup({
    key: 'media_audio_clip',
    kind: 'file_media_tool',
    label: '音频剪切',
    helperText: '上传音频后按时间范围截取片段。',
    accepts: '.mp3,.wav,.m4a,.aac,.flac,.ogg'
  });

  assert.match(html, /type="file"/);
  assert.match(html, /开始时间/);
  assert.match(html, /结束时间/);
  assert.match(html, /输出格式/);
  assert.match(html, /开始处理/);
});

test('createToolDetailMarkup renders audio-to-text upload and language controls', async () => {
  const { createToolDetailMarkup } = await import(getMarkupModuleUrl());

  const html = createToolDetailMarkup({
    key: 'media_audio_to_text',
    kind: 'file_media_tool',
    label: '音频转文字',
    helperText: '上传音频后识别为可复制文本。',
    accepts: '.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus'
  });

  assert.match(html, /type="file"/);
  assert.match(html, /识别语言/);
  assert.match(html, /自动识别/);
  assert.match(html, /中文/);
  assert.match(html, /英文/);
  assert.match(html, /TXT 文本/);
});

test('createToolDetailMarkup renders local audio-player preview shell', async () => {
  const { createToolDetailMarkup } = await import(getMarkupModuleUrl());

  const html = createToolDetailMarkup({
    key: 'media_audio_player',
    kind: 'local_media_tool',
    label: '音频试听播放',
    helperText: '加载音频波形并试听。'
  });

  assert.match(html, /选择音频文件/);
  assert.match(html, /data-media-waveform/);
  assert.match(html, /data-media-audio-preview/);
  assert.match(html, /加载音频/);
});
