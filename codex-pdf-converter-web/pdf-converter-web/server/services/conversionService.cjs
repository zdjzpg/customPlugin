const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

function createConversionService(options) {
  const {
    conversionRepository,
    storageRoot,
    pythonBin,
    libreOfficeBin = process.env.LIBREOFFICE_BIN || '',
    popplerBinDir = process.env.POPPLER_BIN_DIR || ''
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
        writtenFiles,
        outputDirectory,
        pythonBin,
        libreOfficeBin,
        popplerBinDir
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
        }))
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
  const { conversionKey, writtenFiles, outputDirectory, pythonBin, libreOfficeBin, popplerBinDir } = options;

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

module.exports = {
  createConversionService
};
