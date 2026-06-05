const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('buyer app source registers 音视频工具 as a top-level category', () => {
  const appSource = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'buyerCategoryCatalog.mjs'),
    'utf8'
  );

  assert.match(appSource, /key:\s*'media_tools'/);
  assert.match(appSource, /label:\s*'音视频工具'/);
});
