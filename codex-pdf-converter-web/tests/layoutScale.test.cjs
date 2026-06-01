const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateContainScale, calculateContainBox } = require('../src/shared/layoutScale');

test('returns 1 when content already fits in the viewport', () => {
  const scale = calculateContainScale({
    viewportWidth: 1200,
    viewportHeight: 700,
    contentWidth: 1000,
    contentHeight: 600
  });

  assert.equal(scale, 1);
});

test('scales down by height when content is too tall', () => {
  const scale = calculateContainScale({
    viewportWidth: 1200,
    viewportHeight: 600,
    contentWidth: 900,
    contentHeight: 900
  });

  assert.equal(scale, 0.667);
});

test('scales down by width when content is too wide', () => {
  const scale = calculateContainScale({
    viewportWidth: 800,
    viewportHeight: 800,
    contentWidth: 1000,
    contentHeight: 400
  });

  assert.equal(scale, 0.8);
});

test('returns 1 when dimensions are invalid', () => {
  const scale = calculateContainScale({
    viewportWidth: 0,
    viewportHeight: 800,
    contentWidth: 1000,
    contentHeight: 400
  });

  assert.equal(scale, 1);
});

test('calculateContainBox keeps a portrait scene fully visible in a wider viewport', () => {
  const box = calculateContainBox({
    viewportWidth: 2000,
    viewportHeight: 1000,
    contentWidth: 1000,
    contentHeight: 1500
  });

  assert.deepEqual(box, {
    width: 666.667,
    height: 1000,
    scale: 0.667
  });
});

test('calculateContainBox keeps a wide scene fully visible in a taller viewport', () => {
  const box = calculateContainBox({
    viewportWidth: 900,
    viewportHeight: 1200,
    contentWidth: 1600,
    contentHeight: 900
  });

  assert.deepEqual(box, {
    width: 900,
    height: 506.25,
    scale: 0.563
  });
});
