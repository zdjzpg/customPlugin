const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('../server/app.cjs');

test('GET /api/admin/usage-chart forwards code filter and preset to the usage stats repository', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'admin-token-chart-1',
    role: 'admin',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    usageStatsRepository: {
      listChartSeries(query) {
        assert.equal(query.preset, 'last7days');
        assert.equal(query.codeValue, 'DEMO-DAYS-7');
        return {
          days: ['2026-06-01', '2026-06-02'],
          series: [
            {
              conversionKey: 'pdf_to_word',
              label: 'PDF 转 Word',
              totalCount: 8,
              countsByDay: [5, 3]
            }
          ]
        };
      }
    },
    conversionService: createNoopConversionService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/admin/usage-chart?preset=last7days&codeValue=DEMO-DAYS-7`,
      {
        headers: {
          cookie: 'pdf_converter_session=admin-token-chart-1'
        }
      }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      chart: {
        days: ['2026-06-01', '2026-06-02'],
        series: [
          {
            conversionKey: 'pdf_to_word',
            label: 'PDF 转 Word',
            totalCount: 8,
            countsByDay: [5, 3]
          }
        ]
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
