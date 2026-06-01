const TOP_PATTERN = ['58%', '16%', '42%', '24%', '66%', '30%', '50%', '72%'];
const ROTATE_PATTERN = ['-10deg', '8deg', '-5deg', '11deg', '-12deg', '7deg', '6deg', '-7deg'];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toPercent(value) {
  return `${Math.round(value * 100) / 100}%`;
}

function getLeftPercent(index, count) {
  if (count <= 1) {
    return 46;
  }

  const min = 8;
  const max = 84;
  const step = (max - min) / (count - 1);
  return clamp(min + (step * index), min, max);
}

function buildLetterScatterLayouts(letters = []) {
  return letters.map((letter, index) => ({
    left: toPercent(getLeftPercent(index, letters.length)),
    top: TOP_PATTERN[index % TOP_PATTERN.length],
    rotate: ROTATE_PATTERN[index % ROTATE_PATTERN.length]
  }));
}

module.exports = {
  buildLetterScatterLayouts
};
