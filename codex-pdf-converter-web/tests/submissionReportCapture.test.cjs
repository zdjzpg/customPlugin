const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/components/shared/SubmissionReportCapture.vue'), 'utf8');

test('submission report capture uses plain Chinese labels without broken prefix characters', () => {
  assert.doesNotMatch(source, /\?\?\s*总分/, 'expected chip label to avoid broken prefix characters');
  assert.doesNotMatch(source, /\?\?\s*完成率/, 'expected chip label to avoid broken prefix characters');
  assert.doesNotMatch(source, /\?\?\s*抽中/, 'expected chip label to avoid broken prefix characters');
});

test('submission report capture forces a stable CJK font stack for image export', () => {
  assert.match(source, /<style scoped>/, 'expected dedicated export styles');
  assert.match(source, /font-family:\s*"Microsoft YaHei",\s*"PingFang SC",\s*"Noto Sans SC",\s*sans-serif;/, 'expected stable Chinese font stack');
});
