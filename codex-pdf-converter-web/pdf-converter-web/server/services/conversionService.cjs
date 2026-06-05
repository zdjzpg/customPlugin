const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { parsePageSelection } = require('./pageSelectionParser.cjs');
const { imageConversionCatalog } = require('./imageConversionCatalog.cjs');

function createConversionService(options) {
  const {
    conversionRepository,
    storageRoot,
    pythonBin,
    libreOfficeBin = process.env.LIBREOFFICE_BIN || '',
    popplerBinDir = process.env.POPPLER_BIN_DIR || '',
    ghostscriptBin = process.env.GHOSTSCRIPT_BIN || '',
    ocrmypdfBin = process.env.OCRMYPDF_BIN || '',
    tesseractBin = process.env.TESSERACT_BIN || ''
  } = options;

  async function runConversion(input) {
    const record = conversionRepository.create({
      codeId: input.session.codeId || null,
      codeValue: input.session.codeValue || null,
        conversionKey: input.conversionKey,
        inputFileNames: input.files.map((file) => file.fileName)
      });

    const conversionId = record.id;
    const baseDirectory = path.join(storageRoot, 'conversions', String(conversionId));
    const inputDirectory = path.join(baseDirectory, 'inputs');
    const outputDirectory = path.join(baseDirectory, 'outputs');

    fs.mkdirSync(inputDirectory, { recursive: true });
    fs.mkdirSync(outputDirectory, { recursive: true });

    const writtenFiles = writeInputFiles(input.files, inputDirectory);

    try {
      const outputFiles = await executeConversion({
        conversionKey: input.conversionKey,
        conversionOptions: input.conversionOptions,
        inputFiles: input.files,
        writtenFiles,
        outputDirectory,
        pythonBin,
        libreOfficeBin,
        popplerBinDir,
        ghostscriptBin,
        ocrmypdfBin,
        tesseractBin
      });

      const mappedFiles = outputFiles.map((filePath) => ({
        fileName: path.basename(filePath),
        relativePath: path.join('conversions', String(conversionId), 'outputs', path.basename(filePath))
      }));

      conversionRepository.markCompleted(conversionId, mappedFiles);

      return {
        conversionId,
        status: 'completed',
        files: mappedFiles.map((file) => ({
          fileName: file.fileName,
          downloadUrl: `/api/downloads/conversions/${conversionId}/${encodeURIComponent(file.fileName)}`
        })),
        summary: outputFiles.summary || null
      };
    } catch (error) {
      conversionRepository.markFailed(conversionId, error.message);
      throw error;
    }
  }

  return {
    getCatalog,
    runConversion
  };

  function getCatalog() {
    return [
      {
        key: 'word_to_pdf',
        label: 'Word -> PDF',
        status: 'available',
        accepts: libreOfficeBin ? '.doc,.docx' : '.docx',
        maxFileSizeMb: 20,
        helperText: libreOfficeBin
          ? '支持 .doc 和 .docx，建议单个文件不超过 20MB。'
          : '当前仅支持 .docx，建议单个文件不超过 20MB。'
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
        key: 'scan_to_searchable_pdf',
        label: '扫描件转可搜索 PDF',
        status: 'available',
        accepts: '.pdf',
        maxFileSizeMb: 30,
        helperText: '适合扫描版资料补充可搜索文字层，方便检索和复制内容。'
      },
      {
        key: 'batch_word_to_pdf',
        label: '批量 Word 转 PDF',
        status: 'available',
        accepts: libreOfficeBin ? '.doc,.docx' : '.docx',
        maxFileSizeMb: 30,
        maxTotalFileSizeMb: 200,
        allowMultipleFiles: true,
        helperText: '一次上传多个 Word 文件，统一转成 PDF 后打包下载。'
      },
      {
        key: 'batch_excel_to_pdf',
        label: '批量 Excel 转 PDF',
        status: 'available',
        accepts: '.xlsx,.xls',
        maxFileSizeMb: 30,
        maxTotalFileSizeMb: 200,
        allowMultipleFiles: true,
        helperText: '一次上传多个 Excel 文件，统一转成 PDF 后打包下载。'
      },
      {
        key: 'batch_ppt_to_pdf',
        label: '批量 PPT 转 PDF',
        status: 'available',
        accepts: '.ppt,.pptx',
        maxFileSizeMb: 40,
        maxTotalFileSizeMb: 250,
        allowMultipleFiles: true,
        helperText: '一次上传多个 PPT 文件，统一转成 PDF 后打包下载。'
      },
      {
        key: 'batch_pdf_to_images',
        label: '批量 PDF 转图片',
        status: 'available',
        accepts: '.pdf',
        maxFileSizeMb: 30,
        maxTotalFileSizeMb: 180,
        allowMultipleFiles: true,
        helperText: '一次上传多个 PDF，分别转成图片后统一打包下载。'
      },
      {
        key: 'exam_paper_cleanup',
        label: '试卷 / 讲义整理',
        status: 'available',
        accepts: '.pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff',
        maxFileSizeMb: 25,
        maxTotalFileSizeMb: 120,
        allowMultipleFiles: true,
        helperText: '适合拍照试卷和讲义做纠偏、去黑边、提亮和双页拆分整理。'
      },
      {
        key: 'images_to_word',
        label: '图片转 Word',
        status: 'available',
        accepts: '.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff',
        maxFileSizeMb: 20,
        maxTotalFileSizeMb: 120,
        allowMultipleFiles: true,
        helperText: '把图片中的文字整理成可继续编辑的 Word 文档。'
      },
      {
        key: 'pdf_to_excel',
        label: 'PDF 转 Excel',
        status: 'available',
        accepts: '.pdf',
        maxFileSizeMb: 30,
        helperText: '适合规则表格型 PDF，优先导出课表、名单和清单类表格。'
      },
      {
        key: 'image_table_to_excel',
        label: '图片表格转 Excel',
        status: 'available',
        accepts: '.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff',
        maxFileSizeMb: 20,
        helperText: '适合清晰表格截图和拍照表格，优先导出规则网格内容。'
      },
      {
        key: 'ocr_text_extract',
        label: 'OCR 文字识别',
        categoryKey: 'text_tools',
        status: 'available',
        accepts: '.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff',
        maxFileSizeMb: 15,
        helperText: '支持截图和常见图片 OCR 识别，结果可下载为 TXT 文本。'
      },
      {
        key: 'batch_file_rename',
        label: '批量文件重命名',
        categoryKey: 'text_tools',
        status: 'available',
        accepts: '.txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.mp4,.zip',
        maxFileSizeMb: 50,
        maxTotalFileSizeMb: 200,
        allowMultipleFiles: true,
        helperText: '按模板批量重命名文件并打包下载，适合资料整理。'
      },
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
        key: 'pdf_to_images',
        label: 'PDF -> Images',
        status: 'available',
        accepts: '.pdf',
        maxFileSizeMb: 20,
        helperText: '上传 PDF 后输出图片，建议单个文件不超过 20MB。'
      },
      {
        key: 'images_to_pdf',
        label: 'Images -> PDF',
        status: 'available',
        accepts: '.png,.jpg,.jpeg,.webp',
        maxFileSizeMb: 10,
        maxTotalFileSizeMb: 20,
        helperText: '可一次上传多张图片并合并为 PDF，单张建议不超过 10MB。'
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
      },
      ...imageConversionCatalog.map((item) => ({
        status: 'available',
        ...item
      }))
    ];
  }
}

