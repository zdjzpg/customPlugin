const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createMediaToolsService } = require('../server/services/mediaToolsService.cjs');

test('mediaToolsService clips one uploaded audio file and returns a download artifact', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-media-service-'));
  const inputAudioPath = path.join(tempRoot, 'input.mp3');
  fs.writeFileSync(inputAudioPath, Buffer.from('fake-audio'));

  const service = createMediaToolsService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    clipAudio: async ({ outputPath, startTimeSeconds, endTimeSeconds, outputFormat }) => {
      assert.equal(startTimeSeconds, 1.25);
      assert.equal(endTimeSeconds, 5.5);
      assert.equal(outputFormat, 'mp3');
      fs.writeFileSync(outputPath, Buffer.from('clipped-audio'));
    }
  });

  try {
    const result = await service.runTool({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      toolKey: 'media_audio_clip',
      toolOptions: {
        startTimeText: '00:01.250',
        endTimeText: '00:05.500',
        outputFormat: 'mp3'
      },
      files: [
        {
          fileName: 'lecture.mp3',
          tempPath: inputAudioPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'lecture-clipped.mp3');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('mediaToolsService merges multiple audio files and returns one download artifact', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-media-service-'));
  const firstAudioPath = path.join(tempRoot, 'part-a.mp3');
  const secondAudioPath = path.join(tempRoot, 'part-b.mp3');
  fs.writeFileSync(firstAudioPath, Buffer.from('a'));
  fs.writeFileSync(secondAudioPath, Buffer.from('b'));

  const service = createMediaToolsService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    mergeAudio: async ({ inputPaths, outputPath, outputFormat }) => {
      assert.deepEqual(
        inputPaths.map((item) => path.basename(item)),
        ['part-a.mp3', 'part-b.mp3']
      );
      assert.equal(outputFormat, 'wav');
      fs.writeFileSync(outputPath, Buffer.from('merged-audio'));
    }
  });

  try {
    const result = await service.runTool({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      toolKey: 'media_audio_merge',
      toolOptions: {
        outputFormat: 'wav'
      },
      files: [
        {
          fileName: 'part-a.mp3',
          tempPath: firstAudioPath
        },
        {
          fileName: 'part-b.mp3',
          tempPath: secondAudioPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'merged-audio.wav');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('mediaToolsService synthesizes text to speech with language and format options', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-media-service-'));

  const service = createMediaToolsService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    synthesizeSpeech: async ({ sourceText, language, outputFormat, outputPath }) => {
      assert.equal(sourceText, '你好，欢迎使用。');
      assert.equal(language, 'zh');
      assert.equal(outputFormat, 'wav');
      fs.writeFileSync(outputPath, Buffer.from('speech-audio'));
    }
  });

  try {
    const result = await service.runTool({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      toolKey: 'media_text_to_speech',
      toolOptions: {
        sourceText: '你好，欢迎使用。',
        language: 'zh',
        outputFormat: 'wav'
      },
      files: []
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'text-to-speech.wav');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('mediaToolsService transcribes one uploaded audio file into txt output', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-media-service-'));
  const inputAudioPath = path.join(tempRoot, 'meeting.wav');
  fs.writeFileSync(inputAudioPath, Buffer.from('meeting-audio'));

  const service = createMediaToolsService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    transcribeAudio: async ({ inputPath, outputPath, language }) => {
      assert.equal(path.basename(inputPath), 'meeting.wav');
      assert.equal(language, 'zh');
      fs.writeFileSync(outputPath, '第一行会议记录\n第二行待办事项\n', 'utf8');
    }
  });

  try {
    const result = await service.runTool({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      toolKey: 'media_audio_to_text',
      toolOptions: {
        language: 'zh',
        outputFormat: 'txt'
      },
      files: [
        {
          fileName: 'meeting.wav',
          tempPath: inputAudioPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'meeting-transcript.txt');
    assert.deepEqual(result.summary, {
      kind: 'text_preview',
      previewText: '第一行会议记录\n第二行待办事项'
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function createNoopConversionRepository() {
  return {
    create() {
      return { id: 999 };
    },
    markCompleted() {},
    markFailed() {}
  };
}
