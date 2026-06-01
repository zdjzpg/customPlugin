const test = require('node:test');
const assert = require('node:assert/strict');
const { generateShareCode, normalizeShareCode } = require('../src/shared/shareCode');

test('generateShareCode returns a 6-digit numeric code', () => {
  const code = generateShareCode();
  assert.match(code, /^\d{6}$/);
});

test('normalizeShareCode keeps valid 6-digit code and removes invalid characters', () => {
  assert.equal(normalizeShareCode(' 12a3-45 6 '), '123456');
  assert.equal(normalizeShareCode('001234'), '001234');
  assert.equal(normalizeShareCode('12'), '12');
});
