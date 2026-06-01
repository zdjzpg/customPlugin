const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('api server allows larger JSON payloads for image-based paper configs', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server', 'index.js'), 'utf8');

  assert.match(source, /express\.json\(\{ limit: '20mb' \}\)/);
});
