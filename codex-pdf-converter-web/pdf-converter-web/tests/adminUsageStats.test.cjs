const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('../server/app.cjs');

test('GET /api/admin/usage-stats returns day-grouped feature counts for an authenticated admin', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'admin-token-usage-1',
    role: 'admin',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    usageStatsRepository: {
      listByDay(query) {
        assert.equal(query.preset, 'last7days');
        assert.equal(query.dateFrom, null);
        assert.equal(query.dateTo, null);
        return [
          {
            day: '2026-06-01',
            conversionKey: 'pdf_to_word',
            count: 5
          },
          {
            day: '2026-06-01',
            conversionKey: 'merge_pdf',
            count: 2
          }
        ];
      }
    },
    conversionService: createNoopConversionService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/admin/usage-stats?preset=last7days`,
      {
        headers: {
          cookie: 'pdf_converter_session=admin-token-usage-1'
        }
      }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      stats: [
        {
          day: '2026-06-01',
          conversionKey: 'pdf_to_word',
          count: 5
        },
        {
          day: '2026-06-01',
          conversionKey: 'merge_pdf',
          count: 2
        }
      ]
    });
  } finally {
    await close(server);
  }
});

test('GET /api/admin/usage-stats forwards custom date range filters', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'admin-token-usage-2',
    role: 'admin',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    usageStatsRepository: {
      listByDay(query) {
        assert.equal(query.preset, 'custom');
        assert.equal(query.dateFrom, '2026-05-01');
        assert.equal(query.dateTo, '2026-05-31');
        return [];
      }
    },
    conversionService: createNoopConversionService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/admin/usage-stats?preset=custom&dateFrom=2026-05-01&dateTo=2026-05-31`,
      {
        headers: {
          cookie: 'pdf_converter_session=admin-token-usage-2'
        }
      }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      stats: []
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
