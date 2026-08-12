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

test('mediaToolsService transcribes lecture audio through the teaching wrapper key', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-media-service-'));
  const inputAudioPath = path.join(tempRoot, 'classroom.wav');
  fs.writeFileSync(inputAudioPath, Buffer.from('classroom-audio'));

  const service = createMediaToolsService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    transcribeAudio: async ({ inputPath, outputPath, language }) => {
      assert.equal(path.basename(inputPath), 'classroom.wav');
      assert.equal(language, 'zh');
      fs.writeFileSync(outputPath, '第一段课堂记录\n第二段课堂记录\n', 'utf8');
    }
  });

  try {
    const result = await service.runTool({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      toolKey: 'media_lecture_audio_to_text',
      toolOptions: {
        language: 'zh',
        outputFormat: 'txt'
      },
      files: [
        {
          fileName: 'classroom.wav',
          tempPath: inputAudioPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'classroom-lecture-notes.txt');
    assert.deepEqual(result.summary, {
      kind: 'text_preview',
      previewText: '第一段课堂记录\n第二段课堂记录'
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('mediaToolsService clips one labeled lecture segment through the teaching wrapper key', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-media-service-'));
  const inputAudioPath = path.join(tempRoot, 'classroom.mp3');
  fs.writeFileSync(inputAudioPath, Buffer.from('classroom-audio'));

  const service = createMediaToolsService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    clipAudio: async ({ outputPath, startTimeSeconds, endTimeSeconds, outputFormat }) => {
      assert.equal(startTimeSeconds, 60);
      assert.equal(endTimeSeconds, 185);
      assert.equal(outputFormat, 'mp3');
      fs.writeFileSync(outputPath, Buffer.from('lecture-segment'));
    }
  });

  try {
    const result = await service.runTool({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      toolKey: 'media_lecture_audio_segment',
      toolOptions: {
        segments: [
          {
            title: '作业讲评',
            startTimeText: '00:01:00',
            endTimeText: '00:03:05'
          }
        ],
        outputFormat: 'mp3'
      },
      files: [
        {
          fileName: 'classroom.mp3',
          tempPath: inputAudioPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'classroom-lecture-segment-01.mp3');
    assert.deepEqual(result.summary, {
      kind: 'audio_segments',
      heading: '已整理 1 段课堂重点',
      segmentEntries: [
        {
          index: 1,
          title: '作业讲评',
          timeRangeLabel: '00:01:00 - 00:03:05',
          durationLabel: '02:05'
        }
      ]
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('mediaToolsService packages multiple lecture segments into one zip artifact', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-media-service-'));
  const inputAudioPath = path.join(tempRoot, 'classroom.mp3');
  fs.writeFileSync(inputAudioPath, Buffer.from('classroom-audio'));

  const clipCalls = [];
  const service = createMediaToolsService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    clipAudio: async ({ outputPath, startTimeSeconds, endTimeSeconds, outputFormat }) => {
      clipCalls.push({
        fileName: path.basename(outputPath),
        startTimeSeconds,
        endTimeSeconds,
        outputFormat
      });
      fs.writeFileSync(outputPath, Buffer.from(`segment-${clipCalls.length}`));
    },
    zipFiles: async ({ outputPath, inputPaths }) => {
      assert.deepEqual(
        inputPaths.map((item) => path.basename(item)),
        ['classroom-lecture-segment-01.mp3', 'classroom-lecture-segment-02.mp3']
      );
      fs.writeFileSync(outputPath, Buffer.from('lecture-zip'));
    }
  });

  try {
    const result = await service.runTool({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      toolKey: 'media_lecture_audio_segment',
      toolOptions: {
        segments: [
          {
            title: '课堂导入',
            startTimeText: '00:00:10',
            endTimeText: '00:01:20'
          },
          {
            title: '重点题讲解',
            startTimeText: '00:02:00',
            endTimeText: '00:04:10'
          }
        ],
        outputFormat: 'mp3'
      },
      files: [
        {
          fileName: 'classroom.mp3',
          tempPath: inputAudioPath
        }
      ]
    });

    assert.deepEqual(clipCalls, [
      {
        fileName: 'classroom-lecture-segment-01.mp3',
        startTimeSeconds: 10,
        endTimeSeconds: 80,
        outputFormat: 'mp3'
      },
      {
        fileName: 'classroom-lecture-segment-02.mp3',
        startTimeSeconds: 120,
        endTimeSeconds: 250,
        outputFormat: 'mp3'
      }
    ]);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'classroom-lecture-segments.zip');
    assert.deepEqual(result.summary, {
      kind: 'audio_segments',
      heading: '已整理 2 段课堂重点',
      segmentEntries: [
        {
          index: 1,
          title: '课堂导入',
          timeRangeLabel: '00:00:10 - 00:01:20',
          durationLabel: '01:10'
        },
        {
          index: 2,
          title: '重点题讲解',
          timeRangeLabel: '00:02:00 - 00:04:10',
          durationLabel: '02:10'
        }
      ]
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
