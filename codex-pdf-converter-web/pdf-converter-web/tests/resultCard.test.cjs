const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createConversionResultMarkup renders generated-result cards with clear download actions', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'resultCard.mjs')
  ).href;
  const { createConversionResultMarkup } = await import(moduleUrl);

  const html = createConversionResultMarkup(
    [
      {
        fileName: 'sample.pdf',
        downloadUrl: '/api/downloads/conversions/1/sample.pdf'
      }
    ],
    '刚刚生成'
  );

  assert.match(html, /新生成文件/);
  assert.match(html, /sample\.pdf/);
  assert.match(html, /立即下载/);
  assert.match(html, /刚刚生成/);
  assert.match(html, /result-download/);
});

test('createConversionResultMarkup renders size comparison for compression results', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'resultCard.mjs')
  ).href;
  const { createConversionResultMarkup } = await import(moduleUrl);

  const html = createConversionResultMarkup(
    [
      {
        fileName: 'catalog-compressed.pdf',
        downloadUrl: '/api/downloads/conversions/1/catalog-compressed.pdf',
        summary: {
          inputSizeBytes: 5 * 1024 * 1024,
          outputSizeBytes: 2 * 1024 * 1024,
          savedBytes: 3 * 1024 * 1024,
          compressionLevel: 'strong'
        }
      }
    ],
    '刚刚生成'
  );

  assert.match(html, /压缩前/);
  assert.match(html, /压缩后/);
  assert.match(html, /减少了/);
  assert.match(html, /强力压缩/);
});

test('createConversionResultMarkup renders plain-text preview for OCR or transcript results', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'resultCard.mjs')
  ).href;
  const { createConversionResultMarkup } = await import(moduleUrl);

  const html = createConversionResultMarkup(
    [
      {
        fileName: 'meeting-transcript.txt',
        downloadUrl: '/api/downloads/conversions/3/meeting-transcript.txt'
      }
    ],
    '刚刚生成',
    {
      kind: 'text_preview',
      previewText: '第一行会议记录\n第二行待办'
    }
  );

  assert.match(html, /识别预览/);
  assert.match(html, /第一行会议记录/);
  assert.match(html, /第二行待办/);
});

test('createConversionResultMarkup renders audio segment summaries for lecture packaging results', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'resultCard.mjs')
  ).href;
  const { createConversionResultMarkup } = await import(moduleUrl);

  const html = createConversionResultMarkup(
    [
      {
        fileName: 'classroom-lecture-segments.zip',
        downloadUrl: '/api/downloads/conversions/5/classroom-lecture-segments.zip'
      }
    ],
    '刚刚生成',
    {
      kind: 'audio_segments',
      heading: '已整理 2 段课堂重点',
      segmentEntries: [
        {
          index: 1,
          title: '作业讲评',
          timeRangeLabel: '00:12:30 - 00:18:45',
          durationLabel: '06:15'
        },
        {
          index: 2,
          title: '重点题讲解',
          timeRangeLabel: '00:28:00 - 00:35:20',
          durationLabel: '07:20'
        }
      ]
    }
  );

  assert.match(html, /已整理 2 段课堂重点/);
  assert.match(html, /第 1 段/);
  assert.match(html, /作业讲评/);
  assert.match(html, /00:12:30 - 00:18:45/);
  assert.match(html, /时长 06:15/);
});
