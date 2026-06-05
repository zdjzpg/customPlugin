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

test('catalog exposes current office/pdf toolset including delete/reorder/protect tools', () => {
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: os.tmpdir(),
    pythonBin: PYTHON_BIN,
    ghostscriptBin: 'C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe',
    ocrmypdfBin: 'C:\\Tools\\ocrmypdf.exe'
  });

  const catalog = conversionService.getCatalog();

  const orderedKeys = [
    'delete_pages_pdf',
    'reorder_pages_pdf',
    'protect_unlock_pdf',
    'excel_to_pdf',
    'ppt_to_pdf',
    'pdf_to_pptx',
    'pdf_to_word',
    'watermark_pdf',
    'add_page_numbers_pdf',
    'sign_stamp_pdf',
    'batch_sign_stamp_pdf',
    'rotate_pdf',
    'merge_pdf',
    'compress_pdf',
    'pdf_extract_pages',
    'split_pdf'
  ];
  const targetedCatalog = orderedKeys
    .map((key) => catalog.find((item) => item.key === key))
    .filter(Boolean);

  assert.deepEqual(targetedCatalog, [
    {
      key: 'delete_pages_pdf',
      label: '删除 PDF 页面',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持页码输入和缩略图选择删除页面。'
    },
    {
      key: 'reorder_pages_pdf',
      label: '调整 PDF 页面顺序',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持页码输入和缩略图拖拽调整页面顺序。'
    },
    {
      key: 'protect_unlock_pdf',
      label: '保护 PDF / 解锁 PDF',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持设置打开密码，或输入已有密码后解锁 PDF。'
    },
    {
      key: 'excel_to_pdf',
      label: 'Excel 转 PDF',
      status: 'available',
      accepts: '.xlsx,.xls',
      maxFileSizeMb: 20,
      helperText: '支持 Excel 表格转 PDF，复杂分页按实际导出结果为准。'
    },
    {
      key: 'ppt_to_pdf',
      label: 'PPT 转 PDF',
      status: 'available',
      accepts: '.ppt,.pptx',
      maxFileSizeMb: 30,
      helperText: '支持 PPT 演示文稿转 PDF，动画和切换效果不保留。'
    },
    {
      key: 'pdf_to_pptx',
      label: 'PDF 转 PPT',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '适合把常见 PDF 内容快速整理成可修改 PPT，复杂排版可能会有偏差。'
    },
    {
      key: 'pdf_to_word',
      label: 'PDF 转 Word',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持文本型 PDF 直接转 Word，也支持 OCR 识别扫描件后导出 Word。'
    },
    {
      key: 'watermark_pdf',
      label: 'PDF 加水印',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持整份 PDF 添加文字水印或图片水印。'
    },
    {
      key: 'add_page_numbers_pdf',
      label: 'PDF 加页码',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持整份 PDF 统一添加页码。'
    },
    {
      key: 'sign_stamp_pdf',
      label: 'PDF 签名 / 盖章',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持上传签名图片或手写签名后整份统一盖章。'
    },
    {
      key: 'batch_sign_stamp_pdf',
      label: '批量 PDF 盖章',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 50,
      maxTotalFileSizeMb: 300,
      allowMultipleFiles: true,
      helperText: '可一次上传多个 PDF，按同一套盖章配置逐个处理后打包下载。'
    },
    {
      key: 'rotate_pdf',
      label: 'PDF 旋转页面',
      status: 'available',
      accepts: '.pdf',
      maxFileSizeMb: 30,
      helperText: '支持整份 PDF 统一旋转 90°、180°、270°。'
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

test('catalog exposes OCR and batch-rename tools under the text_tools category', () => {
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: os.tmpdir(),
    pythonBin: PYTHON_BIN,
    tesseractBin: 'C:\\Tools\\tesseract.exe'
  });

  const catalog = conversionService.getCatalog();
  const ocrTool = catalog.find((item) => item.key === 'ocr_text_extract');
  const renameTool = catalog.find((item) => item.key === 'batch_file_rename');

  assert.deepEqual(ocrTool, {
    key: 'ocr_text_extract',
    label: 'OCR 文字识别',
    categoryKey: 'text_tools',
    status: 'available',
    accepts: '.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff',
    maxFileSizeMb: 15,
    helperText: '支持截图和常见图片 OCR 识别，结果可下载为 TXT 文本。'
  });
  assert.deepEqual(renameTool, {
    key: 'batch_file_rename',
    label: '批量文件重命名',
    categoryKey: 'text_tools',
    status: 'available',
    accepts: '.txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.mp4,.zip',
    maxFileSizeMb: 50,
    maxTotalFileSizeMb: 200,
    allowMultipleFiles: true,
    helperText: '按模板批量重命名文件并打包下载，适合资料整理。'
  });
});

test('batch_file_rename outputs one renamed zip package', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const firstFilePath = path.join(tempRoot, '原图-A.png');
  const secondFilePath = path.join(tempRoot, '原图-B.png');
  fs.writeFileSync(firstFilePath, Buffer.from('a'));
  fs.writeFileSync(secondFilePath, Buffer.from('b'));

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'batch_file_rename',
      conversionOptions: {
        template: '资料-{n}-{name}',
        startNumber: 7,
        numberWidth: 2
      },
      files: [
        {
          fileName: '原图-A.png',
          tempPath: firstFilePath
        },
        {
          fileName: '原图-B.png',
          tempPath: secondFilePath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'renamed-files.zip');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'renamed-files.zip');
    assert.deepEqual(readZipEntryNames(outputPath), [
      '资料-07-原图-A.png',
      '资料-08-原图-B.png'
    ]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('ocr_text_extract writes recognized text into a txt file and summary preview', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputImagePath = path.join(tempRoot, 'ocr-source.png');
  writePngFixture(inputImagePath, 80, 40, '#ffffff');
  const fakeTesseractPath = writeFakeTesseract(tempRoot, '识别成功\n第二行文本');

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN,
    tesseractBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'ocr_text_extract',
      conversionOptions: {
        ocrLanguage: 'chi_sim+eng',
        tesseractScriptPath: fakeTesseractPath
      },
      files: [
        {
          fileName: 'ocr-source.png',
          tempPath: inputImagePath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'ocr-source-ocr.txt');
    assert.deepEqual(result.summary, {
      kind: 'text_preview',
      previewText: '识别成功\n第二行文本'
    });
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'ocr-source-ocr.txt');
    assert.equal(
      fs.readFileSync(outputPath, 'utf8').trim().replace(/\r\n/g, '\n'),
      '识别成功\n第二行文本'
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('image_heic_convert converts one heic file into a jpg output', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputImagePath = path.join(tempRoot, 'iphone-photo.heic');
  writeHeicFixture(inputImagePath, 64, 48, '#4d79ff');

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'image_heic_convert',
      conversionOptions: {
        outputFormat: 'jpg'
      },
      files: [
        {
          fileName: 'iphone-photo.heic',
          tempPath: inputImagePath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'iphone-photo-heic-converted.jpg');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'iphone-photo-heic-converted.jpg');
    assert.deepEqual(readImageMeta(outputPath), {
      format: 'JPEG',
      width: 64,
      height: 48
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('delete_pages_pdf removes selected pages and keeps the rest in original order', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, ['page 1', 'page 2', 'page 3', 'page 4']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'delete_pages_pdf',
      conversionOptions: {
        rangeText: '2,4'
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'storybook-deleted-pages.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-deleted-pages.pdf');
    assert.deepEqual(readPdfPageTexts(outputPath), ['page 1', 'page 3']);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('reorder_pages_pdf writes a new PDF in the requested order', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, ['page 1', 'page 2', 'page 3']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'reorder_pages_pdf',
      conversionOptions: {
        orderText: '3,1,2'
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'storybook-reordered.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-reordered.pdf');
    assert.deepEqual(readPdfPageTexts(outputPath), ['page 3', 'page 1', 'page 2']);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('protect_unlock_pdf can protect a PDF with an open password and later unlock it', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, ['page 1']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const protectedResult = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'protect_unlock_pdf',
      conversionOptions: {
        mode: 'protect',
        password: 'Abcd1234',
        confirmPassword: 'Abcd1234'
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    const protectedPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-protected.pdf');
    assert.equal(protectedResult.files[0].fileName, 'storybook-protected.pdf');
    assert.equal(readPdfEncryptionState(protectedPath).encrypted, true);

    const unlockedInputPath = path.join(tempRoot, 'locked.pdf');
    fs.copyFileSync(protectedPath, unlockedInputPath);

    const unlockedResult = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'protect_unlock_pdf',
      conversionOptions: {
        mode: 'unlock',
        password: 'Abcd1234'
      },
      files: [
        {
          fileName: 'locked.pdf',
          tempPath: unlockedInputPath
        }
      ]
    });

    const unlockedPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'locked-unlocked.pdf');
    assert.equal(unlockedResult.files[0].fileName, 'locked-unlocked.pdf');
    assert.equal(readPdfEncryptionState(unlockedPath).encrypted, false);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('excel_to_pdf writes a PDF output file using LibreOffice conversion', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputExcelPath = path.join(tempRoot, 'report.xlsx');
  fs.writeFileSync(inputExcelPath, Buffer.from('fake-excel'));
  const fakeLibreOfficePath = writeFakeLibreOffice(tempRoot);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN,
    libreOfficeBin: fakeLibreOfficePath
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'excel_to_pdf',
      files: [
        {
          fileName: 'report.xlsx',
          tempPath: inputExcelPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'report.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'report.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    assert.match(fs.readFileSync(outputPath).toString('utf8', 0, 4), /^%PDF/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('ppt_to_pdf writes a PDF output file using LibreOffice conversion', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPptPath = path.join(tempRoot, 'deck.pptx');
  fs.writeFileSync(inputPptPath, Buffer.from('fake-ppt'));
  const fakeLibreOfficePath = writeFakeLibreOffice(tempRoot);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN,
    libreOfficeBin: fakeLibreOfficePath
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'ppt_to_pdf',
      files: [
        {
          fileName: 'deck.pptx',
          tempPath: inputPptPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'deck.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'deck.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    assert.match(fs.readFileSync(outputPath).toString('utf8', 0, 4), /^%PDF/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('pdf_to_pptx writes an editable PPTX from a text PDF', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'notes.pdf');
  writePdfFixture(inputPdfPath, ['Hello PPT', 'Second slide text']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'pdf_to_pptx',
      files: [
        {
          fileName: 'notes.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'notes.pptx');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'notes.pptx');
    assert.deepEqual(readPptxSlideTexts(outputPath), ['Hello PPT', 'Second slide text']);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('pdf_to_pptx can use OCR fallback when the source PDF has no extractable text', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'scan.pdf');
  writeImageOnlyPdfFixture(inputPdfPath, 'OCR source');

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN,
    ocrmypdfBin: writeFakeOcrmypdfWithTextOutput(tempRoot, 'Recovered OCR text')
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'pdf_to_pptx',
      files: [
        {
          fileName: 'scan.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'scan.pptx');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'scan.pptx');
    assert.deepEqual(readPptxSlideTexts(outputPath), ['Recovered OCR text']);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('add_page_numbers_pdf writes a new PDF with page numbers', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, ['storybook page 1', 'storybook page 2']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'add_page_numbers_pdf',
      conversionOptions: {
        pageNumberPosition: 'footer_center',
        pageNumberStart: 3,
        pageNumberFormat: 'cn_page'
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'storybook-numbered.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-numbered.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    const extractedTexts = readPdfPageTexts(outputPath);
    assert.match(extractedTexts[0], /storybook page 1/);
    assert.match(extractedTexts[0], /3/);
    assert.match(extractedTexts[1], /4/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('sign_stamp_pdf writes a new PDF with a fixed-position uploaded stamp image', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  const stampImagePath = path.join(tempRoot, 'stamp.png');
  writePdfFixture(inputPdfPath, ['storybook page 1']);
  fs.writeFileSync(
    stampImagePath,
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZLzQAAAAASUVORK5CYII=', 'base64')
  );

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'sign_stamp_pdf',
      conversionOptions: {
        stampSourceType: 'image',
        stampPosition: 'bottom_right',
        stampScalePercent: 35,
        opacity: 0.4
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath,
          fieldName: 'files'
        },
        {
          fileName: 'stamp.png',
          tempPath: stampImagePath,
          fieldName: 'stampImage'
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'storybook-signed.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-signed.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    assert.ok(fs.statSync(outputPath).size > 0);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('batch_sign_stamp_pdf writes a stamped zip package for multiple PDFs', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const firstPdfPath = path.join(tempRoot, 'contract-a.pdf');
  const secondPdfPath = path.join(tempRoot, 'contract-b.pdf');
  const stampImagePath = path.join(tempRoot, 'stamp.png');
  writePdfFixture(firstPdfPath, ['contract a page 1', 'contract a page 2']);
  writePdfFixture(secondPdfPath, ['contract b page 1']);
  fs.writeFileSync(
    stampImagePath,
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZLzQAAAAASUVORK5CYII=', 'base64')
  );

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'batch_sign_stamp_pdf',
      conversionOptions: {
        stampSourceType: 'image',
        stampPosition: 'bottom_right',
        stampScalePercent: 35,
        opacity: 0.4
      },
      files: [
        {
          fileName: 'contract-a.pdf',
          tempPath: firstPdfPath,
          fieldName: 'files'
        },
        {
          fileName: 'contract-b.pdf',
          tempPath: secondPdfPath,
          fieldName: 'files'
        },
        {
          fileName: 'stamp.png',
          tempPath: stampImagePath,
          fieldName: 'stampImage'
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'batch-stamped-pdfs.zip');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'batch-stamped-pdfs.zip');
    assert.equal(fs.existsSync(outputPath), true);
    assert.deepEqual(readZipEntryNames(outputPath), ['contract-a-stamped.pdf', 'contract-b-stamped.pdf']);
    assert.deepEqual(readZippedPdfTexts(outputPath), {
      'contract-a-stamped.pdf': ['contract a page 1', 'contract a page 2'],
      'contract-b-stamped.pdf': ['contract b page 1']
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('rotate_pdf writes a new PDF with every page rotated by the selected angle', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, ['storybook page 1', 'storybook page 2']);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-USES-5' },
      conversionKey: 'rotate_pdf',
      conversionOptions: {
        rotationAngle: 90
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'storybook-rotated.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-rotated.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    assert.deepEqual(readPdfRotations(outputPath), [90, 90]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('watermark_pdf writes a new PDF with tiled text watermark settings', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  writePdfFixture(inputPdfPath, ['storybook page 1', 'storybook page 2']);

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
      conversionKey: 'watermark_pdf',
      conversionOptions: {
        watermarkType: 'text',
        textLayout: 'tile',
        textContent: '仅供内部使用',
        fontSize: 26,
        opacity: 0.18,
        rotation: -32
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath
        }
      ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].fileName, 'storybook-watermarked.pdf');

    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-watermarked.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    const extractedTexts = readPdfPageTexts(outputPath);
    assert.match(extractedTexts[0], /storybook page 1/);
    assert.match(extractedTexts[1], /storybook page 2/);
    assert.ok(fs.statSync(outputPath).size > 0);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('watermark_pdf writes a new PDF with fixed-position image watermark settings', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-'));
  const inputPdfPath = path.join(tempRoot, 'storybook.pdf');
  const watermarkImagePath = path.join(tempRoot, 'stamp.png');
  writePdfFixture(inputPdfPath, ['storybook page 1']);
  fs.writeFileSync(
    watermarkImagePath,
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZLzQAAAAASUVORK5CYII=',
      'base64'
    )
  );

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
      conversionKey: 'watermark_pdf',
      conversionOptions: {
        watermarkType: 'image',
        imagePosition: 'bottom_right',
        imageScalePercent: 30,
        opacity: 0.3
      },
      files: [
        {
          fileName: 'storybook.pdf',
          tempPath: inputPdfPath,
          fieldName: 'files'
        },
        {
          fileName: 'stamp.png',
          tempPath: watermarkImagePath,
          fieldName: 'watermarkImage'
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'storybook-watermarked.pdf');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'storybook-watermarked.pdf');
    assert.equal(fs.existsSync(outputPath), true);
    assert.ok(fs.statSync(outputPath).size > 0);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
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

function writePngFixture(outputPath, width, height, colorHex) {
  const script = `
from PIL import Image
image = Image.new('RGBA', (${width}, ${height}), '${colorHex}')
image.save(r"${outputPath.replace(/\\/g, '\\\\')}", format='PNG')
`;
  execFileSync(PYTHON_BIN, ['-c', script], { stdio: 'ignore' });
}

function readImageMeta(imagePath) {
  const script = `
from PIL import Image
image = Image.open(r"${imagePath.replace(/\\/g, '\\\\')}")
print(image.format)
print(f"{image.size[0]}x{image.size[1]}")
`;
  const output = execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [format, sizeText] = output;
  const [width, height] = String(sizeText || '0x0').split('x').map((value) => Number.parseInt(value, 10));
  return {
    format,
    width,
    height
  };
}

function writeHeicFixture(outputPath, width, height, colorHex) {
  const script = `
from PIL import Image
from pillow_heif import register_heif_opener
register_heif_opener()
image = Image.new('RGBA', (${width}, ${height}), '${colorHex}')
image.save(r"${outputPath.replace(/\\/g, '\\\\')}", format='HEIF', quality=90)
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

function readPptxSlideTexts(pptxPath) {
  const script = `
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}

with ZipFile(r"${pptxPath.replace(/\\/g, '\\\\')}") as archive:
    slide_names = sorted(
        name for name in archive.namelist()
        if name.startswith('ppt/slides/slide') and name.endswith('.xml')
    )
    for name in slide_names:
        root = ET.fromstring(archive.read(name))
        text = ''.join(node.text or '' for node in root.findall('.//a:t', ns)).strip()
        print(text)
`;

  return execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readZipEntryNames(zipPath) {
  const script = `
import sys
from zipfile import ZipFile
sys.stdout.reconfigure(encoding='utf-8')
with ZipFile(r"${zipPath.replace(/\\/g, '\\\\')}") as archive:
    for name in sorted(archive.namelist()):
        print(name)
`;

  return execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readPdfRotations(pdfPath) {
  const script = `
from pypdf import PdfReader
reader = PdfReader(r"${pdfPath.replace(/\\/g, '\\\\')}")
for page in reader.pages:
    print(int(page.rotation or 0))
`;

  return execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => Number.parseInt(line, 10));
}

function readPdfEncryptionState(pdfPath) {
  const script = `
from pypdf import PdfReader
reader = PdfReader(r"${pdfPath.replace(/\\/g, '\\\\')}")
print('encrypted=' + str(reader.is_encrypted))
`;
  const output = execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' }).trim();
  return {
    encrypted: output === 'encrypted=True'
  };
}

function writeFakeTesseract(tempRoot, text) {
  const scriptPath = path.join(tempRoot, 'fake_tesseract.py');
  const encodedText = Buffer.from(text, 'utf8').toString('base64');
  fs.writeFileSync(
    scriptPath,
    [
      'import base64',
      'from pathlib import Path',
      'import sys',
      '',
      'input_path = sys.argv[1]',
      'output_base = sys.argv[2]',
      `Path(output_base + '.txt').write_text(base64.b64decode('${encodedText}').decode('utf8'), encoding='utf8')`
    ].join('\n'),
    'utf8'
  );
  return scriptPath;
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

function writeFakeOcrmypdfWithTextOutput(tempRoot, pageText) {
  const scriptPath = path.join(tempRoot, 'fake-ocrmypdf-text.cmd');
  const helperPath = path.join(tempRoot, 'fake_ocrmypdf_text_helper.py');

  fs.writeFileSync(
    helperPath,
    `
import sys
from pathlib import Path
from reportlab.pdfgen import canvas

output_path = sys.argv[-1]
output = Path(output_path)
output.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(output))
c.drawString(72, 720, ${JSON.stringify(pageText)})
c.save()
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

function writeImageOnlyPdfFixture(outputPath, imageText = 'scan image') {
  const imagePath = outputPath.replace(/\.pdf$/i, '.png');
  const script = `
from PIL import Image, ImageDraw
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

image = Image.new('RGB', (600, 200), 'white')
draw = ImageDraw.Draw(image)
draw.text((40, 80), ${JSON.stringify(imageText)}, fill='black')
image.save(r"${imagePath.replace(/\\/g, '\\\\')}")

c = canvas.Canvas(r"${outputPath.replace(/\\/g, '\\\\')}")
c.drawImage(ImageReader(r"${imagePath.replace(/\\/g, '\\\\')}"), 72, 520, width=420, height=140)
c.save()
`;
  execFileSync(PYTHON_BIN, ['-c', script], { stdio: 'ignore' });
}

function writeFakeLibreOffice(tempRoot) {
  const scriptPath = path.join(tempRoot, 'fake-soffice.cmd');
  const helperPath = path.join(tempRoot, 'fake_soffice_helper.py');

  fs.writeFileSync(
    helperPath,
    `
import sys
from pathlib import Path
from reportlab.pdfgen import canvas

args = sys.argv[1:]
outdir = Path(args[args.index('--outdir') + 1])
input_path = Path(args[-1])
output_path = outdir / f"{input_path.stem}.pdf"
outdir.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(output_path))
c.drawString(72, 720, input_path.name)
c.save()
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
