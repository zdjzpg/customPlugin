const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('validateSelectedFiles rejects files above the single-file size limit', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'conversionValidation.mjs')
  ).href;
  const { validateSelectedFiles } = await import(moduleUrl);

  const message = validateSelectedFiles(
    [{ name: 'large.pdf', size: 31 * 1024 * 1024 }],
    ['.pdf'],
    { maxFileSizeMb: 30 }
  );

  assert.equal(message, 'large.pdf 超过 30MB，请压缩或拆分后再上传。');
});

test('validateSelectedFiles rejects files with unsupported extension', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'conversionValidation.mjs')
  ).href;
  const { validateSelectedFiles } = await import(moduleUrl);

  const message = validateSelectedFiles(
    [{ name: 'demo.txt', size: 100 }],
    ['.pdf'],
    { maxFileSizeMb: 30 }
  );

  assert.equal(message, '当前不支持 demo.txt 这个文件格式。');
});

test('validateSelectedFiles rejects file groups above the total size limit', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'conversionValidation.mjs')
  ).href;
  const { validateSelectedFiles } = await import(moduleUrl);

  const message = validateSelectedFiles(
    [
      { name: 'a.png', size: 20 * 1024 * 1024 },
      { name: 'b.png', size: 20 * 1024 * 1024 }
    ],
    ['.png'],
    { maxFileSizeMb: 25, maxTotalFileSizeMb: 30 }
  );

  assert.equal(message, '本次上传总大小超过 30MB，请减少文件数量或先压缩。');
});
