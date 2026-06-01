const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildReportImageOptions } = require('../src/shared/reportImageExport');

const paperViewSource = fs.readFileSync(path.join(__dirname, '../src/views/PaperView.vue'), 'utf8');
const reportViewSource = fs.readFileSync(path.join(__dirname, '../src/views/ReportView.vue'), 'utf8');

test('buildReportImageOptions uses a non-transparent background for exported report images', () => {
  assert.deepEqual(buildReportImageOptions(), {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#e8fbff'
  });
});

test('paper report export captures the outer app shell instead of only the inner report body', () => {
  assert.match(
    paperViewSource,
    /<div[^>]*ref="reportCaptureRef"[^>]*:class="\['app-shell'/,
    'expected PaperView outer app shell to be the export capture root'
  );
});

test('standalone report export also captures the outer app shell', () => {
  assert.match(
    reportViewSource,
    /<div[^>]*ref="reportCaptureRef"[^>]*class="app-shell"[^>]*v-if="state\.report"/,
    'expected ReportView outer app shell to be the export capture root'
  );
});
