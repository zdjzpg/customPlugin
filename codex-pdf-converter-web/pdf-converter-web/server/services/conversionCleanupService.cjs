const fs = require('node:fs');
const path = require('node:path');

function createConversionCleanupService(options) {
  const {
    conversionRepository,
    storageRoot,
    retentionDays = 3,
    nowFn = () => new Date()
  } = options;

  const conversionsRoot = path.resolve(path.join(storageRoot, 'conversions'));

  return {
    cleanupExpiredOutputs() {
      const cutoff = new Date(nowFn().getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
      const records = conversionRepository.listCleanupCandidatesBefore(cutoff);
      return cleanupRecords(records);
    },
    cleanupOutputsByCodeValue(codeValue) {
      const normalizedCodeValue = String(codeValue || '').trim();
      if (!normalizedCodeValue) {
        const error = new Error('请先输入卡密值后再清理历史文件。');
        error.statusCode = 400;
        error.reason = 'INVALID_CODE_VALUE';
        throw error;
      }

      const records = conversionRepository.listByCodeValue(normalizedCodeValue);
      return cleanupRecords(records);
    }
  };

  function cleanupRecords(records) {
    const cleanedAt = nowFn().toISOString();
    let cleanedConversions = 0;
    let cleanedFiles = 0;

    for (const record of Array.isArray(records) ? records : []) {
      const outputFiles = Array.isArray(record.outputFiles) ? record.outputFiles : [];
      const pendingFiles = outputFiles.filter((file) => !file.cleanedAt);
      if (!pendingFiles.length) {
        continue;
      }

      const conversionDirectory = resolveConversionDirectory(record.id);
      if (fs.existsSync(conversionDirectory)) {
        fs.rmSync(conversionDirectory, { recursive: true, force: true });
      }

      const nextOutputFiles = outputFiles.map((file) => (
        file.cleanedAt
          ? file
          : {
              ...file,
              cleanedAt
            }
      ));

      conversionRepository.markOutputFilesCleaned(record.id, nextOutputFiles);
      cleanedConversions += 1;
      cleanedFiles += pendingFiles.length;
    }

    return {
      cleanedConversions,
      cleanedFiles
    };
  }

  function resolveConversionDirectory(conversionId) {
    const absolutePath = path.resolve(path.join(conversionsRoot, String(conversionId)));
    const relativeToRoot = path.relative(conversionsRoot, absolutePath);
    if (
      relativeToRoot.startsWith('..') ||
      path.isAbsolute(relativeToRoot)
    ) {
      throw new Error('Refusing to clean a directory outside the conversions root.');
    }

    return absolutePath;
  }
}

module.exports = {
  createConversionCleanupService
};
