const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '../src/components/shared/SubmissionReportCapture.vue'),
  'utf8'
);

test('submission report capture does not apply a capture-only svg text font override', () => {
  assert.doesNotMatch(
    source,
    /:deep\(text\)/,
    'expected SubmissionReportCapture to avoid a capture-only SVG text font override'
  );
});
