function createRedemptionCodeService(options) {
  const { codeRepository } = options;
  let nowFn = options.nowFn || (() => new Date());

  function consumeForLogin(codeValue) {
    const record = codeRepository.findByCode(codeValue);
    if (!record) {
      return {
        ok: false,
        reason: 'CODE_NOT_FOUND'
      };
    }

    if (record.status !== 'active') {
      return {
        ok: false,
        reason: 'CODE_DISABLED'
      };
    }

    const now = nowFn();

    if (record.accessType === 'usage') {
      const remainingUses = record.maxUses - record.usedCount;
      if (remainingUses <= 0) {
        return {
          ok: false,
          reason: 'CODE_EXHAUSTED'
        };
      }

      const updatedRecord = {
        ...record,
        usedCount: record.usedCount + 1
      };

      codeRepository.save(updatedRecord);

      return {
        ok: true,
        codeRecord: toViewModel(updatedRecord)
      };
    }

    if (record.accessType === 'duration') {
      if (record.expiresAt && now >= new Date(record.expiresAt)) {
        return {
          ok: false,
          reason: 'CODE_EXPIRED'
        };
      }

      const updatedRecord = activateDurationCodeIfNeeded(record, now);
      codeRepository.save(updatedRecord);

      return {
        ok: true,
        codeRecord: toViewModel(updatedRecord)
      };
    }

    return {
      ok: false,
      reason: 'CODE_TYPE_UNSUPPORTED'
    };
  }

  function setNow(nextNowFn) {
    nowFn = nextNowFn;
  }

  return {
    consumeForLogin,
    setNow
  };
}

function activateDurationCodeIfNeeded(record, now) {
  if (record.activatedAt && record.expiresAt) {
    return { ...record };
  }

  const expiresAt = addDays(now, record.durationDays);

  return {
    ...record,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

function toViewModel(record) {
  return {
    ...record,
    remainingUses:
      typeof record.maxUses === 'number'
        ? Math.max(record.maxUses - record.usedCount, 0)
        : null
  };
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

module.exports = {
  createRedemptionCodeService
};
