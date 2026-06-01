const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/views/ConfiguredPapersView.vue'), 'utf8');

test('configured papers tracks viewport width for responsive table behavior', () => {
  assert.match(
    source,
    /const viewportWidth = ref\(typeof window === 'undefined' \? \d+ : window\.innerWidth\)/,
    'expected ConfiguredPapersView to track viewport width'
  );
  assert.match(
    source,
    /window\.addEventListener\('resize', handleViewportResize\)/,
    'expected ConfiguredPapersView to update viewport width on resize'
  );
});

test('configured papers only fixes the actions column on wide screens', () => {
  assert.match(
    source,
    /const isCompactTableViewport = computed\(\(\) => viewportWidth\.value < \d+\)/,
    'expected a compact viewport breakpoint for the papers table'
  );
  assert.match(
    source,
    /fixed:\s*isCompactTableViewport\.value\s*\?\s*undefined\s*:\s*'right'/,
    'expected the actions column to stop using fixed right positioning on compact screens'
  );
});
