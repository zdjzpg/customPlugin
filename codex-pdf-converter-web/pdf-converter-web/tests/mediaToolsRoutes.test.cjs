const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('../server/app.cjs');

test('POST /api/media-tools/run rejects requests without a buyer session', async () => {
  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository(),
    conversionService: createNoopConversionService(),
    devToolsService: createNoopDevToolsService(),
    mediaToolsService: createNoopMediaToolsService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/media-tools/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        toolKey: 'media_text_to_speech',
        toolOptions: {
          sourceText: 'Hello world',
          language: 'en',
          outputFormat: 'mp3'
        }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 401);
    assert.deepEqual(body, {
      ok: false,
      reason: 'UNAUTHORIZED'
    });
  } finally {
    await close(server);
  }
});

test('POST /api/media-tools/run forwards JSON text-to-speech payloads', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-media-1',
    role: 'buyer',
    codeId: 81,
    codeValue: 'DEMO-USES-5',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: createNoopConversionService(),
    devToolsService: createNoopDevToolsService(),
    usageStatsRepository: {
      recordConversionStart(input) {
        assert.equal(input.codeId, 81);
        assert.equal(input.conversionKey, 'media_text_to_speech');
      }
    },
    mediaToolsService: {
      async runTool(input) {
        assert.equal(input.toolKey, 'media_text_to_speech');
        assert.deepEqual(input.toolOptions, {
          sourceText: 'Hello world',
          language: 'en',
          outputFormat: 'mp3'
        });
        assert.equal(input.files.length, 0);
        return {
          conversionId: 91,
          status: 'completed',
          files: [
            {
              fileName: 'text-to-speech.mp3',
              downloadUrl: '/api/downloads/conversions/91/text-to-speech.mp3'
            }
          ]
        };
      }
    }
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/media-tools/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=buyer-token-media-1'
      },
      body: JSON.stringify({
        toolKey: 'media_text_to_speech',
        toolOptions: {
          sourceText: 'Hello world',
          language: 'en',
          outputFormat: 'mp3'
        }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.result.files[0].fileName, 'text-to-speech.mp3');
  } finally {
    await close(server);
  }
});

test('POST /api/media-tools/run forwards lecture-audio teaching wrapper payloads', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-media-lecture-1',
    role: 'buyer',
    codeId: 82,
    codeValue: 'DEMO-DAYS-7',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: createNoopConversionService(),
    devToolsService: createNoopDevToolsService(),
    usageStatsRepository: {
      recordConversionStart(input) {
        assert.equal(input.codeId, 82);
        assert.equal(input.conversionKey, 'media_lecture_audio_to_text');
      }
    },
    mediaToolsService: {
      async runTool(input) {
        assert.equal(input.toolKey, 'media_lecture_audio_to_text');
        assert.deepEqual(input.toolOptions, {
          language: 'zh',
          outputFormat: 'txt'
        });
        return {
          conversionId: 92,
          status: 'completed',
          files: [
            {
              fileName: 'classroom-lecture-notes.txt',
              downloadUrl: '/api/downloads/conversions/92/classroom-lecture-notes.txt'
            }
          ]
        };
      }
    }
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const form = new FormData();
    form.append('toolKey', 'media_lecture_audio_to_text');
    form.append('toolOptions', JSON.stringify({ language: 'zh', outputFormat: 'txt' }));
    form.append('files', new Blob([Buffer.from('lecture-audio')], { type: 'audio/wav' }), 'classroom.wav');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/media-tools/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-media-lecture-1'
      },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.result.files[0].fileName, 'classroom-lecture-notes.txt');
  } finally {
    await close(server);
  }
});

test('POST /api/media-tools/run forwards lecture-audio segment wrapper payloads', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-media-lecture-segment-1',
    role: 'buyer',
    codeId: 83,
    codeValue: 'DEMO-DAYS-7',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: createNoopConversionService(),
    devToolsService: createNoopDevToolsService(),
    usageStatsRepository: {
      recordConversionStart(input) {
        assert.equal(input.codeId, 83);
        assert.equal(input.conversionKey, 'media_lecture_audio_segment');
      }
    },
    mediaToolsService: {
      async runTool(input) {
        assert.equal(input.toolKey, 'media_lecture_audio_segment');
        assert.deepEqual(input.toolOptions, {
          segments: [
            {
              title: '作业讲评',
              startTimeText: '00:01:00',
              endTimeText: '00:03:05'
            },
            {
              title: '重点题讲解',
              startTimeText: '00:05:10',
              endTimeText: '00:08:00'
            }
          ],
          outputFormat: 'mp3'
        });
        return {
          conversionId: 93,
          status: 'completed',
          files: [
            {
              fileName: 'classroom-lecture-segment.mp3',
              downloadUrl: '/api/downloads/conversions/93/classroom-lecture-segment.mp3'
            }
          ]
        };
      }
    }
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const form = new FormData();
    form.append('toolKey', 'media_lecture_audio_segment');
    form.append('toolOptions', JSON.stringify({
      segments: [
        {
          title: '作业讲评',
          startTimeText: '00:01:00',
          endTimeText: '00:03:05'
        },
        {
          title: '重点题讲解',
          startTimeText: '00:05:10',
          endTimeText: '00:08:00'
        }
      ],
      outputFormat: 'mp3'
    }));
    form.append('files', new Blob([Buffer.from('lecture-audio')], { type: 'audio/mpeg' }), 'classroom.mp3');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/media-tools/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-media-lecture-segment-1'
      },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.result.files[0].fileName, 'classroom-lecture-segment.mp3');
  } finally {
    await close(server);
  }
});

function createInMemorySessionRepository() {
  const sessions = [];
  return {
    save(session) {
      sessions.push({ ...session });
    },
    findByToken(token) {
      const session = sessions.find((item) => item.token === token);
      return session ? { ...session } : null;
    }
  };
}

function createNoopAuthService() {
  return {
    loginAdmin() {
      throw new Error('not expected');
    },
    loginBuyer() {
      throw new Error('not expected');
    }
  };
}

function createNoopRedemptionCodeService() {
  return {
    consumeForLogin() {
      throw new Error('not expected');
    }
  };
}

function createNoopCodeRepository() {
  return {
    list() {
      return [];
    },
    create() {
      throw new Error('not expected');
    }
  };
}

function createNoopConversionService() {
  return {
    getCatalog() {
      return [];
    },
    runConversion() {
      throw new Error('not expected');
    }
  };
}

function createNoopDevToolsService() {
  return {
    runTool() {
      throw new Error('not expected');
    }
  };
}

function createNoopMediaToolsService() {
  return {
    runTool() {
      throw new Error('not expected');
    }
  };
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
