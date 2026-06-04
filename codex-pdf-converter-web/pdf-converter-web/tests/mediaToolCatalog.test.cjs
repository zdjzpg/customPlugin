const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function getCatalogModuleUrl() {
  return pathToFileURL(
    path.join(__dirname, '..', 'public', 'mediaToolCatalog.mjs')
  ).href;
}

test('mediaToolCatalog exposes seven media tools under the media_tools category', async () => {
  const { mediaToolCatalog } = await import(getCatalogModuleUrl());

  assert.equal(mediaToolCatalog.length, 7);
  assert.deepEqual(
    mediaToolCatalog.map((item) => item.key),
    [
      'media_text_to_speech',
      'media_audio_clip',
      'media_audio_merge',
      'media_audio_player',
      'media_video_speed_preview',
      'media_tone_generator',
      'media_white_noise_generator'
    ]
  );

  assert.equal(
    mediaToolCatalog.every((item) => item.categoryKey === 'media_tools'),
    true
  );
});

test('mediaToolCatalog distinguishes remote and local media tool kinds', async () => {
  const { mediaToolCatalog } = await import(getCatalogModuleUrl());

  assert.equal(
    mediaToolCatalog.find((item) => item.key === 'media_text_to_speech')?.kind,
    'server_media_tool'
  );
  assert.equal(
    mediaToolCatalog.find((item) => item.key === 'media_audio_clip')?.kind,
    'file_media_tool'
  );
  assert.equal(
    mediaToolCatalog.find((item) => item.key === 'media_audio_player')?.kind,
    'local_media_tool'
  );
});
