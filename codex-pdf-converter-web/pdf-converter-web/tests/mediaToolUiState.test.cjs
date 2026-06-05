const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('remote media submit flow does not emit an extra bottom processing message while progress card is shown', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  const start = script.indexOf('async function handleRemoteMediaToolSubmit(event) {');
  const end = script.indexOf('async function handleLocalMediaToolSubmit(event) {');
  const source = script.slice(start, end);

  assert.doesNotMatch(source, /setMessage\(getConversionMessageElement\(\), '正在处理\.\.\.'\);/);
});
