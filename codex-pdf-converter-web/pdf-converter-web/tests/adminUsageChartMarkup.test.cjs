const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createAdminUsageChartMarkup renders top-series legend and daily values', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageChartMarkup.mjs')
  ).href;
  const { createAdminUsageChartMarkup } = await import(moduleUrl);

  const html = createAdminUsageChartMarkup({
    days: ['2026-06-01', '2026-06-02'],
    series: [
      {
        conversionKey: 'pdf_to_word',
        label: 'PDF 转 Word',
        totalCount: 8,
        countsByDay: [5, 3]
      },
      {
        conversionKey: 'merge_pdf',
        label: 'PDF 合并',
        totalCount: 4,
        countsByDay: [1, 3]
      }
    ]
  });

  assert.match(html, /data-admin-usage-chart/);
  assert.match(html, /PDF 转 Word/);
  assert.match(html, /PDF 合并/);
  assert.match(html, /2026-06-01/);
  assert.match(html, /总点击 8/);
  assert.match(html, /svg/);
});
