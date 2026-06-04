const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createMobileOverviewMarkup renders single-column mobile tool cards without upload controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'mobileBuyerMarkup.mjs')
  ).href;
  const { createMobileOverviewMarkup } = await import(moduleUrl);

  const html = createMobileOverviewMarkup([
    {
      key: 'compress_pdf',
      label: 'PDF 压缩',
      helperText: '可选标准压缩或强力压缩，并显示压缩前后体积对比。'
    }
  ]);

  assert.match(html, /移动端工具箱/);
  assert.match(html, /PDF 压缩/);
  assert.match(html, /data-open-detail="compress_pdf"/);
  assert.match(html, /class="tool-item style3"/);
  assert.match(html, /tool-item__badge">压缩</);
  assert.match(html, /fa fa-compress/);
  assert.match(html, /role="button"/);
  assert.match(html, /tabindex="0"/);
  assert.doesNotMatch(html, /type="file"/);
  assert.doesNotMatch(html, /进入功能/);
});

test('createMobileCategoryOverviewMarkup renders a single-column PPT tool category card', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'mobileBuyerMarkup.mjs')
  ).href;
  const { createMobileCategoryOverviewMarkup } = await import(moduleUrl);

  const html = createMobileCategoryOverviewMarkup([
    {
      key: 'ppt_tools',
      label: 'PPT 工具',
      description: '进入后查看当前全部已实现工具。'
    }
  ]);

  assert.match(html, /PPT 工具/);
  assert.match(html, /data-open-category="ppt_tools"/);
  assert.match(html, /进入分类/);
});

test('createMobileDetailScaffold renders app-like detail chrome with back button', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'mobileBuyerMarkup.mjs')
  ).href;
  const { createMobileDetailScaffold } = await import(moduleUrl);

  const html = createMobileDetailScaffold({
    label: 'PDF 加水印'
  });

  assert.match(html, /返回工具列表/);
  assert.match(html, /PDF 加水印/);
  assert.match(html, /data-mobile-detail-content/);
});
