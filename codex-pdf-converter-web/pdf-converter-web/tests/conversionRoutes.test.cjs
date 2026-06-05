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
    usageStatsRepository: {
      recordConversionStart(input) {
        assert.equal(input.conversionKey, 'images_to_pdf');
        assert.equal(input.codeId, 9);
      }
    },
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

test('POST /api/conversions/run forwards multiple PDF files in multipart order for merge_pdf', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-merge-1',
    role: 'buyer',
    codeId: 19,
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
        assert.equal(input.conversionKey, 'merge_pdf');
        assert.equal(input.files.length, 2);
        assert.deepEqual(
          input.files.map((file) => file.fileName),
          ['chapter-2.pdf', 'chapter-1.pdf']
        );

        return {
          conversionId: 55,
          status: 'completed',
          files: [
            {
              fileName: 'merged.pdf',
              downloadUrl: '/api/downloads/conversions/55/merged.pdf'
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
    form.append('conversionKey', 'merge_pdf');
    form.append(
      'files',
      new Blob([Buffer.from('fake-pdf-2')], { type: 'application/pdf' }),
      'chapter-2.pdf'
    );
    form.append(
      'files',
      new Blob([Buffer.from('fake-pdf-1')], { type: 'application/pdf' }),
      'chapter-1.pdf'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-merge-1'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'merged.pdf');
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

test('POST /api/conversions/run forwards parsed conversionOptions from multipart form-data', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-3',
    role: 'buyer',
    codeId: 17,
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
        assert.deepEqual(input.conversionOptions, {
          rangeText: '3,1,5-6',
          structuredRanges: [
            {
              startPage: 2,
              endPage: 4
            }
          ]
        });

        return {
          conversionId: 54,
          status: 'completed',
          files: [
            {
              fileName: 'storybook-extracted.pdf',
              downloadUrl: '/api/downloads/conversions/54/storybook-extracted.pdf'
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
    form.append('conversionKey', 'pdf_extract_pages');
    form.append(
      'conversionOptions',
      JSON.stringify({
        rangeText: '3,1,5-6',
        structuredRanges: [
          {
            startPage: 2,
            endPage: 4
          }
        ]
      })
    );
    form.append(
      'files',
      new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }),
      'storybook.pdf'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-3'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-extracted.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run accepts fileless qr_generate JSON requests', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-qr-generate',
    role: 'buyer',
    codeId: 18,
    codeValue: 'DEMO-DAYS-7',
    expiresAt: '2099-06-08T10:00:00.000Z'
  });

  const app = createApp({
    authService: createNoopAuthService(),
    redemptionCodeService: createNoopRedemptionCodeService(),
    codeRepository: createNoopCodeRepository(),
    sessionRepository,
    conversionService: {
      getCatalog() {
        return [];
      },
      async runConversion(input) {
        assert.equal(input.conversionKey, 'qr_generate');
        assert.equal(input.files.length, 0);
        assert.deepEqual(input.conversionOptions, {
          qrText: 'hello qr',
          sizePx: 320
        });
        return {
          conversionId: 88,
          status: 'completed',
          files: [
            {
              fileName: 'qr-code.png',
              downloadUrl: '/api/downloads/conversions/88/qr-code.png'
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
        cookie: 'pdf_converter_session=buyer-token-qr-generate'
      },
      body: JSON.stringify({
        conversionKey: 'qr_generate',
        conversionOptions: {
          qrText: 'hello qr',
          sizePx: 320
        }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'qr-code.png');
  } finally {
    await close(server);
  }
});

test('POST /api/conversions/run returns a validation error when multipart conversionOptions is invalid JSON', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-4',
    role: 'buyer',
    codeId: 18,
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
    conversionService: createNoopConversionService(),
    uploadTempDirectory
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const form = new FormData();
    form.append('conversionKey', 'pdf_extract_pages');
    form.append('conversionOptions', '{"rangeText": ');
    form.append(
      'files',
      new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }),
      'storybook.pdf'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-4'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      ok: false,
      reason: 'INVALID_CONVERSION_REQUEST'
    });
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards compression level options for compress_pdf', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-compress-1',
    role: 'buyer',
    codeId: 20,
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
        assert.equal(input.conversionKey, 'compress_pdf');
        assert.deepEqual(input.conversionOptions, {
          compressionLevel: 'strong'
        });

        return {
          conversionId: 56,
          status: 'completed',
          files: [
            {
              fileName: 'catalog-compressed.pdf',
              downloadUrl: '/api/downloads/conversions/56/catalog-compressed.pdf'
            }
          ],
          summary: {
            inputSizeBytes: 5000000,
            outputSizeBytes: 2100000,
            savedBytes: 2900000,
            compressionLevel: 'strong'
          }
        };
      }
    },
    uploadTempDirectory
  });

  const server = http.createServer(app);
  await listen(server);

  try {
    const form = new FormData();
    form.append('conversionKey', 'compress_pdf');
    form.append(
      'conversionOptions',
      JSON.stringify({
        compressionLevel: 'strong'
      })
    );
    form.append(
      'files',
      new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }),
      'catalog.pdf'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-compress-1'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.conversion.summary.compressionLevel, 'strong');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards pdf_to_word mode and OCR language options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-word-1',
    role: 'buyer',
    codeId: 21,
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
        assert.equal(input.conversionKey, 'pdf_to_word');
        assert.deepEqual(input.conversionOptions, {
          pdfToWordMode: 'ocr',
          ocrLanguage: 'chi_sim+eng'
        });

        return {
          conversionId: 57,
          status: 'completed',
          files: [
            {
              fileName: 'scan.docx',
              downloadUrl: '/api/downloads/conversions/57/scan.docx'
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
    form.append('conversionKey', 'pdf_to_word');
    form.append(
      'conversionOptions',
      JSON.stringify({
        pdfToWordMode: 'ocr',
        ocrLanguage: 'chi_sim+eng'
      })
    );
    form.append(
      'files',
      new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }),
      'scan.pdf'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-word-1'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'scan.docx');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards scan_to_searchable_pdf OCR options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-searchable-1',
    role: 'buyer',
    codeId: 211,
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
        assert.equal(input.conversionKey, 'scan_to_searchable_pdf');
        assert.deepEqual(input.conversionOptions, {
          ocrLanguage: 'eng'
        });
        assert.equal(input.files[0].fileName, 'scan.pdf');
        return {
          conversionId: 571,
          status: 'completed',
          files: [
            {
              fileName: 'scan-searchable.pdf',
              downloadUrl: '/api/downloads/conversions/571/scan-searchable.pdf'
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
    form.append('conversionKey', 'scan_to_searchable_pdf');
    form.append('conversionOptions', JSON.stringify({ ocrLanguage: 'eng' }));
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'scan.pdf');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-searchable-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'scan-searchable.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards watermark options and separate watermark image uploads', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-watermark-1',
    role: 'buyer',
    codeId: 22,
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
        assert.equal(input.conversionKey, 'watermark_pdf');
        assert.deepEqual(input.conversionOptions, {
          watermarkType: 'image',
          imagePosition: 'center',
          imageScalePercent: 40,
          opacity: 0.3
        });
        assert.equal(input.files.length, 2);
        assert.equal(input.files[0].fieldName, 'files');
        assert.equal(input.files[1].fieldName, 'watermarkImage');

        return {
          conversionId: 58,
          status: 'completed',
          files: [
            {
              fileName: 'storybook-watermarked.pdf',
              downloadUrl: '/api/downloads/conversions/58/storybook-watermarked.pdf'
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
    form.append('conversionKey', 'watermark_pdf');
    form.append(
      'conversionOptions',
      JSON.stringify({
        watermarkType: 'image',
        imagePosition: 'center',
        imageScalePercent: 40,
        opacity: 0.3
      })
    );
    form.append(
      'files',
      new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }),
      'storybook.pdf'
    );
    form.append(
      'watermarkImage',
      new Blob([Buffer.from('fake-image')], { type: 'image/png' }),
      'stamp.png'
    );

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: {
        cookie: 'pdf_converter_session=buyer-token-form-watermark-1'
      },
      body: form
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-watermarked.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards page-number options for add_page_numbers_pdf', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-number-1',
    role: 'buyer',
    codeId: 23,
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
        assert.equal(input.conversionKey, 'add_page_numbers_pdf');
        assert.deepEqual(input.conversionOptions, {
          pageNumberPosition: 'footer_center',
          pageNumberStart: 3,
          pageNumberFormat: 'cn_page'
        });
        return {
          conversionId: 59,
          status: 'completed',
          files: [
            {
              fileName: 'storybook-numbered.pdf',
              downloadUrl: '/api/downloads/conversions/59/storybook-numbered.pdf'
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
    form.append('conversionKey', 'add_page_numbers_pdf');
    form.append('conversionOptions', JSON.stringify({
      pageNumberPosition: 'footer_center',
      pageNumberStart: 3,
      pageNumberFormat: 'cn_page'
    }));
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'storybook.pdf');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-number-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-numbered.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards sign/stamp options and separate stamp image uploads', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-stamp-1',
    role: 'buyer',
    codeId: 24,
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
        assert.equal(input.conversionKey, 'sign_stamp_pdf');
        assert.deepEqual(input.conversionOptions, {
          stampSourceType: 'image',
          stampPosition: 'bottom_right',
          stampScalePercent: 35,
          opacity: 0.4
        });
        assert.equal(input.files[1].fieldName, 'stampImage');
        return {
          conversionId: 60,
          status: 'completed',
          files: [
            {
              fileName: 'storybook-signed.pdf',
              downloadUrl: '/api/downloads/conversions/60/storybook-signed.pdf'
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
    form.append('conversionKey', 'sign_stamp_pdf');
    form.append('conversionOptions', JSON.stringify({
      stampSourceType: 'image',
      stampPosition: 'bottom_right',
      stampScalePercent: 35,
      opacity: 0.4
    }));
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'storybook.pdf');
    form.append('stampImage', new Blob([Buffer.from('fake-image')], { type: 'image/png' }), 'stamp.png');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-stamp-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-signed.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards multiple pdf files and one stamp image for batch_sign_stamp_pdf', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-batch-stamp-1',
    role: 'buyer',
    codeId: 24,
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
        assert.equal(input.conversionKey, 'batch_sign_stamp_pdf');
        assert.deepEqual(input.conversionOptions, {
          stampSourceType: 'image',
          stampPosition: 'bottom_right',
          stampScalePercent: 35,
          opacity: 0.4
        });
        assert.deepEqual(
          input.files.map((file) => ({ fieldName: file.fieldName, fileName: file.fileName })),
          [
            { fieldName: 'files', fileName: 'contract-a.pdf' },
            { fieldName: 'files', fileName: 'contract-b.pdf' },
            { fieldName: 'stampImage', fileName: 'stamp.png' }
          ]
        );
        return {
          conversionId: 62,
          status: 'completed',
          files: [
            {
              fileName: 'batch-stamped-pdfs.zip',
              downloadUrl: '/api/downloads/conversions/62/batch-stamped-pdfs.zip'
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
    form.append('conversionKey', 'batch_sign_stamp_pdf');
    form.append('conversionOptions', JSON.stringify({
      stampSourceType: 'image',
      stampPosition: 'bottom_right',
      stampScalePercent: 35,
      opacity: 0.4
    }));
    form.append('files', new Blob([Buffer.from('fake-pdf-a')], { type: 'application/pdf' }), 'contract-a.pdf');
    form.append('files', new Blob([Buffer.from('fake-pdf-b')], { type: 'application/pdf' }), 'contract-b.pdf');
    form.append('stampImage', new Blob([Buffer.from('fake-image')], { type: 'image/png' }), 'stamp.png');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-batch-stamp-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'batch-stamped-pdfs.zip');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards rotation angle options for rotate_pdf', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-rotate-1',
    role: 'buyer',
    codeId: 25,
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
        assert.equal(input.conversionKey, 'rotate_pdf');
        assert.deepEqual(input.conversionOptions, {
          rotationAngle: 270
        });
        return {
          conversionId: 61,
          status: 'completed',
          files: [
            {
              fileName: 'storybook-rotated.pdf',
              downloadUrl: '/api/downloads/conversions/61/storybook-rotated.pdf'
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
    form.append('conversionKey', 'rotate_pdf');
    form.append('conversionOptions', JSON.stringify({ rotationAngle: 270 }));
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'storybook.pdf');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-rotate-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-rotated.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards Excel conversion requests', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-excel-1',
    role: 'buyer',
    codeId: 26,
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
        assert.equal(input.conversionKey, 'excel_to_pdf');
        assert.equal(input.files[0].fileName, 'report.xlsx');
        return {
          conversionId: 62,
          status: 'completed',
          files: [
            {
              fileName: 'report.pdf',
              downloadUrl: '/api/downloads/conversions/62/report.pdf'
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
    form.append('conversionKey', 'excel_to_pdf');
    form.append('files', new Blob([Buffer.from('fake-excel')], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'report.xlsx');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-excel-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'report.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards PPT conversion requests', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-ppt-1',
    role: 'buyer',
    codeId: 27,
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
        assert.equal(input.conversionKey, 'ppt_to_pdf');
        assert.equal(input.files[0].fileName, 'deck.pptx');
        return {
          conversionId: 63,
          status: 'completed',
          files: [
            {
              fileName: 'deck.pdf',
              downloadUrl: '/api/downloads/conversions/63/deck.pdf'
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
    form.append('conversionKey', 'ppt_to_pdf');
    form.append('files', new Blob([Buffer.from('fake-ppt')], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), 'deck.pptx');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-ppt-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'deck.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards PDF-to-PPT conversion requests', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-pdf-to-ppt-1',
    role: 'buyer',
    codeId: 271,
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
        assert.equal(input.conversionKey, 'pdf_to_pptx');
        assert.equal(input.files[0].fileName, 'deck.pdf');
        return {
          conversionId: 631,
          status: 'completed',
          files: [
            {
              fileName: 'deck.pptx',
              downloadUrl: '/api/downloads/conversions/631/deck.pptx'
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
    form.append('conversionKey', 'pdf_to_pptx');
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'deck.pdf');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-pdf-to-ppt-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'deck.pptx');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards batch Word conversion requests in upload order', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-batch-word-1',
    role: 'buyer',
    codeId: 272,
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
        assert.equal(input.conversionKey, 'batch_word_to_pdf');
        assert.deepEqual(
          input.files.map((file) => file.fileName),
          ['chapter-2.docx', 'chapter-1.docx']
        );
        return {
          conversionId: 632,
          status: 'completed',
          files: [
            {
              fileName: 'batch-word-to-pdf.zip',
              downloadUrl: '/api/downloads/conversions/632/batch-word-to-pdf.zip'
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
    form.append('conversionKey', 'batch_word_to_pdf');
    form.append('files', new Blob([Buffer.from('fake-docx-2')], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'chapter-2.docx');
    form.append('files', new Blob([Buffer.from('fake-docx-1')], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'chapter-1.docx');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-batch-word-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'batch-word-to-pdf.zip');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards exam cleanup options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-exam-1',
    role: 'buyer',
    codeId: 273,
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
        assert.equal(input.conversionKey, 'exam_paper_cleanup');
        assert.deepEqual(input.conversionOptions, {
          outputMode: 'pdf',
          cleanupMode: 'binary',
          splitDoublePage: true,
          enhanceContrast: true
        });
        return {
          conversionId: 633,
          status: 'completed',
          files: [
            {
              fileName: 'paper-cleaned.pdf',
              downloadUrl: '/api/downloads/conversions/633/paper-cleaned.pdf'
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
    form.append('conversionKey', 'exam_paper_cleanup');
    form.append('conversionOptions', JSON.stringify({
      outputMode: 'pdf',
      cleanupMode: 'binary',
      splitDoublePage: true,
      enhanceContrast: true
    }));
    form.append('files', new Blob([Buffer.from('fake-image')], { type: 'image/png' }), 'paper.png');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-exam-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'paper-cleaned.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards image-to-Word OCR options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-image-word-1',
    role: 'buyer',
    codeId: 274,
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
        assert.equal(input.conversionKey, 'images_to_word');
        assert.deepEqual(input.conversionOptions, {
          ocrLanguage: 'chi_sim+eng'
        });
        assert.equal(input.files[0].fileName, 'lesson.png');
        return {
          conversionId: 634,
          status: 'completed',
          files: [
            {
              fileName: 'lesson-images.docx',
              downloadUrl: '/api/downloads/conversions/634/lesson-images.docx'
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
    form.append('conversionKey', 'images_to_word');
    form.append('conversionOptions', JSON.stringify({ ocrLanguage: 'chi_sim+eng' }));
    form.append('files', new Blob([Buffer.from('fake-image')], { type: 'image/png' }), 'lesson.png');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-image-word-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'lesson-images.docx');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards PDF-to-Excel conversion requests', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-pdf-excel-1',
    role: 'buyer',
    codeId: 275,
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
        assert.equal(input.conversionKey, 'pdf_to_excel');
        assert.equal(input.files[0].fileName, 'table.pdf');
        return {
          conversionId: 635,
          status: 'completed',
          files: [
            {
              fileName: 'table.xlsx',
              downloadUrl: '/api/downloads/conversions/635/table.xlsx'
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
    form.append('conversionKey', 'pdf_to_excel');
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'table.pdf');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-pdf-excel-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'table.xlsx');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards image-table-to-Excel OCR options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-image-excel-1',
    role: 'buyer',
    codeId: 276,
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
        assert.equal(input.conversionKey, 'image_table_to_excel');
        assert.deepEqual(input.conversionOptions, {
          ocrLanguage: 'eng'
        });
        assert.equal(input.files[0].fileName, 'table.png');
        return {
          conversionId: 636,
          status: 'completed',
          files: [
            {
              fileName: 'table.xlsx',
              downloadUrl: '/api/downloads/conversions/636/table.xlsx'
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
    form.append('conversionKey', 'image_table_to_excel');
    form.append('conversionOptions', JSON.stringify({ ocrLanguage: 'eng' }));
    form.append('files', new Blob([Buffer.from('fake-image')], { type: 'image/png' }), 'table.png');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, {
      method: 'POST',
      headers: { cookie: 'pdf_converter_session=buyer-token-form-image-excel-1' },
      body: form
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'table.xlsx');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards delete-pages options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-delete-1',
    role: 'buyer',
    codeId: 28,
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
      getCatalog() { return []; },
      async runConversion(input) {
        assert.equal(input.conversionKey, 'delete_pages_pdf');
        assert.deepEqual(input.conversionOptions, { rangeText: '2,4' });
        return {
          conversionId: 64,
          status: 'completed',
          files: [{ fileName: 'storybook-deleted-pages.pdf', downloadUrl: '/api/downloads/conversions/64/storybook-deleted-pages.pdf' }]
        };
      }
    },
    uploadTempDirectory
  });
  const server = http.createServer(app);
  await listen(server);
  try {
    const form = new FormData();
    form.append('conversionKey', 'delete_pages_pdf');
    form.append('conversionOptions', JSON.stringify({ rangeText: '2,4' }));
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'storybook.pdf');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, { method: 'POST', headers: { cookie: 'pdf_converter_session=buyer-token-form-delete-1' }, body: form });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-deleted-pages.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards reorder-pages options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-reorder-1',
    role: 'buyer',
    codeId: 29,
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
      getCatalog() { return []; },
      async runConversion(input) {
        assert.equal(input.conversionKey, 'reorder_pages_pdf');
        assert.deepEqual(input.conversionOptions, { orderText: '3,1,2' });
        return {
          conversionId: 65,
          status: 'completed',
          files: [{ fileName: 'storybook-reordered.pdf', downloadUrl: '/api/downloads/conversions/65/storybook-reordered.pdf' }]
        };
      }
    },
    uploadTempDirectory
  });
  const server = http.createServer(app);
  await listen(server);
  try {
    const form = new FormData();
    form.append('conversionKey', 'reorder_pages_pdf');
    form.append('conversionOptions', JSON.stringify({ orderText: '3,1,2' }));
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'storybook.pdf');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, { method: 'POST', headers: { cookie: 'pdf_converter_session=buyer-token-form-reorder-1' }, body: form });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-reordered.pdf');
  } finally {
    await close(server);
    fs.rmSync(uploadTempDirectory, { recursive: true, force: true });
  }
});

test('POST /api/conversions/run forwards protect/unlock options', async () => {
  const sessionRepository = createInMemorySessionRepository();
  sessionRepository.save({
    token: 'buyer-token-form-protect-1',
    role: 'buyer',
    codeId: 30,
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
      getCatalog() { return []; },
      async runConversion(input) {
        assert.equal(input.conversionKey, 'protect_unlock_pdf');
        assert.deepEqual(input.conversionOptions, {
          mode: 'protect',
          password: 'Abcd1234',
          confirmPassword: 'Abcd1234'
        });
        return {
          conversionId: 66,
          status: 'completed',
          files: [{ fileName: 'storybook-protected.pdf', downloadUrl: '/api/downloads/conversions/66/storybook-protected.pdf' }]
        };
      }
    },
    uploadTempDirectory
  });
  const server = http.createServer(app);
  await listen(server);
  try {
    const form = new FormData();
    form.append('conversionKey', 'protect_unlock_pdf');
    form.append('conversionOptions', JSON.stringify({ mode: 'protect', password: 'Abcd1234', confirmPassword: 'Abcd1234' }));
    form.append('files', new Blob([Buffer.from('fake-pdf')], { type: 'application/pdf' }), 'storybook.pdf');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversions/run`, { method: 'POST', headers: { cookie: 'pdf_converter_session=buyer-token-form-protect-1' }, body: form });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.conversion.files[0].fileName, 'storybook-protected.pdf');
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
