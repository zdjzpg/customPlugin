const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('../server/app.cjs');

test('POST /api/admin/login returns a session cookie for valid credentials', async () => {
  const app = createApp({
    authService: {
      loginAdmin(credentials) {
        if (credentials.username !== 'admin' || credentials.password !== 'secret') {
          return null;
        }

        return {
          role: 'admin',
          token: 'admin-token-1',
          expiresAt: '2026-06-01T11:00:00.000Z'
        };
      },
      loginBuyer() {
        throw new Error('buyer login not expected');
      }
    },
    redemptionCodeService: {
      consumeForLogin() {
        throw new Error('code lookup not expected');
      }
    },
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'secret'
      })
    });

    const body = await response.json();
    const setCookie = response.headers.get('set-cookie');

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.match(setCookie, /pdf_converter_session=admin-token-1/);
  } finally {
    await close(server);
  }
});

test('POST /api/buyer/login consumes the redemption code and returns remaining access', async () => {
  const app = createApp({
    authService: {
      loginAdmin() {
        throw new Error('admin login not expected');
      },
      loginBuyer(codeRecord) {
        return {
          role: 'buyer',
          token: 'buyer-token-1',
          codeId: codeRecord.id,
          codeValue: codeRecord.code,
          expiresAt: '2026-06-08T10:00:00.000Z'
        };
      }
    },
    redemptionCodeService: {
      consumeForLogin(code) {
        assert.equal(code, 'USES-5');
        return {
          ok: true,
          codeRecord: {
            id: 5,
            code: 'USES-5',
            accessType: 'usage',
            remainingUses: 3
          }
        };
      }
    },
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/buyer/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        code: 'USES-5'
      })
    });

    const body = await response.json();
    const setCookie = response.headers.get('set-cookie');

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.code.accessType, 'usage');
    assert.equal(body.code.remainingUses, 3);
    assert.match(setCookie, /pdf_converter_session=buyer-token-1/);
  } finally {
    await close(server);
  }
});

test('GET /api/admin/codes rejects requests without an admin session', async () => {
  const app = createApp({
    authService: {
      loginAdmin() {
        throw new Error('admin login not expected');
      },
      loginBuyer() {
        throw new Error('buyer login not expected');
      }
    },
    redemptionCodeService: {
      consumeForLogin() {
        throw new Error('code lookup not expected');
      }
    },
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/codes`);
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

test('PATCH /api/admin/codes/:codeId/status lets admin disable a code', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'admin-token-1',
    role: 'admin',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const records = [
    {
      id: 7,
      code: 'ACTIVE-1',
      accessType: 'usage',
      maxUses: 5,
      usedCount: 0,
      durationDays: null,
      activatedAt: null,
      expiresAt: null,
      note: '',
      status: 'active'
    }
  ];

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createMutableCodeRepository(records),
    sessionRepository
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/codes/7/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=admin-token-1'
      },
      body: JSON.stringify({
        status: 'disabled'
      })
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.code.status, 'disabled');
    assert.equal(records[0].status, 'disabled');
  } finally {
    await close(server);
  }
});

test('GET /api/admin/session returns unauthenticated state instead of a 401 for login page bootstrap', async () => {
  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/session`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      authenticated: false,
      session: null
    });
  } finally {
    await close(server);
  }
});

test('GET /api/buyer/session returns unauthenticated state instead of a 401 for buyer bootstrap', async () => {
  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/buyer/session`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      authenticated: false,
      session: null
    });
  } finally {
    await close(server);
  }
});

test('GET /preview returns the public preview page without the buyer login form', async () => {
  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/preview`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /tool-preview-app/);
    assert.match(html, /src="\/previewApp\.js"/);
    assert.doesNotMatch(html, /buyer-login-form/);
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

function createNoopCodeRepository() {
  return {
    list() {
      return [];
    },
    findById() {
      return null;
    },
    save() {
      throw new Error('not expected');
    }
  };
}

function createMutableCodeRepository(records) {
  return {
    list() {
      return records.map((record) => ({ ...record }));
    },
    findById(codeId) {
      const record = records.find((item) => item.id === codeId);
      return record ? { ...record } : null;
    },
    save(nextRecord) {
      const index = records.findIndex((item) => item.id === nextRecord.id);
      records[index] = { ...nextRecord };
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
