const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('../server/app.cjs');

test('POST /api/admin/conversions/cleanup-by-code forwards the code value to cleanup service for an authenticated admin', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'admin-token-cleanup-1',
    role: 'admin',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    cleanupService: {
      cleanupOutputsByCodeValue(codeValue) {
        assert.equal(codeValue, 'DEMO-DAYS-7');
        return {
          cleanedConversions: 4,
          cleanedFiles: 7
        };
      }
    },
    conversionService: createNoopConversionService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/conversions/cleanup-by-code`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=admin-token-cleanup-1'
      },
      body: JSON.stringify({
        codeValue: 'DEMO-DAYS-7'
      })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      result: {
        cleanedConversions: 4,
        cleanedFiles: 7
      }
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
    }
  };
}

function createNoopConversionService() {
  return {
    getCatalog() {
      return [];
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