function writeInputFiles(files, inputDirectory) {
  return files.map((file) => {
    const safeName = sanitizeFileName(file.fileName);
    const outputPath = path.join(inputDirectory, safeName);
    if (file.tempPath) {
      fs.copyFileSync(file.tempPath, outputPath);
      if (fs.existsSync(file.tempPath)) {
        fs.unlinkSync(file.tempPath);
      }
      return outputPath;
    }

    fs.writeFileSync(outputPath, Buffer.from(file.contentBase64, 'base64'));
    return outputPath;
  });
}

async function executeConversion(options) {
  const {
    conversionKey,
    conversionOptions,
    inputFiles,
    writtenFiles,
    outputDirectory,
    pythonBin,
    libreOfficeBin,
    popplerBinDir,
    ghostscriptBin,
    ocrmypdfBin,
    tesseractBin
  } = options;

  if (conversionKey === 'images_to_pdf') {
    const outputPath = path.join(
      outputDirectory,
      `${path.parse(writtenFiles[0]).name || 'converted'}.pdf`
    );

    await runPythonScript(pythonBin, [
      'images_to_pdf',
      outputPath,
      ...writtenFiles
    ]);

    return [outputPath];
  }

  if (conversionKey === 'pdf_to_images') {
    if (writtenFiles.length !== 1) {
      throw new Error('pdf_to_images requires exactly one PDF file');
    }

    const outputPrefix = path.join(outputDirectory, path.parse(writtenFiles[0]).name);
    await runPythonScript(
      pythonBin,
      ['pdf_to_images', outputPrefix, writtenFiles[0]],
      popplerBinDir ? { POPPLER_BIN_DIR: popplerBinDir } : {}
    );

    const generatedImages = fs
      .readdirSync(outputDirectory)
      .sort()
      .map((fileName) => path.join(outputDirectory, fileName));

    const zipPath = path.join(
      outputDirectory,
      `${path.parse(writtenFiles[0]).name}-images.zip`
    );
    await runPythonScript(pythonBin, ['zip_files', zipPath, ...generatedImages]);

    return [zipPath];
  }

  if (conversionKey === 'pdf_to_word') {
    if (writtenFiles.length !== 1) {
      throw new Error('pdf_to_word requires exactly one PDF file');
    }

    const conversionMode = conversionOptions?.pdfToWordMode === 'ocr' ? 'ocr' : 'no_ocr';
    const ocrLanguage = normalizeOcrLanguage(conversionOptions?.ocrLanguage);
    if (conversionMode === 'ocr' && !ocrmypdfBin) {
      throw createConversionError(
        'OCRMYPDF_NOT_CONFIGURED',
        '当前环境还不能处理扫描件，请先安装并配置 OCRmyPDF。',
        400
      );
    }

    const outputPath = path.join(
      outputDirectory,
      `${path.parse(writtenFiles[0]).name}.docx`
    );

    await runPythonScript(pythonBin, [
      'pdf_to_word',
      outputPath,
      writtenFiles[0],
      conversionMode,
      conversionMode === 'ocr' ? ocrmypdfBin : '',
      ocrLanguage
    ]);

    return [outputPath];
  }

  if (conversionKey === 'scan_to_searchable_pdf') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_SEARCHABLE_PDF', '请先选择一个 PDF 文件。', 400);
    }
    if (!ocrmypdfBin) {
      throw createConversionError(
        'OCRMYPDF_NOT_CONFIGURED',
        '当前环境还不能处理扫描件，请先安装并配置 OCRmyPDF。',
        400
      );
    }

    const outputPath = path.join(outputDirectory, `${path.parse(sourcePdf).name}-searchable.pdf`);
    await runPythonScript(pythonBin, [
      'scan_to_searchable_pdf',
      outputPath,
      sourcePdf,
      JSON.stringify({
        ocrmypdfBin,
        ocrLanguage: normalizeOcrLanguage(conversionOptions?.ocrLanguage)
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'pdf_to_pptx') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_PDF_TO_PPTX', '请先选择一个 PDF 文件。', 400);
    }

    const outputPath = path.join(
      outputDirectory,
      `${path.parse(sourcePdf).name}.pptx`
    );

    await runPythonScript(pythonBin, [
      'pdf_to_pptx',
      outputPath,
      sourcePdf,
      ocrmypdfBin || ''
    ]);

    return [outputPath];
  }

  if (conversionKey === 'ocr_text_extract') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    if (!tesseractBin) {
      throw createConversionError(
        'TESSERACT_NOT_CONFIGURED',
        '当前环境还不能处理 OCR 识别，请先安装并配置 Tesseract。',
        400
      );
    }

    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-ocr.txt`);
    await runPythonScript(pythonBin, [
      'ocr_text_extract',
      outputPath,
      sourcePath,
      JSON.stringify({
        ocrLanguage: normalizeOcrLanguage(conversionOptions?.ocrLanguage),
        tesseractBin,
        tesseractScriptPath: typeof conversionOptions?.tesseractScriptPath === 'string'
          ? conversionOptions.tesseractScriptPath
          : ''
      })
    ]);

    const outputFiles = [outputPath];
    outputFiles.summary = {
      kind: 'text_preview',
      previewText: buildTextPreview(outputPath)
    };
    return outputFiles;
  }

  if (conversionKey === 'batch_file_rename') {
    if (writtenFiles.length === 0) {
      throw createConversionError('FILE_REQUIRED', '请先选择至少一个文件。', 400);
    }

    const outputPath = path.join(outputDirectory, 'renamed-files.zip');
    await runPythonScript(pythonBin, [
      'batch_file_rename',
      outputPath,
      JSON.stringify({
        template: String(conversionOptions?.template || '资料-{n}-{name}'),
        startNumber: Number.parseInt(String(conversionOptions?.startNumber ?? '1'), 10) || 1,
        numberWidth: Number.parseInt(String(conversionOptions?.numberWidth ?? '2'), 10) || 2
      }),
      ...writtenFiles
    ]);
    return [outputPath];
  }

  if (conversionKey === 'images_to_word') {
    if (writtenFiles.length === 0) {
      throw createConversionError('IMAGE_REQUIRED', '请先选择至少一张图片。', 400);
    }
    if (!tesseractBin) {
      throw createConversionError(
        'TESSERACT_NOT_CONFIGURED',
        '当前环境还不能处理图片识别，请先安装并配置 Tesseract。',
        400
      );
    }

    const outputPath = path.join(outputDirectory, `${path.parse(writtenFiles[0]).name}-images.docx`);
    await runPythonScript(pythonBin, [
      'images_to_word',
      outputPath,
      JSON.stringify({
        ocrLanguage: normalizeOcrLanguage(conversionOptions?.ocrLanguage),
        tesseractBin,
        tesseractScriptPath: typeof conversionOptions?.tesseractScriptPath === 'string'
          ? conversionOptions.tesseractScriptPath
          : ''
      }),
      ...writtenFiles
    ]);
    return [outputPath];
  }

  if (conversionKey === 'image_table_to_excel') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    if (!tesseractBin) {
      throw createConversionError(
        'TESSERACT_NOT_CONFIGURED',
        '当前环境还不能处理表格识别，请先安装并配置 Tesseract。',
        400
      );
    }

    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}.xlsx`);
    await runPythonScript(pythonBin, [
      'image_table_to_excel',
      outputPath,
      sourcePath,
      JSON.stringify({
        ocrLanguage: normalizeOcrLanguage(conversionOptions?.ocrLanguage),
        tesseractBin,
        tesseractScriptPath: typeof conversionOptions?.tesseractScriptPath === 'string'
          ? conversionOptions.tesseractScriptPath
          : ''
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'payment_code_merge') {
    if (writtenFiles.length < 2) {
      throw createConversionError('IMAGE_REQUIRED', '请至少选择两张收款码图片。', 400);
    }

    const outputPath = path.join(outputDirectory, 'merged-payment-codes.png');
    await runPythonScript(pythonBin, [
      'payment_code_merge',
      outputPath,
      JSON.stringify({
        layout: conversionOptions?.layout === 'horizontal' ? 'horizontal' : 'vertical',
        mainTitle: String(conversionOptions?.mainTitle || '收款码')
      }),
      ...writtenFiles
    ]);
    return [outputPath];
  }

  if (conversionKey === 'qr_generate') {
    const qrText = String(conversionOptions?.qrText || '').trim();
    if (!qrText) {
      throw createConversionError('QR_TEXT_REQUIRED', '请先输入二维码内容。', 400);
    }

    const outputPath = path.join(outputDirectory, 'qr-code.png');
    await runPythonScript(pythonBin, [
      'qr_generate',
      outputPath,
      JSON.stringify({
        qrText,
        sizePx: Number.parseInt(String(conversionOptions?.sizePx ?? '320'), 10) || 320
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'qr_generate_batch') {
    const qrLinesText = String(conversionOptions?.qrLinesText || '');
    if (!qrLinesText.trim()) {
      throw createConversionError('QR_TEXT_REQUIRED', '请先输入至少一行二维码内容。', 400);
    }

    const outputPath = path.join(outputDirectory, 'qr-codes.zip');
    await runPythonScript(pythonBin, [
      'qr_generate_batch',
      outputPath,
      JSON.stringify({
        qrLinesText,
        sizePx: Number.parseInt(String(conversionOptions?.sizePx ?? '256'), 10) || 256
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'qr_decode') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-qr.txt`);
    await runPythonScript(pythonBin, [
      'qr_decode',
      outputPath,
      sourcePath
    ]);

    const outputFiles = [outputPath];
    outputFiles.summary = {
      kind: 'text_preview',
      previewText: buildTextPreview(outputPath)
    };
    return outputFiles;
  }

  if (conversionKey === 'delete_pages_pdf') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_DELETE_PDF', '请先选择一个 PDF 文件。', 400);
    }

    const selection = parsePageSelection(conversionKey, conversionOptions);
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePdf).name}-deleted-pages.pdf`);
    await runPythonScript(pythonBin, [
      'delete_pages_pdf',
      outputPath,
      sourcePdf,
      JSON.stringify(selection)
    ]);
    return [outputPath];
  }

  if (conversionKey === 'reorder_pages_pdf') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_REORDER_PDF', '请先选择一个 PDF 文件。', 400);
    }

    const selection = parsePageSelection(conversionKey, conversionOptions);
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePdf).name}-reordered.pdf`);
    await runPythonScript(pythonBin, [
      'reorder_pages_pdf',
      outputPath,
      sourcePdf,
      JSON.stringify(selection)
    ]);
    return [outputPath];
  }

  if (conversionKey === 'protect_unlock_pdf') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_PROTECT_PDF', '请先选择一个 PDF 文件。', 400);
    }

    const mode = conversionOptions?.mode === 'unlock' ? 'unlock' : 'protect';
    const password = typeof conversionOptions?.password === 'string' ? conversionOptions.password : '';
    const confirmPassword =
      typeof conversionOptions?.confirmPassword === 'string' ? conversionOptions.confirmPassword : '';

    if (!password) {
      throw createConversionError('PASSWORD_REQUIRED', mode === 'unlock' ? '请输入原密码。' : '请先输入打开密码。', 400);
    }
    if (mode === 'protect' && password !== confirmPassword) {
      throw createConversionError('PASSWORD_CONFIRM_MISMATCH', '两次输入的密码不一致。', 400);
    }

    const suffix = mode === 'unlock' ? 'unlocked' : 'protected';
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePdf).name}-${suffix}.pdf`);
    await runPythonScript(pythonBin, [
      'protect_unlock_pdf',
      outputPath,
      sourcePdf,
      mode,
      password
    ]);
    return [outputPath];
  }

  if (conversionKey === 'excel_to_pdf') {
    return convertOfficeDocumentToPdf('excel_to_pdf', writtenFiles, outputDirectory, libreOfficeBin);
  }

  if (conversionKey === 'ppt_to_pdf') {
    return convertOfficeDocumentToPdf('ppt_to_pdf', writtenFiles, outputDirectory, libreOfficeBin);
  }

  if (conversionKey === 'batch_word_to_pdf') {
    return batchConvertWordDocumentsToPdf(writtenFiles, outputDirectory, pythonBin, libreOfficeBin);
  }

  if (conversionKey === 'batch_excel_to_pdf') {
    return batchConvertOfficeDocumentsToPdf(
      'batch_excel_to_pdf',
      writtenFiles,
      outputDirectory,
      pythonBin,
      libreOfficeBin,
      'batch-excel-to-pdf.zip'
    );
  }

  if (conversionKey === 'batch_ppt_to_pdf') {
    return batchConvertOfficeDocumentsToPdf(
      'batch_ppt_to_pdf',
      writtenFiles,
      outputDirectory,
      pythonBin,
      libreOfficeBin,
      'batch-ppt-to-pdf.zip'
    );
  }

  if (conversionKey === 'batch_pdf_to_images') {
    if (writtenFiles.length === 0) {
      throw createConversionError('FILE_REQUIRED', '请先选择至少一个 PDF 文件。', 400);
    }

    const outputPath = path.join(outputDirectory, 'batch-pdf-to-images.zip');
    await runPythonScript(
      pythonBin,
      [
        'batch_pdf_to_images',
        outputPath,
        JSON.stringify({
          popplerBinDir
        }),
        ...writtenFiles
      ],
      popplerBinDir ? { POPPLER_BIN_DIR: popplerBinDir } : {}
    );
    return [outputPath];
  }

  if (conversionKey === 'pdf_to_excel') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_PDF_TO_EXCEL', '请先选择一个 PDF 文件。', 400);
    }

    const outputPath = path.join(outputDirectory, `${path.parse(sourcePdf).name}.xlsx`);
    await runPythonScript(pythonBin, [
      'pdf_to_excel',
      outputPath,
      sourcePdf,
      JSON.stringify({
        ocrmypdfBin: ocrmypdfBin || ''
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'exam_paper_cleanup') {
    if (writtenFiles.length === 0) {
      throw createConversionError('FILE_REQUIRED', '请先选择至少一个文件。', 400);
    }

    const outputMode = conversionOptions?.outputMode === 'image_zip' ? 'image_zip' : 'pdf';
    const outputFileName = outputMode === 'image_zip'
      ? `${path.parse(writtenFiles[0]).name}-cleaned.zip`
      : `${path.parse(writtenFiles[0]).name}-cleaned.pdf`;
    const outputPath = path.join(outputDirectory, outputFileName);
    await runPythonScript(pythonBin, [
      'exam_paper_cleanup',
      outputPath,
      JSON.stringify({
        outputMode,
        cleanupMode: normalizeCleanupMode(conversionOptions?.cleanupMode),
        splitDoublePage: Boolean(conversionOptions?.splitDoublePage),
        enhanceContrast: conversionOptions?.enhanceContrast !== false
      }),
      ...writtenFiles
    ]);
    return [outputPath];
  }

  if (conversionKey === 'watermark_pdf') {
    const sourcePdf = writtenFiles.find((file, index) => {
      const original = inputFiles[index];
      return original && (original.fieldName === 'files' || !original.fieldName);
    }) || writtenFiles[0];
    const sourcePdfIndex = writtenFiles.indexOf(sourcePdf);
    const sourcePdfInput = inputFiles[sourcePdfIndex];

    if (!sourcePdfInput || path.extname(sourcePdf).toLowerCase() !== '.pdf') {
      throw createConversionError(
        'INVALID_WATERMARK_PDF',
        '请先选择一个 PDF 文件。',
        400
      );
    }

    const watermarkType = conversionOptions?.watermarkType === 'image' ? 'image' : 'text';
    const outputPath = path.join(
      outputDirectory,
      `${path.parse(sourcePdf).name}-watermarked.pdf`
    );

    let watermarkImagePath = '';
    if (watermarkType === 'image') {
      const imageIndex = inputFiles.findIndex((file) => file.fieldName === 'watermarkImage');
      watermarkImagePath = imageIndex === -1 ? '' : writtenFiles[imageIndex];
      if (!watermarkImagePath) {
        throw createConversionError(
          'WATERMARK_IMAGE_REQUIRED',
          '图片水印模式下请上传 PNG 或 JPG 图片。',
          400
        );
      }
    }

    await runPythonScript(pythonBin, [
      'watermark_pdf',
      outputPath,
      sourcePdf,
      JSON.stringify({
        watermarkType,
        textLayout: conversionOptions?.textLayout === 'center' ? 'center' : 'tile',
        textContent: typeof conversionOptions?.textContent === 'string' ? conversionOptions.textContent : '',
        fontSize: Number.parseInt(String(conversionOptions?.fontSize ?? '24'), 10) || 24,
        opacity: toBoundedNumber(conversionOptions?.opacity, 0.18, 0.02, 0.95),
        rotation: Number.parseFloat(String(conversionOptions?.rotation ?? '-30')) || -30,
        imagePosition: ['center', 'bottom_left', 'bottom_right'].includes(conversionOptions?.imagePosition)
          ? conversionOptions.imagePosition
          : 'center',
        imageScalePercent: Number.parseInt(String(conversionOptions?.imageScalePercent ?? '30'), 10) || 30,
        watermarkImagePath
      })
    ]);

    return [outputPath];
  }

  if (conversionKey === 'add_page_numbers_pdf') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_PAGE_NUMBER_PDF', '请先选择一个 PDF 文件。', 400);
    }

    const outputPath = path.join(
      outputDirectory,
      `${path.parse(sourcePdf).name}-numbered.pdf`
    );
    await runPythonScript(pythonBin, [
      'add_page_numbers_pdf',
      outputPath,
      sourcePdf,
      JSON.stringify({
        pageNumberPosition: conversionOptions?.pageNumberPosition === 'bottom_right'
          ? 'bottom_right'
          : 'footer_center',
        pageNumberStart: Number.parseInt(String(conversionOptions?.pageNumberStart ?? '1'), 10) || 1,
        pageNumberFormat: conversionOptions?.pageNumberFormat === 'plain'
          ? 'plain'
          : 'cn_page'
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'sign_stamp_pdf') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_SIGN_PDF', '请先选择一个 PDF 文件。', 400);
    }

    const stampImagePath = findAuxiliaryFilePath(inputFiles, writtenFiles, 'stampImage');
    if (!stampImagePath) {
      throw createConversionError('STAMP_IMAGE_REQUIRED', '请上传签名或盖章图片。', 400);
    }

    const outputPath = path.join(
      outputDirectory,
      `${path.parse(sourcePdf).name}-signed.pdf`
    );
    await runPythonScript(pythonBin, [
      'sign_stamp_pdf',
      outputPath,
      sourcePdf,
      JSON.stringify({
        stampPosition: ['center', 'bottom_left', 'bottom_right'].includes(conversionOptions?.stampPosition)
          ? conversionOptions.stampPosition
          : 'bottom_right',
        stampScalePercent: Number.parseInt(String(conversionOptions?.stampScalePercent ?? '35'), 10) || 35,
        opacity: toBoundedNumber(conversionOptions?.opacity, 0.4, 0.02, 0.95),
        stampImagePath
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'batch_sign_stamp_pdf') {
    const sourcePdfs = findPrimaryPdfPaths(inputFiles, writtenFiles);
    if (sourcePdfs.length < 2) {
      throw createConversionError(
        'INSUFFICIENT_PDF_FILES',
        '请至少选择两个 PDF 文件再开始批量盖章。',
        400
      );
    }

    const stampImagePath = findAuxiliaryFilePath(inputFiles, writtenFiles, 'stampImage');
    if (!stampImagePath) {
      throw createConversionError('STAMP_IMAGE_REQUIRED', '请上传签名或盖章图片。', 400);
    }

    const outputPath = path.join(outputDirectory, 'batch-stamped-pdfs.zip');
    await runPythonScript(pythonBin, [
      'batch_sign_stamp_pdf',
      outputPath,
      JSON.stringify({
        stampPosition: ['center', 'bottom_left', 'bottom_right'].includes(conversionOptions?.stampPosition)
          ? conversionOptions.stampPosition
          : 'bottom_right',
        stampScalePercent: Number.parseInt(String(conversionOptions?.stampScalePercent ?? '35'), 10) || 35,
        opacity: toBoundedNumber(conversionOptions?.opacity, 0.4, 0.02, 0.95),
        stampImagePath
      }),
      ...sourcePdfs
    ]);
    return [outputPath];
  }

  if (conversionKey === 'rotate_pdf') {
    const sourcePdf = findPrimaryPdfPath(inputFiles, writtenFiles);
    if (!sourcePdf) {
      throw createConversionError('INVALID_ROTATE_PDF', '请先选择一个 PDF 文件。', 400);
    }

    const rotationAngle = [90, 180, 270].includes(Number(conversionOptions?.rotationAngle))
      ? Number(conversionOptions.rotationAngle)
      : 90;
    const outputPath = path.join(
      outputDirectory,
      `${path.parse(sourcePdf).name}-rotated.pdf`
    );
    await runPythonScript(pythonBin, [
      'rotate_pdf',
      outputPath,
      sourcePdf,
      String(rotationAngle)
    ]);
    return [outputPath];
  }

  if (conversionKey === 'merge_pdf') {
    if (writtenFiles.length < 2) {
      throw createConversionError(
        'INSUFFICIENT_PDF_FILES',
        '请至少选择两个 PDF 再开始合并。',
        400
      );
    }

    const outputPath = path.join(outputDirectory, 'merged.pdf');
    await runPythonScript(pythonBin, ['merge_pdf', outputPath, ...writtenFiles]);
    return [outputPath];
  }

  if (conversionKey === 'compress_pdf') {
    if (writtenFiles.length !== 1) {
      throw new Error('compress_pdf requires exactly one PDF file');
    }

    if (!ghostscriptBin) {
      throw createConversionError(
        'GHOSTSCRIPT_NOT_CONFIGURED',
        '当前环境还不能压缩 PDF，请先安装并配置 Ghostscript。',
        400
      );
    }

    const compressionLevel =
      conversionOptions?.compressionLevel === 'strong' ? 'strong' : 'standard';
    const inputPath = writtenFiles[0];
    const outputPath = path.join(
      outputDirectory,
      `${path.parse(inputPath).name}-compressed.pdf`
    );

    await runPythonScript(pythonBin, [
      'compress_pdf',
      outputPath,
      inputPath,
      compressionLevel,
      ghostscriptBin
    ]);

    const inputSizeBytes = fs.statSync(inputPath).size;
    const outputSizeBytes = fs.statSync(outputPath).size;
    const outputFiles = [outputPath];
    outputFiles.summary = {
      inputSizeBytes,
      outputSizeBytes,
      savedBytes: inputSizeBytes - outputSizeBytes,
      compressionLevel
    };
    return outputFiles;
  }

  if (conversionKey === 'pdf_extract_pages') {
    if (writtenFiles.length !== 1) {
      throw new Error('pdf_extract_pages requires exactly one PDF file');
    }

    const selection = parsePageSelection(conversionKey, conversionOptions);
    const outputPath = path.join(
      outputDirectory,
      `${path.parse(writtenFiles[0]).name}-extracted.pdf`
    );

    await runPythonScript(pythonBin, [
      'pdf_extract_pages',
      outputPath,
      writtenFiles[0],
      JSON.stringify(selection)
    ]);

    return [outputPath];
  }

  if (conversionKey === 'split_pdf') {
    if (writtenFiles.length !== 1) {
      throw new Error('split_pdf requires exactly one PDF file');
    }

    const selection = parsePageSelection(conversionKey, conversionOptions);
    const outputPath = path.join(
      outputDirectory,
      `${path.parse(writtenFiles[0]).name}-split.zip`
    );

    await runPythonScript(pythonBin, [
      'split_pdf',
      outputPath,
      writtenFiles[0],
      JSON.stringify(selection)
    ]);

    return [outputPath];
  }

  if (conversionKey === 'image_compress_batch') {
    if (writtenFiles.length === 0) {
      throw createConversionError('IMAGE_REQUIRED', '请先选择至少一张图片。', 400);
    }

    const zipPath = path.join(outputDirectory, 'compressed-images.zip');
    await runPythonScript(pythonBin, [
      'image_compress_batch',
      zipPath,
      JSON.stringify({
        quality: Number.parseInt(String(conversionOptions?.quality ?? '75'), 10) || 75
      }),
      ...writtenFiles
    ]);
    return [zipPath];
  }

  if (conversionKey === 'image_resize_exact') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const ext = normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath);
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-resized.${ext}`);
    await runPythonScript(pythonBin, [
      'image_resize_exact',
      outputPath,
      sourcePath,
      JSON.stringify({
        targetWidth: Number.parseInt(String(conversionOptions?.targetWidth ?? '800'), 10) || 800,
        targetHeight: Number.parseInt(String(conversionOptions?.targetHeight ?? '600'), 10) || 600
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'image_resize_scale') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const ext = normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath);
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-scaled.${ext}`);
    await runPythonScript(pythonBin, [
      'image_resize_scale',
      outputPath,
      sourcePath,
      JSON.stringify({
        scalePercent: Number.parseInt(String(conversionOptions?.scalePercent ?? '100'), 10) || 100
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'image_crop_free') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const ext = normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath);
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-cropped.${ext}`);
    await runPythonScript(pythonBin, [
      'image_crop_free',
      outputPath,
      sourcePath,
      JSON.stringify({
        cropX: Number.parseInt(String(conversionOptions?.cropX ?? '0'), 10) || 0,
        cropY: Number.parseInt(String(conversionOptions?.cropY ?? '0'), 10) || 0,
        cropWidth: Number.parseInt(String(conversionOptions?.cropWidth ?? '300'), 10) || 300,
        cropHeight: Number.parseInt(String(conversionOptions?.cropHeight ?? '300'), 10) || 300
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'image_crop_ratio') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const ext = normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath);
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-ratio-cropped.${ext}`);
    await runPythonScript(pythonBin, [
      'image_crop_ratio',
      outputPath,
      sourcePath,
      JSON.stringify({
        aspectRatio: String(conversionOptions?.aspectRatio || '1:1')
      })
    ]);
    return [outputPath];
  }

  if (conversionKey === 'image_crop_ratio_batch') {
    if (writtenFiles.length === 0) {
      throw createConversionError('IMAGE_REQUIRED', '请先选择至少一张图片。', 400);
    }

    const zipPath = path.join(outputDirectory, 'ratio-cropped-images.zip');
    await runPythonScript(pythonBin, [
      'image_crop_ratio_batch',
      zipPath,
      JSON.stringify({
        aspectRatio: String(conversionOptions?.aspectRatio || '1:1'),
        outputFormat: normalizeImageOutputFormat(conversionOptions?.outputFormat, writtenFiles[0])
      }),
      ...writtenFiles
    ]);
    return [zipPath];
  }

  if (conversionKey === 'image_split_grid') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const zipPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-grid.zip`);
    await runPythonScript(pythonBin, [
      'image_split_grid',
      zipPath,
      sourcePath,
      JSON.stringify({
        rows: Number.parseInt(String(conversionOptions?.rows ?? '2'), 10) || 2,
        columns: Number.parseInt(String(conversionOptions?.columns ?? '2'), 10) || 2,
        outputFormat: normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath)
      })
    ]);
    return [zipPath];
  }

  if (conversionKey === 'image_nine_grid') {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const zipPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-nine-grid.zip`);
    await runPythonScript(pythonBin, [
      'image_split_grid',
      zipPath,
      sourcePath,
      JSON.stringify({
        rows: 3,
        columns: 3,
        outputFormat: normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath)
      })
    ]);
    return [zipPath];
  }

  if (conversionKey === 'image_concat_long' || conversionKey === 'image_collage') {
    if (writtenFiles.length === 0) {
      throw createConversionError('IMAGE_REQUIRED', '请先选择至少一张图片。', 400);
    }

    const ext = normalizeImageOutputFormat(conversionOptions?.outputFormat, writtenFiles[0]);
    const suffix = conversionKey === 'image_concat_long' ? 'long' : 'collage';
    const outputPath = path.join(outputDirectory, `${path.parse(writtenFiles[0]).name}-${suffix}.${ext}`);
    await runPythonScript(pythonBin, [
      conversionKey,
      outputPath,
      JSON.stringify({
        direction: conversionOptions?.direction === 'horizontal' ? 'horizontal' : 'vertical',
        gap: Number.parseInt(String(conversionOptions?.gap ?? '0'), 10) || 0,
        columns: Number.parseInt(String(conversionOptions?.columns ?? '2'), 10) || 2,
        backgroundColor: String(conversionOptions?.backgroundColor || '#ffffff')
      }),
      ...writtenFiles
    ]);
    return [outputPath];
  }

  if (['image_fill_background', 'image_dark_mode_background', 'image_grayscale', 'image_invert', 'image_printmaking', 'image_emboss', 'image_remove_solid_bg', 'image_smart_bg_remove', 'image_add_padding', 'image_pixelate', 'image_increase_size', 'image_clear_content', 'image_heic_convert', 'image_format_convert', 'image_modify_dpi', 'png_alpha_invert', 'image_round_corner', 'image_tile_fill', 'id_photo_resize', 'exam_id_photo_process', 'id_photo_crop', 'id_photo_bg_swap', 'anti_ocr_image', 'image_watermark_tile'].includes(conversionKey)) {
    if (conversionKey !== 'image_format_convert' || writtenFiles.length <= 1) {
      const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
      const ext = resolveImageCommandOutputExtension(conversionKey, sourcePath, conversionOptions);
      const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-${buildImageCommandSuffix(conversionKey)}.${ext}`);
      await runPythonScript(pythonBin, [
        conversionKey,
        outputPath,
        sourcePath,
        JSON.stringify(buildImageCommandOptions(conversionKey, conversionOptions))
      ]);
      return [outputPath];
    }

    if (writtenFiles.length === 0) {
      throw createConversionError('IMAGE_REQUIRED', '请先选择至少一张图片。', 400);
    }

    const ext = normalizeImageOutputFormat(conversionOptions?.outputFormat, writtenFiles[0]);
    const zipPath = path.join(outputDirectory, 'converted-images.zip');
    await runPythonScript(pythonBin, [
      'image_format_convert',
      zipPath,
      JSON.stringify({
        outputFormat: ext
      }),
      ...writtenFiles
    ]);
    return [zipPath];
  }

  if (['favicon_generate', 'app_icon_generate', 'chrome_icon_generate', 'excel_extract_images', 'ppt_extract_images', 'gif_split'].includes(conversionKey)) {
    const sourcePath = requireSingleImageFile(conversionKey, inputFiles, writtenFiles);
    const outputExtension = conversionKey === 'favicon_generate' ? 'ico' : 'zip';
    const outputPath = path.join(outputDirectory, `${path.parse(sourcePath).name}-${buildImageCommandSuffix(conversionKey)}.${outputExtension}`);
    await runPythonScript(pythonBin, [
      conversionKey,
      outputPath,
      sourcePath,
      JSON.stringify(buildImageCommandOptions(conversionKey, conversionOptions))
    ]);
    return [outputPath];
  }

  if (conversionKey === 'gif_merge') {
    if (writtenFiles.length === 0) {
      throw createConversionError('IMAGE_REQUIRED', '请先选择至少一张图片。', 400);
    }

    const outputPath = path.join(outputDirectory, `${path.parse(writtenFiles[0]).name}-merged.gif`);
    await runPythonScript(pythonBin, [
      'gif_merge',
      outputPath,
      JSON.stringify({
        durationMs: Number.parseInt(String(conversionOptions?.durationMs ?? '400'), 10) || 400
      }),
      ...writtenFiles
    ]);
    return [outputPath];
  }

  if (conversionKey === 'word_to_pdf') {
    if (writtenFiles.length !== 1) {
      throw new Error('word_to_pdf requires exactly one Word file');
    }

    const inputPath = writtenFiles[0];
    const outputPath = path.join(outputDirectory, `${path.parse(inputPath).name}.pdf`);

    if (libreOfficeBin) {
      await runLibreOfficeConversion(libreOfficeBin, inputPath, outputDirectory);
      const libreOfficeOutputPath = path.join(
        outputDirectory,
        `${path.parse(inputPath).name}.pdf`
      );
      if (!fs.existsSync(libreOfficeOutputPath)) {
        throw new Error('LibreOffice conversion did not produce a PDF file');
      }

      return [libreOfficeOutputPath];
    }

    if (path.extname(inputPath).toLowerCase() !== '.docx') {
      throw createConversionError(
        'UNSUPPORTED_WORD_FORMAT',
        '当前环境仅支持 .docx。若要转换 .doc，请先安装 LibreOffice。',
        400
      );
    }

    await runPythonScript(pythonBin, ['docx_to_pdf_fallback', inputPath, outputPath]);
    return [outputPath];
  }

  throw new Error(`Unsupported conversion key: ${conversionKey}`);
}

function runPythonScript(pythonBin, args, extraEnvironment = {}) {
  const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'run_conversion.py');
  return runCommand(pythonBin, [scriptPath, ...args], extraEnvironment);
}

function runLibreOfficeConversion(libreOfficeBin, inputPath, outputDirectory) {
  return runCommand(libreOfficeBin, [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    outputDirectory,
    inputPath
  ]);
}

function runCommand(command, args, extraEnvironment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...extraEnvironment
      },
      shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (error && error.code === 'ENOENT') {
        reject(new Error(`Command not found: ${command}`));
        return;
      }

      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `Command failed with exit code ${code}`));
    });
  });
}

function sanitizeFileName(fileName) {
  const normalized = String(fileName)
    .normalize('NFC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  const safeName = normalized
    .split('.')
    .map((part) => part.replace(/[. ]+$/g, ''))
    .join('.');

  return safeName || 'converted-file';
}

function createConversionError(reason, message, statusCode) {
  const error = new Error(message);
  error.reason = reason;
  error.statusCode = statusCode;
  return error;
}

function normalizeOcrLanguage(value) {
  return ['chi_sim+eng', 'chi_sim', 'eng'].includes(value) ? value : 'chi_sim+eng';
}

function normalizeCleanupMode(value) {
  return ['color', 'grayscale', 'binary'].includes(value) ? value : 'grayscale';
}

async function convertOfficeDocumentToPdf(conversionKey, writtenFiles, outputDirectory, libreOfficeBin) {
  if (writtenFiles.length !== 1) {
    throw new Error(`${conversionKey} requires exactly one Office file`);
  }

  if (!libreOfficeBin) {
    throw createConversionError(
      'LIBREOFFICE_NOT_CONFIGURED',
      '当前环境还不能处理这个 Office 文件，请先安装并配置 LibreOffice。',
      400
    );
  }

  const inputPath = writtenFiles[0];
  await runLibreOfficeConversion(libreOfficeBin, inputPath, outputDirectory);
  const outputPath = path.join(outputDirectory, `${path.parse(inputPath).name}.pdf`);
  if (!fs.existsSync(outputPath)) {
    throw new Error('LibreOffice conversion did not produce a PDF file');
  }

  return [outputPath];
}

async function batchConvertOfficeDocumentsToPdf(
  conversionKey,
  writtenFiles,
  outputDirectory,
  pythonBin,
  libreOfficeBin,
  zipFileName
) {
  if (writtenFiles.length === 0) {
    throw createConversionError('FILE_REQUIRED', '请先选择至少一个文件。', 400);
  }

  const outputFiles = [];
  for (const inputPath of writtenFiles) {
    outputFiles.push(await convertSingleOfficeDocumentToPdf(conversionKey, inputPath, outputDirectory, libreOfficeBin));
  }

  const zipPath = path.join(outputDirectory, zipFileName);
  await runPythonScript(pythonBin, ['zip_files', zipPath, ...outputFiles]);
  return [zipPath];
}

async function batchConvertWordDocumentsToPdf(writtenFiles, outputDirectory, pythonBin, libreOfficeBin) {
  if (writtenFiles.length === 0) {
    throw createConversionError('FILE_REQUIRED', '请先选择至少一个文件。', 400);
  }

  const outputFiles = [];
  for (const inputPath of writtenFiles) {
    outputFiles.push(await convertSingleWordDocumentToPdf(inputPath, outputDirectory, pythonBin, libreOfficeBin));
  }

  const zipPath = path.join(outputDirectory, 'batch-word-to-pdf.zip');
  await runPythonScript(pythonBin, ['zip_files', zipPath, ...outputFiles]);
  return [zipPath];
}

async function convertSingleOfficeDocumentToPdf(conversionKey, inputPath, outputDirectory, libreOfficeBin) {
  if (!libreOfficeBin) {
    throw createConversionError(
      'LIBREOFFICE_NOT_CONFIGURED',
      '当前环境还不能处理这个 Office 文件，请先安装并配置 LibreOffice。',
      400
    );
  }

  await runLibreOfficeConversion(libreOfficeBin, inputPath, outputDirectory);
  const outputPath = path.join(outputDirectory, `${path.parse(inputPath).name}.pdf`);
  if (!fs.existsSync(outputPath)) {
    throw new Error('LibreOffice conversion did not produce a PDF file');
  }

  return outputPath;
}

async function convertSingleWordDocumentToPdf(inputPath, outputDirectory, pythonBin, libreOfficeBin) {
  if (libreOfficeBin) {
    return convertSingleOfficeDocumentToPdf('word_to_pdf', inputPath, outputDirectory, libreOfficeBin);
  }

  if (path.extname(inputPath).toLowerCase() !== '.docx') {
    throw createConversionError(
      'UNSUPPORTED_WORD_FORMAT',
      '当前环境仅支持 .docx。若要转换 .doc，请先安装 LibreOffice。',
      400
    );
  }

  const outputPath = path.join(outputDirectory, `${path.parse(inputPath).name}.pdf`);
  await runPythonScript(pythonBin, ['docx_to_pdf_fallback', inputPath, outputPath]);
  return outputPath;
}

function toBoundedNumber(value, fallback, min, max) {
  const parsed = Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function findPrimaryPdfPath(inputFiles, writtenFiles) {
  const index = inputFiles.findIndex((file) => (file.fieldName || 'files') === 'files');
  return index === -1 ? '' : writtenFiles[index];
}

function findPrimaryPdfPaths(inputFiles, writtenFiles) {
  return inputFiles
    .map((file, index) => ((file.fieldName || 'files') === 'files' ? writtenFiles[index] : ''))
    .filter(Boolean);
}

function findAuxiliaryFilePath(inputFiles, writtenFiles, fieldName) {
  const index = inputFiles.findIndex((file) => file.fieldName === fieldName);
  return index === -1 ? '' : writtenFiles[index];
}

function requireSingleImageFile(conversionKey, inputFiles, writtenFiles) {
  const sourcePath = findPrimaryPdfPath(inputFiles, writtenFiles) || writtenFiles[0] || '';
  if (!sourcePath) {
    throw createConversionError('IMAGE_REQUIRED', '请先选择一张图片。', 400);
  }
  return sourcePath;
}

function normalizeImageOutputFormat(value, sourcePath = '', fallback = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'].includes(normalized)) {
    return normalized === 'jpeg' ? 'jpg' : normalized;
  }

  const ext = path.extname(String(sourcePath || '')).replace(/^\./, '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }

  return fallback || 'png';
}

function buildImageCommandSuffix(conversionKey) {
  const suffixMap = {
    image_fill_background: 'with-bg',
    image_dark_mode_background: 'darkmode-bg',
    image_watermark_tile: 'watermarked',
    image_grayscale: 'grayscale',
    image_invert: 'inverted',
    image_printmaking: 'printmaking',
    image_emboss: 'emboss',
    image_remove_solid_bg: 'cutout',
    image_smart_bg_remove: 'smart-cutout',
    favicon_generate: 'favicon',
    app_icon_generate: 'icons',
    chrome_icon_generate: 'chrome-icons',
    image_add_padding: 'padded',
    image_pixelate: 'pixelated',
    image_increase_size: 'upsized',
    image_clear_content: 'cleared',
    image_heic_convert: 'heic-converted',
    image_format_convert: 'converted',
    excel_extract_images: 'images',
    ppt_extract_images: 'images',
    image_modify_dpi: 'dpi',
    gif_split: 'frames',
    gif_merge: 'merged',
    png_alpha_invert: 'alpha-inverted',
    image_round_corner: 'rounded',
    image_tile_fill: 'tiled',
    id_photo_resize: 'id-sized',
    exam_id_photo_process: 'exam-id-photo',
    id_photo_crop: 'id-cropped',
    id_photo_bg_swap: 'id-bg',
    anti_ocr_image: 'anti-ocr'
  };
  return suffixMap[conversionKey] || 'output';
}

function resolveImageCommandOutputExtension(conversionKey, sourcePath, conversionOptions) {
  if (conversionKey === 'image_modify_dpi') {
    return normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath, 'png');
  }
  if (conversionKey === 'png_alpha_invert') {
    return 'png';
  }
  if (conversionKey === 'id_photo_resize' || conversionKey === 'exam_id_photo_process' || conversionKey === 'id_photo_crop' || conversionKey === 'id_photo_bg_swap') {
    return normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath, 'jpg');
  }
  if (conversionKey === 'image_heic_convert') {
    return normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath, 'jpg');
  }
  return normalizeImageOutputFormat(conversionOptions?.outputFormat, sourcePath, 'png');
}

function buildImageCommandOptions(conversionKey, conversionOptions = {}) {
  const backgroundColor = String(conversionOptions?.backgroundColor || '#ffffff');
  const tolerance = Number.parseInt(String(conversionOptions?.tolerance ?? '36'), 10) || 36;
  const outputFormat = String(conversionOptions?.outputFormat || '').trim().toLowerCase();
  const idPhotoPreset = String(conversionOptions?.idPhotoPreset || 'one_inch');

  if (conversionKey === 'image_fill_background') {
    return { backgroundColor, outputFormat };
  }
  if (conversionKey === 'image_dark_mode_background') {
    return { backgroundColor: '#ffffff', outputFormat: 'png' };
  }
  if (conversionKey === 'image_watermark_tile') {
    return {
      textContent: String(conversionOptions?.textContent || '仅供内部使用'),
      fontSize: Number.parseInt(String(conversionOptions?.fontSize ?? '24'), 10) || 24,
      opacity: toBoundedNumber(conversionOptions?.opacity, 0.22, 0.05, 0.9),
      rotation: Number.parseInt(String(conversionOptions?.rotation ?? '-28'), 10) || -28,
      gap: Number.parseInt(String(conversionOptions?.gap ?? '120'), 10) || 120,
      outputFormat
    };
  }
  if (conversionKey === 'image_printmaking') {
    return { threshold: Number.parseInt(String(conversionOptions?.threshold ?? '126'), 10) || 126, outputFormat };
  }
  if (conversionKey === 'image_remove_solid_bg') {
    return { tolerance, outputFormat: 'png' };
  }
  if (conversionKey === 'image_smart_bg_remove') {
    return {
      tolerance,
      featherRadius: Number.parseInt(String(conversionOptions?.featherRadius ?? '1'), 10) || 1,
      outputFormat: 'png'
    };
  }
  if (conversionKey === 'image_add_padding') {
    return {
      paddingTop: Number.parseInt(String(conversionOptions?.paddingTop ?? '40'), 10) || 40,
      paddingRight: Number.parseInt(String(conversionOptions?.paddingRight ?? '40'), 10) || 40,
      paddingBottom: Number.parseInt(String(conversionOptions?.paddingBottom ?? '40'), 10) || 40,
      paddingLeft: Number.parseInt(String(conversionOptions?.paddingLeft ?? '40'), 10) || 40,
      backgroundColor,
      outputFormat
    };
  }
  if (conversionKey === 'image_pixelate') {
    return { blockSize: Number.parseInt(String(conversionOptions?.blockSize ?? '12'), 10) || 12, outputFormat };
  }
  if (conversionKey === 'image_increase_size') {
    return { targetSizeKb: Number.parseInt(String(conversionOptions?.targetSizeKb ?? '100'), 10) || 100, outputFormat };
  }
  if (conversionKey === 'image_clear_content') {
    return { backgroundColor, transparent: Boolean(conversionOptions?.transparent), outputFormat };
  }
  if (conversionKey === 'image_format_convert') {
    return { outputFormat };
  }
  if (conversionKey === 'image_heic_convert') {
    return { outputFormat: ['jpg', 'png'].includes(outputFormat) ? outputFormat : 'jpg' };
  }
  if (conversionKey === 'image_modify_dpi') {
    return { dpi: Number.parseInt(String(conversionOptions?.dpi ?? '300'), 10) || 300, outputFormat };
  }
  if (conversionKey === 'png_alpha_invert') {
    return { outputFormat: 'png' };
  }
  if (conversionKey === 'image_round_corner') {
    return { radius: Number.parseInt(String(conversionOptions?.radius ?? '36'), 10) || 36, outputFormat: 'png' };
  }
  if (conversionKey === 'image_tile_fill') {
    return {
      targetWidth: Number.parseInt(String(conversionOptions?.targetWidth ?? '1200'), 10) || 1200,
      targetHeight: Number.parseInt(String(conversionOptions?.targetHeight ?? '1200'), 10) || 1200,
      outputFormat
    };
  }
  if (conversionKey === 'id_photo_resize' || conversionKey === 'exam_id_photo_process' || conversionKey === 'id_photo_crop') {
    return {
      idPhotoPreset,
      maxSizeKb: Number.parseInt(String(conversionOptions?.maxSizeKb ?? '120'), 10) || 120,
      outputFormat: outputFormat || 'jpg'
    };
  }
  if (conversionKey === 'id_photo_bg_swap') {
    return {
      backgroundColor,
      tolerance,
      outputFormat: outputFormat || 'jpg'
    };
  }
  if (conversionKey === 'anti_ocr_image') {
    return {
      noiseLevel: Number.parseInt(String(conversionOptions?.noiseLevel ?? '18'), 10) || 18,
      outputFormat
    };
  }
  if (conversionKey === 'favicon_generate' || conversionKey === 'app_icon_generate' || conversionKey === 'chrome_icon_generate' || conversionKey === 'excel_extract_images' || conversionKey === 'ppt_extract_images' || conversionKey === 'gif_split') {
    return {};
  }
  return { outputFormat };
}

function buildTextPreview(outputPath) {
  return fs.readFileSync(outputPath, 'utf8')
    .trim()
    .split(/\r?\n/)
    .slice(0, 12)
    .join('\n')
    .slice(0, 1200);
}

module.exports = {
  createConversionService
};
