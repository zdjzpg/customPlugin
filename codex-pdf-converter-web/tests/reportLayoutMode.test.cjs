const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveReportLayoutMode } = require('../src/shared/reportLayoutMode');

test('resolveReportLayoutMode keeps wide and tall viewports on desktop layout', () => {
  assert.equal(resolveReportLayoutMode(1600, 1100), 'desktop');
});

test('resolveReportLayoutMode falls back to ipad layout for narrow screens', () => {
  assert.equal(resolveReportLayoutMode(1366, 1100), 'ipad');
});

test('resolveReportLayoutMode falls back to ipad layout for wide but short desktop screens', () => {
  assert.equal(resolveReportLayoutMode(1920, 940), 'ipad');
});
