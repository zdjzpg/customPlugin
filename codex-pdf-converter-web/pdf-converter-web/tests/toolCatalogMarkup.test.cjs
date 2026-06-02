const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createToolOverviewMarkup renders compact method cards without upload controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolOverviewMarkup } = await import(moduleUrl);

  const html = createToolOverviewMarkup([
    {
      key: 'pdf_extract_pages',
      label: 'PDF 提取页面',
      helperText: '输入页码范围后提取为一个新的 PDF。'
    }
  ]);

  assert.match(html, /PDF 提取页面/);
  assert.match(html, /输入页码范围后提取为一个新的 PDF。/);
  assert.match(html, /查看详情/);
  assert.doesNotMatch(html, /type="file"/);
  assert.doesNotMatch(html, /开始转换/);
});

test('createToolDetailMarkup renders the selected method form with upload controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'pdf_extract_pages',
    label: 'PDF 提取页面',
    helperText: '输入页码范围后提取为一个新的 PDF，例如 1,3,5-8。',
    accepts: '.pdf',
    maxFileSizeMb: 20
  });

  assert.match(html, /返回列表/);
  assert.match(html, /type="file"/);
  assert.match(html, /开始转换/);
  assert.match(html, /提取页码/);
});

test('createToolDetailMarkup renders merge_pdf as a multi-file PDF upload form', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'merge_pdf',
    label: 'PDF 合并',
    helperText: '可一次上传多个 PDF，按当前顺序合并为一个 PDF。',
    accepts: '.pdf',
    maxFileSizeMb: 20,
    maxTotalFileSizeMb: 60
  });

  assert.match(html, /PDF 合并/);
  assert.match(html, /multiple/);
  assert.match(html, /开始转换/);
});

test('createToolDetailMarkup renders compress_pdf with compression-level choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'compress_pdf',
    label: 'PDF 压缩',
    helperText: '可选标准压缩或强力压缩，并显示压缩前后体积对比。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /标准压缩/);
  assert.match(html, /强力压缩/);
  assert.match(html, /压缩强度/);
});

test('createToolDetailMarkup renders pdf_to_word with OCR mode choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'pdf_to_word',
    label: 'PDF 转 Word',
    helperText: '支持文本型 PDF 直接转 Word，也支持 OCR 识别扫描件后导出 Word。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /转换方式/);
  assert.match(html, /文本型 PDF/);
  assert.match(html, /扫描件 OCR/);
  assert.match(html, /识别语言/);
  assert.match(html, /中文 \+ 英文/);
});
