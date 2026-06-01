function toPositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return parsed;
}

function roundScale(value) {
  return Math.round(value * 1000) / 1000;
}

function calculateContainScale({
  viewportWidth,
  viewportHeight,
  contentWidth,
  contentHeight
}) {
  const width = toPositiveNumber(viewportWidth);
  const height = toPositiveNumber(viewportHeight);
  const contentW = toPositiveNumber(contentWidth);
  const contentH = toPositiveNumber(contentHeight);

  if (!width || !height || !contentW || !contentH) {
    return 1;
  }

  const widthScale = width / contentW;
  const heightScale = height / contentH;
  const next = Math.min(1, widthScale, heightScale);

  return roundScale(next > 0 ? next : 1);
}

function calculateContainBox({
  viewportWidth,
  viewportHeight,
  contentWidth,
  contentHeight
}) {
  const width = toPositiveNumber(viewportWidth);
  const height = toPositiveNumber(viewportHeight);
  const contentW = toPositiveNumber(contentWidth);
  const contentH = toPositiveNumber(contentHeight);

  if (!width || !height || !contentW || !contentH) {
    return {
      width: 0,
      height: 0,
      scale: 1
    };
  }

  const nextScale = Math.min(1, width / contentW, height / contentH);
  const scale = roundScale(nextScale > 0 ? nextScale : 1);

  return {
    width: roundScale(contentW * nextScale),
    height: roundScale(contentH * nextScale),
    scale
  };
}

module.exports = {
  calculateContainScale,
  calculateContainBox
};
