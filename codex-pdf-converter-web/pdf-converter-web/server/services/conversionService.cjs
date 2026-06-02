const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { parsePageSelection } = require('./pageSelectionParser.cjs');

function createConversionService(options) {
  const {
    conversionRepository,
    storageRoot,
    pythonBin,
    libreOfficeBin = process.env.LIBREOFFICE_BIN || '',
    popplerBinDir = process.env.POPPLER_BIN_DIR || '',
    ghostscriptBin = process.env.GHOSTSCRIPT_BIN || '',
    ocrmypdfBin = process.env.OCRMYPDF_BIN || ''
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
        writtenFiles,
        outputDirectory,
        pythonBin,
        libreOfficeBin,
        popplerBinDir,
        ghostscriptBin,
        ocrmypdfBin
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
        key: 'pdf_to_word',
        label: 'PDF 转 Word',
        status: 'available',
        accepts: '.pdf',
        maxFileSizeMb: 30,
        helperText: '支持文本型 PDF 直接转 Word，也支持 OCR 识别扫描件后导出 Word。'
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
      }
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
    writtenFiles,
    outputDirectory,
    pythonBin,
    libreOfficeBin,
    popplerBinDir,
    ghostscriptBin,
    ocrmypdfBin
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
      }
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

module.exports = {
  createConversionService
};
