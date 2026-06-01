const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('paper list client sends page and pageSize to the papers endpoint', () => {
  const source = read('src/api/client.js');

  assert.match(source, /if \(params\.page\) search\.set\('page', String\(params\.page\)\);/);
  assert.match(source, /if \(params\.pageSize\) search\.set\('pageSize', String\(params\.pageSize\)\);/);
});

test('configured papers view binds table pagination and reacts to page changes', () => {
  const source = read('src/views/ConfiguredPapersView.vue');

  assert.match(source, /:pagination="tablePagination"/);
  assert.match(source, /@change="handleTableChange"/);
  assert.match(source, /const tablePagination = computed\(\(\) => \(\{/);
  assert.match(source, /function handleTableChange\(pagination\)/);
});

test('configured papers view builds type summary from paged questionTypes when full questions are absent', () => {
  const source = read('src/views/ConfiguredPapersView.vue');

  assert.match(source, /const rawTypes = Array\.isArray\(paper\.questionTypes\) && paper\.questionTypes\.length/);
  assert.match(source, /\? paper\.questionTypes/);
});

test('exam store tracks paged paper results instead of only replacing the paper array', () => {
  const source = read('src/store/examStore.js');

  assert.match(source, /paperPagination:\s*\{\s*page:\s*1,\s*pageSize:\s*10,\s*total:\s*0\s*\}/s);
  assert.match(source, /state\.paperPagination = \{/);
  assert.match(source, /page:\s*Number\(result\.page \|\| params\.page \|\| state\.paperPagination\.page \|\| 1\)/);
  assert.match(source, /pageSize:\s*Number\(result\.pageSize \|\| params\.pageSize \|\| state\.paperPagination\.pageSize \|\| 10\)/);
});
