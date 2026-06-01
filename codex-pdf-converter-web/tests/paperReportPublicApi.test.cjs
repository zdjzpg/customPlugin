const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('schema ensures report tokens exist for public static report links', () => {
  const source = read('server/schema.js');

  assert.match(source, /columnExists\(connection, databaseName, 'submissions', 'report_token'\)/);
  assert.match(source, /ALTER TABLE submissions ADD COLUMN report_token VARCHAR\(64\) NULL/);
  assert.match(source, /uk_submissions_report_token/);
});

test('paper repository persists and returns report tokens for submission reports', () => {
  const source = read('server/paperRepository.js');

  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.match(source, /report_token/);
  assert.match(source, /reportToken:/);
  assert.match(source, /async function getSubmissionReportByToken\(shareCode, reportToken\)/);
});

test('server exposes a public report endpoint by share code and report token', () => {
  const source = read('server/index.js');

  assert.match(source, /app\.get\('\/api\/public\/papers\/code\/:shareCode\/reports\/:reportToken'/);
});
