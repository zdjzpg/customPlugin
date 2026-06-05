const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createConversionCleanupService } = require('../server/services/conversionCleanupService.cjs');

test('cleanupExpiredOutputs removes conversion directories older than the retention window and marks files as cleaned', () => {
  const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-conv-cleanup-'));
  const oldDirectory = path.join(storageRoot, 'conversions', '11', 'outputs');
  fs.mkdirSync(oldDirectory, { recursive: true });
  fs.writeFileSync(path.join(oldDirectory, 'sample.pdf'), 'demo');

  const updatedRecords = [];
  const cleanupService = createConversionCleanupService({
    storageRoot,
    nowFn: () => new Date('2026-06-05T12:00:00.000Z'),
    conversionRepository: {
      listCleanupCandidatesBefore(cutoff) {
        assert.equal(cutoff, '2026-06-02T12:00:00.000Z');
        return [
          {
            id: 11,
            outputFiles: [
              {
                fileName: 'sample.pdf',
                relativePath: path.join('conversions', '11', 'outputs', 'sample.pdf')
              }
            ]
          }
        ];
      },
      markOutputFilesCleaned(conversionId, outputFiles) {
        updatedRecords.push({
          conversionId,
          outputFiles
        });
      }
    }
  });

  const result = cleanupService.cleanupExpiredOutputs();

  assert.deepEqual(result, {
    cleanedConversions: 1,
    cleanedFiles: 1
  });
  assert.equal(fs.existsSync(path.join(storageRoot, 'conversions', '11')), false);
  assert.equal(updatedRecords.length, 1);
  assert.equal(updatedRecords[0].conversionId, 11);
  assert.match(updatedRecords[0].outputFiles[0].cleanedAt, /2026-06-05T12:00:00.000Z/);
});

test('cleanupOutputsByCodeValue removes files for one code and keeps records for already-cleaned files untouched', () => {
  const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-conv-code-cleanup-'));
  const codeDirectory = path.join(storageRoot, 'conversions', '21', 'outputs');
  fs.mkdirSync(codeDirectory, { recursive: true });
  fs.writeFileSync(path.join(codeDirectory, 'result.zip'), 'demo');

  const updatedRecords = [];
  const cleanupService = createConversionCleanupService({
    storageRoot,
    nowFn: () => new Date('2026-06-05T09:00:00.000Z'),
    conversionRepository: {
      listByCodeValue(codeValue) {
        assert.equal(codeValue, 'DEMO-DAYS-7');
        return [
          {
            id: 21,
            outputFiles: [
              {
                fileName: 'result.zip',
                relativePath: path.join('conversions', '21', 'outputs', 'result.zip')
              }
            ]
          },
          {
            id: 22,
            outputFiles: [
              {
                fileName: 'old.pdf',
                relativePath: path.join('conversions', '22', 'outputs', 'old.pdf'),
                cleanedAt: '2026-06-04T00:00:00.000Z'
              }
            ]
          }
        ];
      },
      markOutputFilesCleaned(conversionId, outputFiles) {
        updatedRecords.push({
          conversionId,
          outputFiles
        });
      }
    }
  });

  const result = cleanupService.cleanupOutputsByCodeValue('DEMO-DAYS-7');

  assert.deepEqual(result, {
    cleanedConversions: 1,
    cleanedFiles: 1
  });
  assert.equal(fs.existsSync(path.join(storageRoot, 'conversions', '21')), false);
  assert.equal(updatedRecords.length, 1);
  assert.equal(updatedRecords[0].conversionId, 21);
});
