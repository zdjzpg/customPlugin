const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('buyer detail forms use managed submit binding instead of relying only on native submit', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  assert.match(script, /function bindManagedFormSubmit\(form, submitHandler\) \{/);
  assert.match(script, /form\.noValidate = true;/);
  assert.match(script, /submitButton\.addEventListener\('click', \(event\) => \{/);
  assert.match(script, /bindManagedFormSubmit\(form, handleRemoteMediaToolSubmit\);/);
  assert.match(script, /bindManagedFormSubmit\(form, handleConversionSubmit\);/);
});
