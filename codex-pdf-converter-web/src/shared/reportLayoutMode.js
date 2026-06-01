function toViewportNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function resolveReportLayoutMode(viewportWidth, viewportHeight) {
  const width = toViewportNumber(viewportWidth, 1920);
  const height = toViewportNumber(viewportHeight, 1080);

  if (width <= 1366 || height <= 980) {
    return 'ipad';
  }

  return 'desktop';
}

module.exports = {
  resolveReportLayoutMode
};
