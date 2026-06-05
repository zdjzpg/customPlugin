const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createAdminPaginationMarkup renders current page and next-page button state', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminPaginationMarkup.mjs')
  ).href;
  const { createAdminPaginationMarkup } = await import(moduleUrl);

  const html = createAdminPaginationMarkup({
    sectionKey: 'codes',
    currentPage: 2,
    totalPages: 5,
    totalItems: 83
  });

  assert.match(html, /data-admin-pagination="codes"/);
  assert.match(html, /共 83 条/);
  assert.match(html, /第 2 \/ 5 页/);
  assert.match(html, /data-admin-page-action="prev"/);
  assert.match(html, /data-admin-page-action="next"/);
  assert.match(html, /data-admin-page-number="3"/);
  assert.doesNotMatch(html, /disabled[^>]*>下一页<\/button>/);
});

test('createAdminPaginationMarkup disables both actions when only one page exists', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'adminPaginationMarkup.mjs')
  ).href;
  const { createAdminPaginationMarkup } = await import(moduleUrl);

  const html = createAdminPaginationMarkup({
    sectionKey: 'stats',
    currentPage: 1,
    totalPages: 1,
    totalItems: 6
  });

  assert.match(html, /第 1 \/ 1 页/);
  assert.match(html, /data-admin-page-action="prev"[^>]*disabled/);
  assert.match(html, /data-admin-page-action="next"[^>]*disabled/);
});
