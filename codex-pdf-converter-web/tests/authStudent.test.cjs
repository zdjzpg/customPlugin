const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../server/auth');
const { getMissingStudentFields } = require('../src/shared/studentValidation');

test('hashPassword and verifyPassword accept the original password and reject a different one', () => {
  const hash = hashPassword('123456');
  assert.ok(hash);
  assert.equal(verifyPassword('123456', hash), true);
  assert.equal(verifyPassword('654321', hash), false);
});

test('getMissingStudentFields reports all required intake fields that are blank', () => {
  assert.deepEqual(
    getMissingStudentFields({ name: 'Tom', phone: '', age: '6', grade: '' }),
    ['phone', 'grade']
  );
  assert.deepEqual(
    getMissingStudentFields({ name: 'Tom', phone: '13800000000', age: '6', grade: 'һ�꼶' }),
    []
  );
});
