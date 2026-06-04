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

test('createUsageStatsTableMarkup renders the PDF-to-PPT feature label', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const html = createUsageStatsTableMarkup([
    {
      day: '2026-06-03',
      conversionKey: 'pdf_to_pptx',
      count: 2
    }
  ]);

  assert.match(html, /2026-06-03/);
  assert.match(html, /PDF 转 PPT/);
  assert.match(html, /2/);
});

test('createUsageStatsTableMarkup renders the dev-tool sitemap label', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const html = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_sitemap_extract',
      count: 3
    }
  ]);

  assert.match(html, /2026-06-04/);
  assert.match(html, /sitemap 链接提取/);
  assert.match(html, /3/);
});

test('createUsageStatsTableMarkup renders the ssl expiry dev-tool label', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const html = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_ssl_expiry_check',
      count: 1
    }
  ]);

  assert.match(html, /2026-06-04/);
  assert.match(html, /SSL 证书过期查询/);
  assert.match(html, /1/);
});

test('createUsageStatsTableMarkup renders the ssl cert parse dev-tool label', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const html = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_ssl_cert_parse',
      count: 2
    }
  ]);

  assert.match(html, /2026-06-04/);
  assert.match(html, /SSL 证书解析/);
  assert.match(html, /2/);
});

test('createUsageStatsTableMarkup renders the gzip and redirect dev-tool labels', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const gzipHtml = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_gzip_check',
      count: 1
    }
  ]);
  const redirectHtml = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_redirect_analysis',
      count: 4
    }
  ]);

  assert.match(gzipHtml, /网页 gzip 压缩检测/);
  assert.match(redirectHtml, /URL 重定向分析/);
});

test('createUsageStatsTableMarkup renders the whois and cdn dev-tool labels', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const whoisHtml = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_whois_lookup',
      count: 2
    }
  ]);
  const cdnHtml = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_cdn_check',
      count: 3
    }
  ]);

  assert.match(whoisHtml, /域名 whois 查询/);
  assert.match(cdnHtml, /网站 CDN 检测/);
});

test('createUsageStatsTableMarkup renders meta and spider dev-tool labels', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminUsageStatsMarkup.mjs')
  ).href;
  const { createUsageStatsTableMarkup } = await import(moduleUrl);

  const metaHtml = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_meta_info_check',
      count: 2
    }
  ]);
  const spiderHtml = createUsageStatsTableMarkup([
    {
      day: '2026-06-04',
      conversionKey: 'dev_spider_preview',
      count: 1
    }
  ]);

  assert.match(metaHtml, /网页 meta 信息检测/);
  assert.match(spiderHtml, /网页蜘蛛模拟抓取/);
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
