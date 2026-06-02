const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createUsageStatsTableMarkup renders per-day feature counts', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const html = createUsageStatsTableMarkup([
    {
      day: '2026-06-01',
      conversionKey: 'pdf_to_word',
      count: 5
    }
  ]);

  assert.match(html, /2026-06-01/);
  assert.match(html, /PDF 转 Word/);
  assert.match(html, /5/);
});

test('createUsageStatsFilterMarkup renders presets and custom date fields', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsFilterMarkup } = await import(moduleUrl);

  const html = createUsageStatsFilterMarkup({
    preset: 'last7days',
    dateFrom: '',
    dateTo: ''
  });

  assert.match(html, /今天/);
  assert.match(html, /近7天/);
  assert.match(html, /近30天/);
  assert.match(html, /开始日期/);
  assert.match(html, /结束日期/);
});
