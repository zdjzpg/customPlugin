const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createBuyerShellMarkup renders UU-style top bar, side navigation, and search shell', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerShellMarkup.mjs')
  ).href;
  const { createBuyerShellMarkup } = await import(moduleUrl);

  const html = createBuyerShellMarkup({
    title: 'PPT 工具',
    searchKeyword: '',
    mobileNavOpen: false,
    quickKeywords: ['PDF', 'OCR', '换行'],
    categories: [
      {
        key: 'ppt_tools',
        label: 'PPT 工具'
      },
      {
        key: 'text_tools',
        label: '文本工具'
      },
      {
        key: 'dev_tools',
        label: '编程工具'
      }
    ],
    activeCategoryKey: 'ppt_tools',
    contentMarkup: '<div>工具内容</div>'
  });

  assert.match(html, /data-buyer-topbar/);
  assert.match(html, /data-buyer-motion-root/);
  assert.match(html, /data-animate-topbar/);
  assert.match(html, /data-desktop-side-nav/);
  assert.match(html, /data-animate-search-panel/);
  assert.match(html, /data-animate-current-title/);
  assert.match(html, /data-tool-search-input/);
  assert.doesNotMatch(html, /buyer-side-nav-title/);
  assert.match(html, /PPT 工具/);
  assert.match(html, /文本工具/);
  assert.match(html, /编程工具/);
  assert.match(html, /工具内容/);
  assert.match(html, /PDF/);
  assert.match(html, /data-mobile-nav-toggle/);
  assert.match(html, /data-category-icon="ppt_tools"/);
  assert.match(html, /data-category-icon="text_tools"/);
  assert.match(html, /data-category-icon="dev_tools"/);
  assert.match(html, /<svg/);
  assert.match(html, /轻舟文件工具站/);
  assert.doesNotMatch(html, />PP 工具站</);
  assert.doesNotMatch(html, />首页</);
  assert.doesNotMatch(html, />最近</);
  assert.doesNotMatch(html, />收藏</);
});

test('createBuyerShellMarkup can render the mobile navigation panel in open state', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerShellMarkup.mjs')
  ).href;
  const { createBuyerShellMarkup } = await import(moduleUrl);

  const html = createBuyerShellMarkup({
    title: 'PPT 工具',
    searchKeyword: 'pdf',
    mobileNavOpen: true,
    quickKeywords: ['PDF'],
    categories: [
      {
        key: 'ppt_tools',
        label: 'PPT 工具'
      },
      {
        key: 'text_tools',
        label: '文本工具'
      },
      {
        key: 'dev_tools',
        label: '编程工具'
      }
    ],
    activeCategoryKey: 'ppt_tools',
    contentMarkup: '<div>工具内容</div>'
  });

  assert.match(html, /data-mobile-category-list/);
  assert.match(html, /进入工具分类/);
  assert.match(html, /value="pdf"/);
  assert.match(html, /data-category-icon="ppt_tools"/);
  assert.match(html, /data-category-icon="text_tools"/);
  assert.match(html, /data-category-icon="dev_tools"/);
});

test('createBuyerShellMarkup can render homepage category cards for PPT and text tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerShellMarkup.mjs')
  ).href;
  const { createBuyerShellMarkup } = await import(moduleUrl);

  const html = createBuyerShellMarkup({
    title: '首页',
    searchKeyword: '',
    mobileNavOpen: false,
    quickKeywords: ['PDF', '文本'],
    categories: [
      {
        key: 'ppt_tools',
        label: 'PPT 工具'
      },
      {
        key: 'text_tools',
        label: '文本工具'
      },
      {
        key: 'dev_tools',
        label: '编程工具'
      }
    ],
    activeCategoryKey: 'ppt_tools',
    contentMarkup: `
      <section data-home-category-cards>
        <button data-open-category="ppt_tools">PPT 工具</button>
        <button data-open-category="text_tools">文本工具</button>
        <button data-open-category="dev_tools">编程工具</button>
      </section>
    `
  });

  assert.match(html, /data-home-category-cards/);
  assert.match(html, /PPT 工具/);
  assert.match(html, /文本工具/);
  assert.match(html, /编程工具/);
});

test('tool list markup should not require duplicated home category cards when side navigation already exists', async () => {
  const appJs = path.join(__dirname, '..', 'public', 'app.js');
  const source = require('node:fs').readFileSync(appJs, 'utf8');

  const buildToolListMarkupSource = source.slice(
    source.indexOf('function buildToolListMarkup()'),
    source.indexOf('function buildDetailMarkup(')
  );

  assert.doesNotMatch(buildToolListMarkupSource, /data-home-category-cards/);
  assert.match(buildToolListMarkupSource, /data-animate-tool-list/);
});
