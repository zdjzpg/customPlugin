const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('desktop buyer layout keeps the side nav fixed while the main shell scrolls independently', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'styles.css'),
    'utf8'
  );

  assert.match(
    styles,
    /\.buyer-layout\s*\{[\s\S]*height:\s*calc\(100vh - 57px\)[\s\S]*overflow:\s*hidden/
  );
  assert.match(
    styles,
    /\.buyer-side-nav\s*\{[\s\S]*overflow-y:\s*auto/
  );
  assert.match(
    styles,
    /\.buyer-main-shell\s*\{[\s\S]*height:\s*calc\(100vh - 57px\)[\s\S]*overflow-y:\s*auto/
  );
});
