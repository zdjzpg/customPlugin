const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const viewSource = fs.readFileSync(path.join(__dirname, '../src/views/AllAnswersView.vue'), 'utf8');
const repositorySource = fs.readFileSync(path.join(__dirname, '../server/paperRepository.js'), 'utf8');

test('answers table is directly controlled by expanded row keys and hides the default expand column', () => {
  assert.match(viewSource, /:expanded-row-keys="expandedRowKeys"/, 'expected direct expanded row keys binding');
  assert.match(viewSource, /:show-expand-column="false"/, 'expected default expand icon column to be hidden');
  assert.match(viewSource, /@expand="handleRowExpand"/, 'expected explicit expand sync handler');
});

test('answers actions include a row-level report image export handler with loading state', () => {
  assert.match(viewSource, /:loading="generatingSubmissionId === record\.id"/, 'expected row-level export loading state');
  assert.match(viewSource, /@click="downloadSubmissionReportImage\(record\)"/, 'expected row-level report image handler');
});

test('answers image export builds the same report snapshot as the student report screen', () => {
  assert.match(viewSource, /import submissionReportSnapshotUtils from '\.\.\/shared\/submissionReportSnapshot'/, 'expected shared snapshot helper import');
  assert.match(viewSource, /const \{ buildSubmissionReportSnapshot \} = submissionReportSnapshotUtils;/, 'expected shared snapshot helper usage');
  assert.match(viewSource, /const snapshot = buildSubmissionReportSnapshot\(/, 'expected export flow to build a full report snapshot');
  assert.match(viewSource, /createApp\(SubmissionReportCapture,\s*\{[\s\S]*\.\.\.snapshot[\s\S]*\}\)/, 'expected export flow to mount the shared snapshot data');
});

test('submission image export waits for fonts and extra animation frames before capture', () => {
  assert.match(viewSource, /await waitForSubmissionCaptureReady\(\);/, 'expected export flow to wait for capture readiness');
  assert.match(viewSource, /if \(document\.fonts\?\.ready\) \{\s*await document\.fonts\.ready;\s*\}/s, 'expected capture readiness to wait for fonts');
  assert.match(viewSource, /for \(let frame = 0; frame < 4; frame \+= 1\)/, 'expected multiple animation frames after mount');
});

test('submission image export uses the same responsive report layout mode as the 1280px capture viewport', () => {
  assert.match(viewSource, /import reportLayoutModeUtils from '\.\.\/shared\/reportLayoutMode'/, 'expected report layout mode helper import');
  assert.match(viewSource, /const \{ resolveReportLayoutMode \} = reportLayoutModeUtils;/, 'expected report layout mode helper usage');
  assert.match(viewSource, /const captureWidth = 1280;/, 'expected fixed capture width constant');
  assert.match(viewSource, /const captureLayoutMode = resolveReportLayoutMode\(captureWidth,\s*typeof window === 'undefined' \? 1080 : window\.innerHeight\);/, 'expected capture layout mode derived from the same helper');
  assert.match(viewSource, /createApp\(SubmissionReportCapture,\s*\{\s*\.\.\.snapshot,\s*layoutMode:\s*captureLayoutMode\s*\}\)/s, 'expected submission export to pass the derived layout mode into the shared capture component');
});

test('submission list query returns stored report json for row-level image generation', () => {
  assert.match(repositorySource, /s\.report_json/, 'expected submission query to read report_json');
  assert.match(repositorySource, /const reportData = parseJsonValue\(row\.report_json,\s*\{\}\);/, 'expected submission list to parse report_json whether mysql returns a string or object');
  assert.match(repositorySource, /abilityItems:\s*Array\.isArray\(reportData\.abilityItems\)/, 'expected parsed report data to keep ability items');
  assert.match(repositorySource, /comments:\s*reportData\.comments\s*\|\|\s*\{\}/, 'expected parsed report data to keep comments');
});
