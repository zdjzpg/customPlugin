const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('parseBuyerRouteState reads detail view state from the hash fragment', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerRouteState.mjs')
  ).href;
  const { parseBuyerRouteState } = await import(moduleUrl);

  const state = parseBuyerRouteState('#view=detail&category=ppt_tools&tool=word_to_pdf&search=pdf');

  assert.deepEqual(state, {
    view: 'detail',
    categoryKey: 'ppt_tools',
    conversionKey: 'word_to_pdf',
    searchKeyword: 'pdf',
    topicKey: null
  });
});

test('stringifyBuyerRouteState writes a stable hash for the buyer detail view', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerRouteState.mjs')
  ).href;
  const { stringifyBuyerRouteState } = await import(moduleUrl);

  const hash = stringifyBuyerRouteState({
    view: 'detail',
    categoryKey: 'ppt_tools',
    conversionKey: 'word_to_pdf',
    searchKeyword: 'pdf'
  });

  assert.equal(hash, '#view=detail&category=ppt_tools&tool=word_to_pdf&search=pdf');
});

test('parseBuyerRouteState reads a text-tool detail route from the hash fragment', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerRouteState.mjs')
  ).href;
  const { parseBuyerRouteState } = await import(moduleUrl);

  const state = parseBuyerRouteState('#view=detail&category=text_tools&tool=text_unique&search=去重');

  assert.deepEqual(state, {
    view: 'detail',
    categoryKey: 'text_tools',
    conversionKey: 'text_unique',
    searchKeyword: '去重',
    topicKey: null
  });
});

test('parseBuyerRouteState keeps global search keywords when the hash points to tool_list', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerRouteState.mjs')
  ).href;
  const { parseBuyerRouteState } = await import(moduleUrl);

  const state = parseBuyerRouteState('#view=tool_list&category=ppt_tools&search=文本');

  assert.deepEqual(state, {
    view: 'tool_list',
    categoryKey: 'ppt_tools',
    conversionKey: null,
    searchKeyword: '文本',
    topicKey: null
  });
});

test('parseBuyerRouteState reads a featured topic list route from the hash fragment', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerRouteState.mjs')
  ).href;
  const { parseBuyerRouteState } = await import(moduleUrl);

  const state = parseBuyerRouteState('#view=tool_list&category=text_tools&topic=teaching_materials&search=表格');

  assert.deepEqual(state, {
    view: 'tool_list',
    categoryKey: 'text_tools',
    conversionKey: null,
    searchKeyword: '表格',
    topicKey: 'teaching_materials'
  });
});

test('stringifyBuyerRouteState writes topic state for featured topic routes', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'buyerRouteState.mjs')
  ).href;
  const { stringifyBuyerRouteState } = await import(moduleUrl);

  const hash = stringifyBuyerRouteState({
    view: 'tool_list',
    categoryKey: 'text_tools',
    searchKeyword: '表格',
    topicKey: 'teaching_materials'
  });

  assert.equal(hash, '#view=tool_list&category=text_tools&topic=teaching_materials&search=%E8%A1%A8%E6%A0%BC');
});
