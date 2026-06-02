const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('moveItemByOffset moves a selected file upward within bounds', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'fileSelectionOrder.mjs')
  ).href;
  const { moveItemByOffset } = await import(moduleUrl);

  const result = moveItemByOffset(
    [
      { name: 'chapter-2.pdf' },
      { name: 'chapter-1.pdf' },
      { name: 'appendix.pdf' }
    ],
    1,
    -1
  );

  assert.deepEqual(result.map((file) => file.name), [
    'chapter-1.pdf',
    'chapter-2.pdf',
    'appendix.pdf'
  ]);
});

test('createSelectedFileOrderMarkup renders up and down controls with disabled edge states', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'fileSelectionOrder.mjs')
  ).href;
  const { createSelectedFileOrderMarkup } = await import(moduleUrl);

  const html = createSelectedFileOrderMarkup([
    { name: 'chapter-2.pdf' },
    { name: 'chapter-1.pdf' }
  ]);

  assert.match(html, /chapter-2\.pdf/);
  assert.match(html, /chapter-1\.pdf/);
  assert.match(html, /上移/);
  assert.match(html, /下移/);
  assert.match(html, /data-move-file-index="0"/);
  assert.match(html, /disabled/);
});
