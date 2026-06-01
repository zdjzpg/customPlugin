const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { createConversionService } = require('../server/services/conversionService.cjs');
const PYTHON_BIN =
  'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';

test('catalog exposes docx-only Word conversion when LibreOffice is unavailable', () => {
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: os.tmpdir(),
    pythonBin:
      'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
    libreOfficeBin: ''
  });

  assert.deepEqual(conversionService.getCatalog()[0], {
    key: 'word_to_pdf',
    label: 'Word -> PDF',
    status: 'available',
    accepts: '.docx',
    maxFileSizeMb: 20,
    helperText: '当前仅支持 .docx，建议单个文件不超过 20MB。'
  });
});

test('catalog exposes doc and docx Word conversion when LibreOffice is available', () => {
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: os.tmpdir(),
    pythonBin:
      'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
    libreOfficeBin: 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
  });

  assert.deepEqual(conversionService.getCatalog()[0], {
    key: 'word_to_pdf',
    label: 'Word -> PDF',
    status: 'available',
    accepts: '.doc,.docx',
    maxFileSizeMb: 20,
    helperText: '支持 .doc 和 .docx，建议单个文件不超过 20MB。'
  });
});

test('images_to_pdf writes a PDF output file using the bundled Python runtime', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const createdRecords = [];
  const updatedRecords = [];

  const conversionService = createConversionService({
    conversionRepository: {
      create(input) {
        createdRecords.push(input);
        return { id: 1 };
      },
      markCompleted(id, outputFiles) {
        updatedRecords.push({ id, status: 'completed', outputFiles });
      },
      markFailed(id, errorMessage) {
        updatedRecords.push({ id, status: 'failed', errorMessage });
      }
    },
    storageRoot: tempRoot,
    pythonBin:
      'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe'
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'images_to_pdf',
      files: [
        {
          fileName: 'pixel.png',
          contentBase64:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZLzQAAAAASUVORK5CYII='
        }
      ]
    });

    assert.equal(result.conversionId, 1);
    assert.equal(result.status, 'completed');
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'pixel.pdf');
    assert.match(result.files[0].downloadUrl, /\/api\/downloads\/conversions\/1\/pixel\.pdf$/);

    const outputPath = path.join(
      tempRoot,
      'conversions',
      '1',
      'outputs',
      result.files[0].fileName
    );
    const outputBuffer = fs.readFileSync(outputPath);

    assert.match(outputBuffer.toString('utf8', 0, 4), /^%PDF/);
    assert.equal(createdRecords.length, 1);
    assert.deepEqual(updatedRecords, [
      {
        id: 1,
        status: 'completed',
        outputFiles: [
          {
            fileName: 'pixel.pdf',
            relativePath: path.join('conversions', '1', 'outputs', 'pixel.pdf')
          }
        ]
      }
    ]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('images_to_pdf keeps readable Chinese filename stems instead of replacing them with underscores', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin:
      'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe'
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'images_to_pdf',
      files: [
        {
          fileName: '少儿教育叙词-问卷报告.png',
          contentBase64:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZLzQAAAAASUVORK5CYII='
        }
      ]
    });

    assert.equal(result.files[0].fileName, '少儿教育叙词-问卷报告.pdf');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('pdf_to_images returns a single zip download artifact instead of exposing page images individually', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN,
    popplerBinDir: path.join(
      'D:',
      'aa-workplace',
      'customPlugin',
      'codex-pdf-converter-web',
      'pdf-converter-web',
      'tools',
      'poppler',
      'poppler-25.07.0',
      'Library',
      'bin'
    )
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'pdf_to_images',
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'storybook-images.zip');
    const zipPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-images.zip');
    assert.equal(fs.existsSync(zipPath), true);
    assert.ok(fs.statSync(zipPath).size > 0);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('word_to_pdf rejects .doc files without LibreOffice as a validation error', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin:
      'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
    libreOfficeBin: ''
  });

  try {
    await assert.rejects(
      () =>
        conversionService.runConversion({
          session: {
            codeId: 9,
            codeValue: 'DEMO-USES-5'
          },
          conversionKey: 'word_to_pdf',
          files: [
            {
              fileName: 'legacy.doc',
              contentBase64: Buffer.from('fake-doc-content').toString('base64')
            }
          ]
        }),
      (error) =>
        error.message === '当前环境仅支持 .docx。若要转换 .doc，请先安装 LibreOffice。' &&
        error.statusCode === 400 &&
        error.reason === 'UNSUPPORTED_WORD_FORMAT'
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function createNoopConversionRepository() {
  return {
    create() {
      return { id: 999 };
    },
    markCompleted() {},
    markFailed() {}
  };
}

function writePdfFixture(outputPath) {
  const script = `
from reportlab.pdfgen import canvas
c = canvas.Canvas(r"${outputPath.replace(/\\/g, '\\\\')}")
c.drawString(72, 720, "storybook page 1")
c.showPage()
c.drawString(72, 720, "storybook page 2")
c.save()
`;
  execFileSync(PYTHON_BIN, ['-c', script], { stdio: 'ignore' });
}
