const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createConversionResultMarkup renders generated-result cards with clear download actions', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'resultCard.mjs')
  ).href;
  const { createConversionResultMarkup } = await import(moduleUrl);

  const html = createConversionResultMarkup(
    [
      {
        fileName: 'sample.pdf',
        downloadUrl: '/api/downloads/conversions/1/sample.pdf'
      }
    ],
    '刚刚生成'
  );

  assert.match(html, /新生成文件/);
  assert.match(html, /sample\.pdf/);
  assert.match(html, /立即下载/);
  assert.match(html, /刚刚生成/);
  assert.match(html, /result-download/);
});
