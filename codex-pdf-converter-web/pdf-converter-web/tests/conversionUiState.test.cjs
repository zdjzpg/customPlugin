const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('file conversion submit flow does not emit an extra bottom uploading message while progress card is shown', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  const start = script.indexOf('async function handleConversionSubmit(event) {');
  const end = script.indexOf('function renderResults(conversionKey, files) {');
  const source = script.slice(start, end);

  assert.doesNotMatch(source, /setMessage\(getConversionMessageElement\(\), '正在上传并转换\.\.\.'\);/);
});
