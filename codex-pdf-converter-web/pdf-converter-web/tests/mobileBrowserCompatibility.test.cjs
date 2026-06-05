const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('buyer app source keeps a MediaQueryList fallback for older mobile browsers', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  assert.match(script, /addListener/);
  assert.match(script, /addEventListener\('change'/);
});
