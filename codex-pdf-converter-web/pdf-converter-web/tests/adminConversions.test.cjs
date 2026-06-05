const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('../server/app.cjs');

test('GET /api/admin/conversions returns recent records including code and created time', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'admin-token-conversions-1',
    role: 'admin',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionRepository: {
      listRecent() {
        return [
          {
            id: 8,
            codeValue: 'DEMO-DAYS-7',
            conversionKey: 'pdf_to_word',
            status: 'completed',
            inputFileNames: ['sample.pdf'],
            outputFiles: [
              {
                fileName: 'sample.docx'
              }
            ],
            errorMessage: '',
            createdAt: '2026-06-05T14:08:09.000Z'
          }
        ];
      }
    },
    conversionService: createNoopConversionService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/conversions`, {
      headers: {
        cookie: 'pdf_converter_session=admin-token-conversions-1'
      }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      conversions: [
        {
          id: 8,
          codeValue: 'DEMO-DAYS-7',
          conversionKey: 'pdf_to_word',
          status: 'completed',
          inputFileNames: ['sample.pdf'],
          outputFiles: [
            {
              fileName: 'sample.docx'
            }
          ],
          errorMessage: '',
          createdAt: '2026-06-05T14:08:09.000Z'
        }
      ]
    });
  } finally {
    await close(server);
  }
});

test('admin conversion script formats internal conversion keys into Chinese labels', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'admin.js'),
    'utf8'
  );

  assert.match(script, /formatAdminConversionLabel/);
});

test('admin script filters codes and conversions by code-value substring before pagination', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'admin.js'),
    'utf8'
  );

  assert.match(script, /codeSearchKeyword/);
  assert.match(script, /conversionSearchKeyword/);
  assert.match(script, /includes\(keyword\)/);
});

test('admin conversion script renders cleaned files as non-downloadable cleaned markers', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'admin.js'),
    'utf8'
  );

  assert.match(script, /file\.cleanedAt/);
  assert.match(script, /文件已清理/);
  assert.match(script, /cleanup-by-code/);
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
