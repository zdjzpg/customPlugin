const test = require('node:test');
const assert = require('node:assert/strict');

const { createRedemptionCodeService } = require('../server/services/redemptionCodeService.cjs');

test('usage-based code decrements remaining uses on login', () => {
  const codeRepository = createInMemoryCodeRepository([
    {
      id: 1,
      code: 'USES-5',
      accessType: 'usage',
      maxUses: 5,
      usedCount: 1,
      durationDays: null,
      activatedAt: null,
      expiresAt: null,
      status: 'active'
    }
  ]);

  const service = createRedemptionCodeService({
    codeRepository,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z')
  });

  const result = service.consumeForLogin('USES-5');

  assert.equal(result.ok, true);
  assert.equal(result.codeRecord.usedCount, 2);
  assert.equal(result.codeRecord.remainingUses, 3);
});

test('usage-based code rejects exhausted codes', () => {
  const codeRepository = createInMemoryCodeRepository([
    {
      id: 1,
      code: 'USES-0',
      accessType: 'usage',
      maxUses: 1,
      usedCount: 1,
      durationDays: null,
      activatedAt: null,
      expiresAt: null,
      status: 'active'
    }
  ]);

  const service = createRedemptionCodeService({
    codeRepository,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z')
  });

  const result = service.consumeForLogin('USES-0');

  assert.deepEqual(result, {
    ok: false,
    reason: 'CODE_EXHAUSTED'
  });
});

test('duration-based code activates on first login and stays reusable before expiration', () => {
  const codeRepository = createInMemoryCodeRepository([
    {
      id: 2,
      code: 'DAYS-7',
      accessType: 'duration',
      maxUses: null,
      usedCount: 0,
      durationDays: 7,
      activatedAt: null,
      expiresAt: null,
      status: 'active'
    }
  ]);

  const service = createRedemptionCodeService({
    codeRepository,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z')
  });

  const firstLogin = service.consumeForLogin('DAYS-7');

  assert.equal(firstLogin.ok, true);
  assert.equal(firstLogin.codeRecord.activatedAt, '2026-06-01T10:00:00.000Z');
  assert.equal(firstLogin.codeRecord.expiresAt, '2026-06-08T10:00:00.000Z');

  service.setNow(() => new Date('2026-06-04T10:00:00.000Z'));
  const secondLogin = service.consumeForLogin('DAYS-7');

  assert.equal(secondLogin.ok, true);
  assert.equal(secondLogin.codeRecord.activatedAt, '2026-06-01T10:00:00.000Z');
  assert.equal(secondLogin.codeRecord.expiresAt, '2026-06-08T10:00:00.000Z');
});

test('duration-based code rejects expired codes', () => {
  const codeRepository = createInMemoryCodeRepository([
    {
      id: 2,
      code: 'DAYS-7-EXPIRED',
      accessType: 'duration',
      maxUses: null,
      usedCount: 0,
      durationDays: 7,
      activatedAt: '2026-05-01T10:00:00.000Z',
      expiresAt: '2026-05-08T10:00:00.000Z',
      status: 'active'
    }
  ]);

  const service = createRedemptionCodeService({
    codeRepository,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z')
  });

  const result = service.consumeForLogin('DAYS-7-EXPIRED');

  assert.deepEqual(result, {
    ok: false,
    reason: 'CODE_EXPIRED'
  });
});

test('disabled code rejects login explicitly', () => {
  const codeRepository = createInMemoryCodeRepository([
    {
      id: 3,
      code: 'DISABLED-1',
      accessType: 'usage',
      maxUses: 3,
      usedCount: 0,
      durationDays: null,
      activatedAt: null,
      expiresAt: null,
      status: 'disabled'
    }
  ]);

  const service = createRedemptionCodeService({
    codeRepository,
    nowFn: () => new Date('2026-06-01T10:00:00.000Z')
  });

  const result = service.consumeForLogin('DISABLED-1');

  assert.deepEqual(result, {
    ok: false,
    reason: 'CODE_DISABLED'
  });
});

function createInMemoryCodeRepository(initialRecords) {
  const records = initialRecords.map((record) => ({ ...record }));

  return {
    findByCode(code) {
      const record = records.find((item) => item.code === code);
      return record ? { ...record } : null;
    },
    save(record) {
      const index = records.findIndex((item) => item.id === record.id);
      if (index === -1) {
        records.push({ ...record });
        return;
      }

      records[index] = { ...record };
    }
  };
}
