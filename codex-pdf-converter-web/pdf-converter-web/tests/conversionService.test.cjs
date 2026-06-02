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

test('catalog exposes PDF to Word, merge, compression, extract-pages, and split tools', () => {
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: os.tmpdir(),
    pythonBin: PYTHON_BIN,
    ghostscriptBin: 'C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe',
    ocrmypdfBin: 'C:\\Tools\\ocrmypdf.exe'
  });

  const catalog = conversionService.getCatalog();

  const targetedCatalog = catalog.filter((item) =>
    ['pdf_to_word', 'merge_pdf', 'compress_pdf', 'pdf_extract_pages', 'split_pdf'].includes(item.key)
  );

  assert.deepEqual(targetedCatalog, [
    {
      key: 'pdf_to_word',
      label: 'PDF 转 Word',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持文本型 PDF 直接转 Word，也支持 OCR 识别扫描件后导出 Word。'
    },
    {
      key: 'merge_pdf',
      label: 'PDF 合并',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 20,
      maxTotalFileSizeMb: 60,
      helperText: '可一次上传多个 PDF，按当前顺序合并为一个 PDF。'
    },
    {
      key: 'compress_pdf',
      label: 'PDF 压缩',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '可选标准压缩或强力压缩，并显示压缩前后体积对比。'
    },
    {
      key: 'pdf_extract_pages',
      label: 'PDF 提取页面',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 20,
      helperText: '输入页码范围后提取为一个新的 PDF，例如 1,3,5-8。'
    },
    {
      key: 'split_pdf',
      label: '拆分 PDF',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 20,
      helperText: '按范围拆成多个 PDF，并统一打包为 ZIP 下载。'
    }
  ]);
});

