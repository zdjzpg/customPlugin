function createAuthService(options) {
  const {
    adminUsername,
    adminPassword,
    adminSessionTtlMs,
    buyerSessionTtlMs,
    nowFn = () => new Date(),
    randomIdFn = () => Math.random().toString(36).slice(2)
  } = options;

  function loginAdmin(credentials) {
    if (
      credentials.username !== adminUsername ||
      credentials.password !== adminPassword
    ) {
      return null;
    }

    return {
      role: 'admin',
      token: randomIdFn(),
      expiresAt: addMs(nowFn(), adminSessionTtlMs).toISOString()
    };
  }

  function loginBuyer(codeRecord) {
    return {
      role: 'buyer',
      token: randomIdFn(),
      codeId: codeRecord.codeId,
      codeValue: codeRecord.codeValue,
      expiresAt: addMs(nowFn(), buyerSessionTtlMs).toISOString()
    };
  }

  return {
    loginAdmin,
    loginBuyer
  };
}

function addMs(date, ms) {
  return new Date(date.getTime() + ms);
}

module.exports = {
  createAuthService
};
