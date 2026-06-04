const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('../server/app.cjs');

test('POST /api/dev-tools/run rejects requests without a buyer session', async () => {
  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository(),
    conversionService: createNoopConversionService(),
    devToolsService: createNoopDevToolsService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/dev-tools/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        toolKey: 'dev_sitemap_extract',
        toolOptions: {
          targetUrl: 'https://example.com/sitemap.xml'
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

test('POST /api/dev-tools/run forwards tool input and records usage stats', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-dev-1',
    role: 'buyer',
    codeId: 71,
    codeValue: 'DEMO-USES-5',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: createNoopConversionService(),
    usageStatsRepository: {
      recordConversionStart(input) {
        assert.equal(input.codeId, 71);
        assert.equal(input.conversionKey, 'dev_sitemap_extract');
      }
    },
    devToolsService: {
      async runTool(input) {
        assert.equal(input.toolKey, 'dev_sitemap_extract');
        assert.deepEqual(input.toolOptions, {
          targetUrl: 'https://example.com/sitemap.xml'
        });
        return {
          outputText: 'https://example.com/a\nhttps://example.com/b'
        };
      }
    }
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/dev-tools/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=buyer-token-dev-1'
      },
      body: JSON.stringify({
        toolKey: 'dev_sitemap_extract',
        toolOptions: {
          targetUrl: 'https://example.com/sitemap.xml'
        }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      result: {
        outputText: 'https://example.com/a\nhttps://example.com/b'
      }
    });
  } finally {
    await close(server);
  }
});

test('POST /api/dev-tools/run returns 400 for invalid payloads', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-dev-2',
    role: 'buyer',
    codeId: 72,
    codeValue: 'DEMO-DAYS-7',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: createNoopConversionService(),
    devToolsService: createNoopDevToolsService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/dev-tools/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=buyer-token-dev-2'
      },
      body: JSON.stringify({
        toolKey: '',
        toolOptions: []
      })
    });

    const body = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      ok: false,
      reason: 'INVALID_DEV_TOOL_REQUEST'
    });
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
