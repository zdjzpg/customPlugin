const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('user create form forces input, password, and select controls to the same height', () => {
  const stylesSource = read('src/styles.css');
  const match = stylesSource.match(
    /\.admin-create-form \.ant-input,\s*\.admin-create-form \.ant-input-affix-wrapper,\s*\.admin-create-form \.ant-select-single:not\(\.ant-select-customize-input\) \.ant-select-selector\s*\{([\s\S]*?)\}/
  );
  assert.ok(match, 'Expected a dedicated height rule for the user create form controls');

  assert.match(match[1], /height:\s*46px;/);
});

test('user create password field does not stretch the inner input to full wrapper height', () => {
  const stylesSource = read('src/styles.css');

  assert.doesNotMatch(
    stylesSource,
    /\.admin-create-form \.ant-input-affix-wrapper \.ant-input\s*\{[\s\S]*?height:\s*100%;[\s\S]*?\}/
  );
});
