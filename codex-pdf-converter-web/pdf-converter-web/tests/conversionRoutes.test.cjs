const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const { createApp } = require('../server/app.cjs');

test('POST /api/conversions/run rejects requests without a buyer session', async () => {
  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository: createInMemorySessionRepository(),
    conversionService: createNoopConversionService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        conversionKey: 'images_to_pdf',
        files: [
          {
            fileName: 'sample.png',
            contentBase64: 'aGVsbG8='
          }
        ]
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

test('POST /api/conversions/run persists a buyer conversion and returns download URLs', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-1',
    role: 'buyer',
    codeId: 9,
    codeValue: 'DEMO-USES-5',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: {
      async runConversion(input) {
        assert.equal(input.conversionKey, 'images_to_pdf');
        assert.equal(input.session.codeId, 9);
        assert.equal(input.files.length, 1);
        assert.equal(input.files[0].fileName, 'sample.png');

        return {
          conversionId: 41,
          status: 'completed',
          files: [
            {
              fileName: 'sample.pdf',
              downloadUrl: '/api/downloads/conversions/41/sample.pdf'
            }
          ]
        };
      }
    }
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=buyer-token-1'
      },
      body: JSON.stringify({
        conversionKey: 'images_to_pdf',
        files: [
          {
            fileName: 'sample.png',
            contentBase64: Buffer.from('hello').toString('base64')
          }
        ]
      })
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      conversion: {
        id: 41,
        status: 'completed',
        files: [
          {
            fileName: 'sample.pdf',
            downloadUrl: '/api/downloads/conversions/41/sample.pdf'
          }
        ]
      }
    });
  } finally {
    await close(server);
  }
});

test('POST /api/conversions/run accepts multipart/form-data uploads and forwards disk-backed files', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-1',
    role: 'buyer',
    codeId: 15,
    codeValue: 'DEMO-USES-5',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const uploadTempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-upload-'));

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    conversionRepository: createNoopConversionRepository(),
    sessionRepository,
    conversionService: {
      getCatalog() {
        return [];
      },
      async runConversion(input) {
        assert.equal(input.conversionKey, 'images_to_pdf');
        assert.equal(input.session.codeId, 15);
        assert.equal(input.files.length, 1);
        assert.equal(input.files[0].fileName, 'sample.png');
        assert.match(path.basename(input.files[0].tempPath), /^sample-.*\.png$/);
        assert.equal(fs.existsSync(input.files[0].tempPath), true);

        return {
          conversionId: 52,
          status: 'completed',
          files: [
            {
              fileName: 'sample.pdf',
              downloadUrl: '/api/downloads/conversions/52/sample.pdf'
            }
          ]
        };
      }
    },
    uploadTempDirectory
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const form = new FormData();
    form.append('conversionKey', 'images_to_pdf');
    form.append(
      'files',
      new Blob([Buffer.from('fake-image')], { type: 'image/png' }),
      'sample.png'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-1'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      conversion: {
        id: 52,
        status: 'completed',
        files: [
          {
            fileName: 'sample.pdf',
            downloadUrl: '/api/downloads/conversions/52/sample.pdf'
          }
        ]
      }
    });
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run decodes multipart Chinese filenames before forwarding them to conversion logic', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-2',
    role: 'buyer',
    codeId: 16,
    codeValue: 'DEMO-USES-5',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const uploadTempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-upload-'));

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    conversionRepository: createNoopConversionRepository(),
    sessionRepository,
    conversionService: {
      getCatalog() {
        return [];
      },
      async runConversion(input) {
        assert.equal(input.files[0].fileName, '大白鹅（修改）.docx');

        return {
          conversionId: 53,
          status: 'completed',
          files: [
            {
              fileName: '大白鹅（修改）.pdf',
              downloadUrl: '/api/downloads/conversions/53/%E5%A4%A7%E7%99%BD%E9%B9%85%EF%BC%88%E4%BF%AE%E6%94%B9%EF%BC%89.pdf'
            }
          ]
        };
      }
    },
    uploadTempDirectory
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const form = new FormData();
    form.append('conversionKey', 'word_to_pdf');
    form.append(
      'files',
      new Blob([Buffer.from('fake-doc')], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      '大白鹅（修改）.docx'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-2'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, '大白鹅（修改）.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run returns a validation error for malformed payloads', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-2',
    role: 'buyer',
    codeId: 10,
    codeValue: 'DEMO-DAYS-7',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: createNoopConversionService()
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=buyer-token-2'
      },
      body: JSON.stringify({
        conversionKey: '',
        files: []
      })
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      ok: false,
      reason: 'INVALID_CONVERSION_REQUEST'
    });
  } finally {
    await close(server);
  }
});

test('POST /api/conversions/run returns a 400 when the selected Word file is unsupported in the current environment', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-3',
    role: 'buyer',
    codeId: 11,
    codeValue: 'DEMO-DAYS-7',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionRepository: createNoopConversionRepository(),
    conversionService: {
      getCatalog() {
        return [];
      },
      async runConversion() {
        const error = new Error('当前环境仅支持 .docx。若要转换 .doc，请先安装 LibreOffice。');
        error.statusCode = 400;
        error.reason = 'UNSUPPORTED_WORD_FORMAT';
        throw error;
      }
    }
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=buyer-token-3'
      },
      body: JSON.stringify({
        conversionKey: 'word_to_pdf',
        files: [
          {
            fileName: 'legacy.doc',
            contentBase64: Buffer.from('fake-doc-content').toString('base64')
          }
        ]
      })
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      ok: false,
      reason: 'UNSUPPORTED_WORD_FORMAT',
      message: '当前环境仅支持 .docx。若要转换 .doc，请先安装 LibreOffice。'
    });
  } finally {
    await close(server);
  }
});

test('POST /api/conversions/run returns a JSON 413 payload when request body exceeds the configured limit', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-4',
    role: 'buyer',
    codeId: 12,
    codeValue: 'DEMO-DAYS-7',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionRepository: createNoopConversionRepository(),
    conversionService: createNoopConversionService(),
    jsonLimit: '1kb'
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'pdf_converter_session=buyer-token-4'
      },
      body: JSON.stringify({
        conversionKey: 'pdf_to_images',
        files: [
          {
            fileName: 'large.pdf',
            contentBase64: 'a'.repeat(5_000)
          }
        ]
      })
    });

    const body = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(body, {
      ok: false,
      reason: 'PAYLOAD_TOO_LARGE',
      message: '上传文件过大，请压缩文件后重试。'
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

function createNoopConversionRepository() {
  return {
    listRecent() {
      return [];
    },
    findById() {
      return null;
    }
  };
}

function createNoopConversionService() {
  return {
    runConversion() {
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
