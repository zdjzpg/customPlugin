const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const tencentTtsService = require('../server/tencentTtsService');

test('normalizeTtsText trims and collapses repeated whitespace', () => {
  assert.equal(typeof tencentTtsService.normalizeTtsText, 'function');
  assert.equal(tencentTtsService.normalizeTtsText('  Hello   orange\nworld  '), 'Hello orange world');
});

test('getOrCreateTtsAudioFile caches the same normalized sentence after the first synthesis', async () => {
  assert.equal(typeof tencentTtsService.getOrCreateTtsAudioFile, 'function');

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tts-cache-test-'));
  const config = {
    secretId: 'id',
    secretKey: 'key',
    region: 'ap-guangzhou',
    voiceType: 101001,
    primaryLanguage: 2,
    codec: 'mp3',
    sampleRate: 16000,
    speed: 0,
    volume: 0,
    modelType: 1
  };
  let synthesisCalls = 0;

  try {
    const first = await tencentTtsService.getOrCreateTtsAudioFile({
      text: 'Orange   juice',
      config,
      cacheRoot: tempRoot,
      clientFactory() {
        return {
          async TextToVoice() {
            synthesisCalls += 1;
            return {
              Audio: Buffer.from('fake-mp3-audio').toString('base64'),
              SessionId: 'session-1'
            };
          }
        };
      }
    });

    const second = await tencentTtsService.getOrCreateTtsAudioFile({
      text: '  Orange juice  ',
      config,
      cacheRoot: tempRoot,
      clientFactory() {
        throw new Error('cache should prevent a second synthesis request');
      }
    });

    assert.equal(synthesisCalls, 1);
    assert.equal(first.cacheHit, false);
    assert.equal(second.cacheHit, true);
    assert.equal(first.absolutePath, second.absolutePath);
    const audioBuffer = await fs.readFile(first.absolutePath);
    assert.equal(audioBuffer.toString('utf8'), 'fake-mp3-audio');
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
