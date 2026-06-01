const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('paper report and submission export use the shared kindergarten craft report component', () => {
  const paperViewSource = read('src/views/PaperView.vue');
  const submissionCaptureSource = read('src/components/shared/SubmissionReportCapture.vue');
  const sharedReportSource = read('src/components/shared/StudentCraftReport.vue');

  assert.match(paperViewSource, /StudentCraftReport/);
  assert.match(submissionCaptureSource, /StudentCraftReport/);
  assert.match(sharedReportSource, /title:\s*'\\u4eca\\u65e5\\u82f1\\u8bed\\u6210\\u957f\\u8bb0\\u5f55'/);
  assert.match(sharedReportSource, /profileTag:\s*'\\u6210\\u957f\\u6863\\u6848'/);
  assert.match(sharedReportSource, /sticker:\s*'\\ud83c\\udf1f \\u624b\\u5de5\\u8d34\\u7eb8\\u680f'/);
  assert.match(sharedReportSource, /noteTitle:\s*'\\u8001\\u5e08\\u60f3\\u5bf9\\u4f60\\u8bf4'/);
  assert.match(sharedReportSource, /progressTitle:\s*'\\u542c\\u8bf4\\u8bfb\\u8868\\u73b0'/);
});

test('report styles define kindergarten craft layout tokens', () => {
  const stylesSource = read('src/styles.css');
  const radarSource = read('src/components/shared/AbilityRadarChart.vue');
  const sharedReportSource = read('src/components/shared/StudentCraftReport.vue');

  assert.match(stylesSource, /\.report-craft-shell\s*\{/);
  assert.match(stylesSource, /\.craft-kpi\.craft-kpi-score\s*\{/);
  assert.match(stylesSource, /\.craft-note-strip\s*\{/);
  assert.match(stylesSource, /\.craft-progress-fill\s*\{/);
  assert.match(radarSource, /report-radar-card/);
  assert.match(sharedReportSource, /noteTag:\s*'\\u6210\\u957f\\u4fbf\\u7b7e'/);
  assert.doesNotMatch(sharedReportSource, /summaryTitle:/);
});
