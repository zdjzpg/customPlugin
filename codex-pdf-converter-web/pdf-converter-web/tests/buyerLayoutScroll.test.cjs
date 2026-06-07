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
    /body\s*\{[\s\S]*overflow:\s*hidden/
  );
  assert.match(
    styles,
    /\.buyer-station-shell\s*\{[\s\S]*width:\s*min\(1600px,\s*calc\(100vw - 40px\)\)[\s\S]*height:\s*calc\(100vh - 40px\)/ 
  );
  assert.match(
    styles,
    /\.buyer-layout\s*\{[\s\S]*height:\s*calc\(100% - 72px\)[\s\S]*overflow:\s*hidden/
  );
  assert.match(
    styles,
    /\.buyer-side-nav\s*\{[\s\S]*overflow-y:\s*auto/
  );
  assert.match(
    styles,
    /\.buyer-main-shell\s*\{[\s\S]*height:\s*100%[\s\S]*overflow-y:\s*auto/
  );
});
