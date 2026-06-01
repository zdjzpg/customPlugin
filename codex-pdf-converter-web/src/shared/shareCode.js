function generateShareCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeShareCode(value) {
  return String(value || '').replace(/\D+/g, '').slice(0, 6);
}

module.exports = {
  generateShareCode,
  normalizeShareCode
};
