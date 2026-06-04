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
