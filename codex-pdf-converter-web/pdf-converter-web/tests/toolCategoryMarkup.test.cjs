const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createCategoryOverviewMarkup renders the PPT tool category card', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCategoryMarkup.mjs')
  ).href;
  const { createCategoryOverviewMarkup } = await import(moduleUrl);

  const html = createCategoryOverviewMarkup([
    {
      key: 'ppt_tools',
      label: 'PPT 工具',
      description: '进入后查看当前全部已实现工具。',
      iconLabel: 'PPT'
    }
  ]);

  assert.match(html, /PPT 工具/);
  assert.match(html, /进入后查看当前全部已实现工具。/);
  assert.match(html, /data-open-category="ppt_tools"/);
  assert.match(html, /进入分类/);
  assert.match(html, /data-category-icon="ppt_tools"/);
  assert.match(html, /<svg/);
});

test('createCategoryOverviewMarkup renders the dev-tools category card', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCategoryMarkup.mjs')
  ).href;
  const { createCategoryOverviewMarkup } = await import(moduleUrl);

  const html = createCategoryOverviewMarkup([
    {
      key: 'dev_tools',
      label: '编程工具',
      description: '进入后查看编码转换、链接提取和站点检测工具。',
      iconLabel: 'DEV'
    }
  ]);

  assert.match(html, /编程工具/);
  assert.match(html, /编码转换、链接提取和站点检测工具/);
  assert.match(html, /data-open-category="dev_tools"/);
  assert.match(html, /data-category-icon="dev_tools"/);
});
