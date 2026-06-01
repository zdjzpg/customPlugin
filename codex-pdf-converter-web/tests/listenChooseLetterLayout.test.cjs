const test = require('node:test');
const assert = require('node:assert/strict');

const { buildLetterScatterLayouts } = require('../src/shared/listenChooseLetterLayout');

function percentValue(value) {
  return Number(String(value).replace('%', ''));
}

test('buildLetterScatterLayouts spreads four letters across the full garden width', () => {
  const layouts = buildLetterScatterLayouts(['a', 'b', 'c', 'd']);
  const lefts = layouts.map((item) => percentValue(item.left));

  assert.equal(layouts.length, 4);
  assert.ok(lefts[0] <= 12);
  assert.ok(lefts[3] >= 80);
  assert.ok(lefts[1] > lefts[0]);
  assert.ok(lefts[2] > lefts[1]);
  assert.ok(lefts[3] > lefts[2]);
});

test('buildLetterScatterLayouts keeps a single letter near the middle', () => {
  const [layout] = buildLetterScatterLayouts(['a']);
  const left = percentValue(layout.left);

  assert.ok(left >= 40);
  assert.ok(left <= 52);
});
