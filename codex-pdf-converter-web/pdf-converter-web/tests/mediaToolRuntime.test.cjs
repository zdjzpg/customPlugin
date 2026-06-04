const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function getRuntimeModuleUrl() {
  return pathToFileURL(
    path.join(__dirname, '..', 'public', 'mediaToolRuntime.mjs')
  ).href;
}

test('createToneWavBytes produces a RIFF/WAVE payload', async () => {
  const { createToneWavBytes } = await import(getRuntimeModuleUrl());

  const bytes = createToneWavBytes({
    frequencyHz: 440,
    durationSeconds: 1,
    sampleRate: 8000,
    volume: 0.5
  });

  assert.equal(Buffer.from(bytes.slice(0, 4)).toString('ascii'), 'RIFF');
  assert.equal(Buffer.from(bytes.slice(8, 12)).toString('ascii'), 'WAVE');
  assert.ok(bytes.length > 44);
});

test('createWhiteNoiseWavBytes produces a RIFF/WAVE payload', async () => {
  const { createWhiteNoiseWavBytes } = await import(getRuntimeModuleUrl());

  const bytes = createWhiteNoiseWavBytes({
    durationSeconds: 1,
    sampleRate: 8000,
    volume: 0.25,
    random: () => 0.75
  });

  assert.equal(Buffer.from(bytes.slice(0, 4)).toString('ascii'), 'RIFF');
  assert.equal(Buffer.from(bytes.slice(8, 12)).toString('ascii'), 'WAVE');
  assert.ok(bytes.length > 44);
});
