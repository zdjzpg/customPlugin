const test = require('node:test');
const assert = require('node:assert/strict');

const { createAuthService } = require('../server/services/authService.cjs');

test('admin login returns a persistent session when credentials match', () => {
  const authService = createAuthService({
    adminUsername: 'admin',
    adminPassword: 'secret',
    adminSessionTtlMs: 60 * 60 * 1000,
    buyerSessionTtlMs: 24 * 60 * 60 * 1000,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z'),
    randomIdFn: () => 'session-admin-1'
  });

  const session = authService.loginAdmin({
    username: 'admin',
    password: 'secret'
  });

  assert.deepEqual(session, {
    role: 'admin',
    token: 'session-admin-1',
    expiresAt: '2026-06-01T11:00:00.000Z'
  });
});

test('admin login rejects incorrect credentials', () => {
  const authService = createAuthService({
    adminUsername: 'admin',
    adminPassword: 'secret',
    adminSessionTtlMs: 60 * 60 * 1000,
    buyerSessionTtlMs: 24 * 60 * 60 * 1000,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z'),
    randomIdFn: () => 'session-admin-1'
  });

  const session = authService.loginAdmin({
    username: 'admin',
    password: 'wrong'
  });

  assert.equal(session, null);
});

test('buyer login returns a longer-lived session with the code attached', () => {
  const authService = createAuthService({
    adminUsername: 'admin',
    adminPassword: 'secret',
    adminSessionTtlMs: 60 * 60 * 1000,
    buyerSessionTtlMs: 3 * 24 * 60 * 60 * 1000,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z'),
    randomIdFn: () => 'session-buyer-1'
  });

  const session = authService.loginBuyer({
    codeId: 12,
    codeValue: 'BUYER-2026'
  });

  assert.deepEqual(session, {
    role: 'buyer',
    token: 'session-buyer-1',
    codeId: 12,
    codeValue: 'BUYER-2026',
    expiresAt: '2026-06-04T10:00:00.000Z'
  });
});
