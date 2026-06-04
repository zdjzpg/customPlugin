const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

function createMediaToolsService(options = {}) {
  const {
    conversionRepository,
    storageRoot,
    ffmpegBin = process.env.FFMPEG_BIN || '',
    pythonBin = process.env.PYTHON_BIN || '',
    clipAudio = (input) => defaultClipAudio({ ...input, ffmpegBin }),
    mergeAudio = (input) => defaultMergeAudio({ ...input, ffmpegBin }),
    synthesizeSpeech = (input) => defaultSynthesizeSpeech({ ...input, ffmpegBin, pythonBin })
  } = options;

  return {
    async runTool(input) {
      const record = conversionRepository.create({
        codeId: input.session.codeId || null,
        codeValue: input.session.codeValue || null,
        conversionKey: input.toolKey,
        inputFileNames: (input.files || []).map((file) => file.fileName)
      });

      const conversionId = record.id;
      const baseDirectory = path.join(storageRoot, 'conversions', String(conversionId));
      const inputDirectory = path.join(baseDirectory, 'inputs');
      const outputDirectory = path.join(baseDirectory, 'outputs');
      fs.mkdirSync(inputDirectory, { recursive: true });
      fs.mkdirSync(outputDirectory, { recursive: true });

      const writtenFiles = writeInputFiles(input.files || [], inputDirectory);

      try {
        const outputFiles = await executeMediaTool({
          toolKey: input.toolKey,
          toolOptions: input.toolOptions || {},
          writtenFiles,
          outputDirectory,
          clipAudio,
          mergeAudio,
          synthesizeSpeech
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
  };
}

async function executeMediaTool(input) {
  const {
    toolKey,
    toolOptions,
    writtenFiles,
    outputDirectory,
    clipAudio,
    mergeAudio,
    synthesizeSpeech
  } = input;

  if (toolKey === 'media_audio_clip') {
    if (writtenFiles.length !== 1) {
      throw createMediaToolError('INVALID_MEDIA_FILE_COUNT', '请先选择一个音频文件。', 400);
    }

    const inputPath = writtenFiles[0];
    const startTimeSeconds = parseClockTime(toolOptions.startTimeText || '');
    const endTimeSeconds = parseClockTime(toolOptions.endTimeText || '');
    if (!Number.isFinite(startTimeSeconds) || !Number.isFinite(endTimeSeconds) || endTimeSeconds <= startTimeSeconds) {
      throw createMediaToolError('INVALID_TIME_RANGE', '请填写正确的开始时间和结束时间。', 400);
    }

    const outputFormat = normalizeAudioFormat(toolOptions.outputFormat);
    const outputPath = path.join(outputDirectory, `${path.parse(inputPath).name}-clipped.${outputFormat}`);
    await clipAudio({
      inputPath,
      outputPath,
      startTimeSeconds,
      endTimeSeconds,
      outputFormat
    });
    return [outputPath];
  }

  if (toolKey === 'media_audio_merge') {
    if (writtenFiles.length < 2) {
      throw createMediaToolError('INSUFFICIENT_MEDIA_FILES', '请至少选择两段音频再开始合并。', 400);
    }

    const outputFormat = normalizeAudioFormat(toolOptions.outputFormat);
    const outputPath = path.join(outputDirectory, `merged-audio.${outputFormat}`);
    await mergeAudio({
      inputPaths: writtenFiles,
      outputPath,
      outputFormat
    });
    return [outputPath];
  }

  if (toolKey === 'media_text_to_speech') {
    const sourceText = String(toolOptions.sourceText || '').trim();
    if (!sourceText) {
      throw createMediaToolError('MEDIA_TEXT_REQUIRED', '请先输入要合成的文本。', 400);
    }

    const language = ['zh', 'en'].includes(toolOptions.language) ? toolOptions.language : 'zh';
    const outputFormat = normalizeAudioFormat(toolOptions.outputFormat);
    const outputPath = path.join(outputDirectory, `text-to-speech.${outputFormat}`);
    await synthesizeSpeech({
      sourceText,
      language,
      outputFormat,
      outputPath
    });
    return [outputPath];
  }

  throw createMediaToolError('UNSUPPORTED_MEDIA_TOOL', '当前音视频工具暂未接入。', 400);
}

async function defaultClipAudio(input) {
  if (!input.ffmpegBin) {
    throw createMediaToolError('FFMPEG_NOT_CONFIGURED', '当前环境还不能处理音频剪切，请先安装并配置 ffmpeg。', 400);
  }

  await runCommand(input.ffmpegBin, [
    '-y',
    '-ss',
    String(input.startTimeSeconds),
    '-to',
    String(input.endTimeSeconds),
    '-i',
    input.inputPath,
    '-vn',
    '-acodec',
    input.outputFormat === 'wav' ? 'pcm_s16le' : 'libmp3lame',
    input.outputPath
  ]);
}

async function defaultMergeAudio(input) {
  if (!input.ffmpegBin) {
    throw createMediaToolError('FFMPEG_NOT_CONFIGURED', '当前环境还不能处理音频合并，请先安装并配置 ffmpeg。', 400);
  }

  const filterInputs = input.inputPaths.map((_item, index) => `[${index}:a]`).join('');
  await runCommand(input.ffmpegBin, [
    '-y',
    ...input.inputPaths.flatMap((item) => ['-i', item]),
    '-filter_complex',
    `${filterInputs}concat=n=${input.inputPaths.length}:v=0:a=1[outa]`,
    '-map',
    '[outa]',
    '-acodec',
    input.outputFormat === 'wav' ? 'pcm_s16le' : 'libmp3lame',
    input.outputPath
  ]);
}

async function defaultSynthesizeSpeech(input) {
  if (!input.pythonBin) {
    throw createMediaToolError('PYTHON_NOT_CONFIGURED', '当前环境还不能处理文字转语音，请先配置 Python。', 400);
  }

  const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'run_conversion.py');
  await runCommand(input.pythonBin, [
    scriptPath,
    'text_to_speech',
    input.outputPath,
    input.sourceText,
    input.language,
    input.outputFormat,
    input.ffmpegBin || ''
  ]);
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

    fs.writeFileSync(outputPath, Buffer.from(file.contentBase64 || '', 'base64'));
    return outputPath;
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
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
      if (error?.code === 'ENOENT') {
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

function parseClockTime(value) {
  const text = String(value || '').trim();
  if (!text) {
    return Number.NaN;
  }

  const segments = text.split(':').map((item) => item.trim());
  if (segments.some((item) => item === '')) {
    return Number.NaN;
  }

  const numericSegments = segments.map((item) => Number.parseFloat(item));
  if (numericSegments.some((item) => !Number.isFinite(item))) {
    return Number.NaN;
  }

  if (numericSegments.length === 1) {
    return numericSegments[0];
  }
  if (numericSegments.length === 2) {
    return (numericSegments[0] * 60) + numericSegments[1];
  }

  return (numericSegments[0] * 3600) + (numericSegments[1] * 60) + numericSegments[2];
}

function normalizeAudioFormat(value) {
  return String(value || '').toLowerCase() === 'wav' ? 'wav' : 'mp3';
}

function sanitizeFileName(fileName) {
  return String(fileName || 'media-file')
    .normalize('NFC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim() || 'media-file';
}

function createMediaToolError(reason, message, statusCode) {
  const error = new Error(message);
  error.reason = reason;
  error.statusCode = statusCode;
  return error;
}

module.exports = {
  createMediaToolsService,
  parseClockTime
};
