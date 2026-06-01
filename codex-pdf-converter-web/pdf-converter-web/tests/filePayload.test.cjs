const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('serializeBrowserFile builds payload from injected data-url reader', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'filePayload.mjs')
  ).href;
  const { serializeBrowserFile } = await import(moduleUrl);

  const payload = await serializeBrowserFile(
    { name: 'report.docx' },
    async () =>
      'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,QUJDREVGRw=='
  );

  assert.deepEqual(payload, {
    fileName: 'report.docx',
    contentBase64: 'QUJDREVGRw=='
  });
});

test('serializeBrowserFile rejects invalid data-url payloads', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'filePayload.mjs')
  ).href;
  const { serializeBrowserFile } = await import(moduleUrl);

  await assert.rejects(
    () => serializeBrowserFile({ name: 'bad.docx' }, async () => 'not-a-data-url'),
    /Failed to read file payload/
  );
});
