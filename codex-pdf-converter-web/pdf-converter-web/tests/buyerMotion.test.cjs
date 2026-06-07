const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('buyer app source distinguishes category switch and search refresh motion modes', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  assert.match(script, /renderToolList\('category_switch'\)/);
  assert.match(script, /refreshToolListContent\('search_refresh'\)/);
});

test('buyer motion source defines stronger category-switch card transitions than search refresh', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'buyerMotion.mjs'),
    'utf8'
  );

  assert.match(script, /mode === 'category_switch'/);
  assert.match(script, /mode === 'search_refresh'/);
  assert.match(script, /mode === 'category_switch' \? 'edges' : 'start'/);
  assert.match(script, /x:\s*\(index\)\s*=>/);
});