test('pdf_to_word converts a text PDF into an editable docx without OCR', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'brochure.pdf');
  writePdfFixture(inputPdfPath, ['brochure page 1', 'brochure page 2']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'pdf_to_word',
      conversionOptions: {
        pdfToWordMode: 'no_ocr'
      },
      files: [
        {
          fileName: 'brochure.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'brochure.docx');

    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'brochure.docx');
    assert.equal(fs.existsSync(outputPath), true);
    assert.match(readDocxText(outputPath), /brochure page 1/);
    assert.match(readDocxText(outputPath), /brochure page 2/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('pdf_to_word can run OCR mode before exporting to docx when OCRmyPDF is configured', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'scan.pdf');
  writePdfFixture(inputPdfPath, ['scan page 1']);
  const fakeOcrmypdfPath = writeFakeOcrmypdf(tempRoot);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN,
    ocrmypdfBin: fakeOcrmypdfPath
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'pdf_to_word',
      conversionOptions: {
        pdfToWordMode: 'ocr',
        ocrLanguage: 'chi_sim+eng'
      },
      files: [
        {
          fileName: 'scan.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'scan.docx');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'scan.docx');
    assert.equal(fs.existsSync(outputPath), true);
    assert.match(readDocxText(outputPath), /scan page 1/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('compress_pdf returns a compressed PDF plus size comparison metadata', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'catalog.pdf');
  writePdfFixture(inputPdfPath, ['catalog page 1', 'catalog page 2', 'catalog page 3']);
  const fakeGhostscriptPath = writeFakeGhostscript(tempRoot);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN,
    ghostscriptBin: fakeGhostscriptPath
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'compress_pdf',
      conversionOptions: {
        compressionLevel: 'standard'
      },
      files: [
        {
          fileName: 'catalog.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'catalog-compressed.pdf');
    assert.equal(result.summary.inputSizeBytes > 0, true);
    assert.equal(result.summary.outputSizeBytes > 0, true);
    assert.equal(result.summary.inputSizeBytes > result.summary.outputSizeBytes, true);
    assert.equal(result.summary.savedBytes, result.summary.inputSizeBytes - result.summary.outputSizeBytes);
    assert.equal(result.summary.compressionLevel, 'standard');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('merge_pdf combines multiple PDFs in the provided order into one output file', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const firstPdfPath = path.join(tempRoot, 'chapter-2.pdf');
  const secondPdfPath = path.join(tempRoot, 'chapter-1.pdf');
  writePdfFixture(firstPdfPath, ['chapter 2 page 1', 'chapter 2 page 2']);
  writePdfFixture(secondPdfPath, ['chapter 1 page 1']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'merge_pdf',
      files: [
        {
          fileName: 'chapter-2.pdf',
          tempPath: firstPdfPath
        },
        {
          fileName: 'chapter-1.pdf',
          tempPath: secondPdfPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'merged.pdf');

    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'merged.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    assert.deepEqual(readPdfPageTexts(outputPath), [
      'chapter 2 page 1',
      'chapter 2 page 2',
      'chapter 1 page 1'
    ]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
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

test('pdf_extract_pages writes one PDF and preserves the user-entered page order', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, ['storybook page 1', 'storybook page 2', 'storybook page 3']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'pdf_extract_pages',
      conversionOptions: {
        rangeText: '3,1,2-3'
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'storybook-extracted.pdf');

    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-extracted.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    assert.deepEqual(readPdfPageTexts(outputPath), [
      'storybook page 3',
      'storybook page 1',
      'storybook page 2',
      'storybook page 3'
    ]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('split_pdf returns one zip that contains one PDF per requested range', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, [
    'storybook page 1',
    'storybook page 2',
    'storybook page 3',
    'storybook page 4'
  ]);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: {
        codeId: 9,
        codeValue: 'DEMO-USES-5'
      },
      conversionKey: 'split_pdf',
      conversionOptions: {
        rangeText: '1-2\n4\n2-3'
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'storybook-split.zip');

    const zipPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-split.zip');
    assert.equal(fs.existsSync(zipPath), true);
    assert.deepEqual(readZippedPdfTexts(zipPath), {
      'storybook-part-1.pdf': ['storybook page 1', 'storybook page 2'],
      'storybook-part-2.pdf': ['storybook page 4'],
      'storybook-part-3.pdf': ['storybook page 2', 'storybook page 3']
    });
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

function writePdfFixture(outputPath, pageTexts = ['storybook page 1', 'storybook page 2']) {
  const lines = pageTexts
    .map((pageText, index) => {
      const escapedText = pageText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `${index > 0 ? 'c.showPage()\n' : ''}c.drawString(72, 720, "${escapedText}")`;
    })
    .join('\n');

  const script = `
from reportlab.pdfgen import canvas
c = canvas.Canvas(r"${outputPath.replace(/\\/g, '\\\\')}")
${lines}
c.save()
`;
  execFileSync(PYTHON_BIN, ['-c', script], { stdio: 'ignore' });
}

function readPdfPageTexts(pdfPath) {
  const script = `
from pypdf import PdfReader
reader = PdfReader(r"${pdfPath.replace(/\\/g, '\\\\')}")
for page in reader.pages:
    print((page.extract_text() or "").strip().replace("\\n", " "))
`;

  const output = execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readZippedPdfTexts(zipPath) {
  const script = `
from io import BytesIO
from zipfile import ZipFile
from pypdf import PdfReader

with ZipFile(r"${zipPath.replace(/\\/g, '\\\\')}") as archive:
    for name in sorted(archive.namelist()):
        reader = PdfReader(BytesIO(archive.read(name)))
        pages = [(page.extract_text() or "").strip().replace("\\n", " ") for page in reader.pages]
        print(name + "\t" + "|||".join(pages))
`;

  const output = execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((result, line) => {
      const tabIndex = line.indexOf('\t');
      const fileName = tabIndex === -1 ? line : line.slice(0, tabIndex);
      const pages = tabIndex === -1 ? '' : line.slice(tabIndex + 1);
      result[fileName] = pages ? pages.split('|||').filter(Boolean) : [];
      return result;
    }, {});
}

function readDocxText(docxPath) {
  const script = `
from docx import Document
document = Document(r"${docxPath.replace(/\\/g, '\\\\')}")
for paragraph in document.paragraphs:
    text = paragraph.text.strip()
    if text:
        print(text)
`;

  return execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function writeFakeGhostscript(tempRoot) {
  const scriptPath = path.join(tempRoot, 'fake-gs.cmd');
  const helperPath = path.join(tempRoot, 'fake_gs_helper.py');

  fs.writeFileSync(
    helperPath,
    `
import sys
from pathlib import Path
from pypdf import PdfReader, PdfWriter

output_arg = next(arg for arg in sys.argv[1:] if arg.startswith('-sOutputFile='))
output_path = output_arg.split('=', 1)[1]
input_path = sys.argv[-1]

reader = PdfReader(input_path)
writer = PdfWriter()
writer.add_page(reader.pages[0])

output = Path(output_path)
output.parent.mkdir(parents=True, exist_ok=True)
with output.open('wb') as file_obj:
    writer.write(file_obj)
`.trim(),
    'utf8'
  );

  fs.writeFileSync(
    scriptPath,
    `@echo off\r\n"${PYTHON_BIN}" "${helperPath}" %*\r\n`,
    'utf8'
  );

  return scriptPath;
}

function writeFakeOcrmypdf(tempRoot) {
  const scriptPath = path.join(tempRoot, 'fake-ocrmypdf.cmd');
  const helperPath = path.join(tempRoot, 'fake_ocrmypdf_helper.py');

  fs.writeFileSync(
    helperPath,
    `
import shutil
import sys
from pathlib import Path

input_path = sys.argv[-2]
output_path = sys.argv[-1]
output = Path(output_path)
output.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(input_path, output_path)
`.trim(),
    'utf8'
  );

  fs.writeFileSync(
    scriptPath,
    `@echo off\r\n"${PYTHON_BIN}" "${helperPath}" %*\r\n`,
    'utf8'
  );

  return scriptPath;
}
