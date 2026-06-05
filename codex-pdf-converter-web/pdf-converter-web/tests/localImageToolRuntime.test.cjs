const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function getRuntimeModuleUrl() {
  return pathToFileURL(
    path.join(__dirname, '..', 'public', 'localImageToolRuntime.mjs')
  ).href;
}

test('buildImageTextLayout creates top-banner blocks for title subtitle and badge', async () => {
  const { buildImageTextLayout } = await import(getRuntimeModuleUrl());

  const layout = buildImageTextLayout({
    canvasWidth: 1200,
    canvasHeight: 900,
    layoutPreset: 'top_banner',
    titleText: '主标题',
    subtitleText: '副标题说明',
    badgeText: '角标',
    titleSize: 88,
    subtitleSize: 40,
    badgeSize: 28
  });

  assert.equal(layout.blocks.length, 3);
  assert.deepEqual(layout.blocks.map((item) => item.role), ['title', 'subtitle', 'badge']);
  assert.equal(layout.blocks[0].align, 'center');
  assert.equal(layout.blocks[0].y, 126);
  assert.equal(layout.blocks[1].y, 230);
  assert.equal(layout.blocks[2].align, 'right');
  assert.ok(layout.blocks[2].x > layout.blocks[0].x);
});

test('buildImageTextLayout creates bottom-caption layout when badge is empty', async () => {
  const { buildImageTextLayout } = await import(getRuntimeModuleUrl());

  const layout = buildImageTextLayout({
    canvasWidth: 1000,
    canvasHeight: 1000,
    layoutPreset: 'bottom_caption',
    titleText: '教程封面',
    subtitleText: '第二行说明',
    badgeText: '',
    titleSize: 72,
    subtitleSize: 32,
    badgeSize: 24
  });

  assert.equal(layout.blocks.length, 2);
  assert.ok(layout.blocks[0].y > 640);
  assert.ok(layout.blocks[1].y > layout.blocks[0].y);
  assert.equal(layout.overlayBand.verticalAlign, 'bottom');
});

test('buildBorderFrameLayout expands canvas size with padding border and radius metadata', async () => {
  const { buildBorderFrameLayout } = await import(getRuntimeModuleUrl());

  const layout = buildBorderFrameLayout({
    imageWidth: 1200,
    imageHeight: 800,
    padding: 60,
    borderWidth: 18,
    cornerRadius: 36
  });

  assert.deepEqual(layout.canvasSize, {
    width: 1356,
    height: 956
  });
  assert.deepEqual(layout.imageRect, {
    x: 78,
    y: 78,
    width: 1200,
    height: 800
  });
  assert.equal(layout.outerRadius, 36);
  assert.equal(layout.innerRadius, 18);
});

test('buildPlatformTemplateLayout resolves preset canvas and contain placement', async () => {
  const { buildPlatformTemplateLayout } = await import(getRuntimeModuleUrl());

  const layout = buildPlatformTemplateLayout({
    imageWidth: 1200,
    imageHeight: 800,
    presetKey: 'xiaohongshu_cover',
    fitMode: 'contain'
  });

  assert.deepEqual(layout.canvasSize, {
    width: 1242,
    height: 1660
  });
  assert.equal(layout.placement.width, 1242);
  assert.equal(layout.placement.height, 828);
  assert.equal(layout.placement.x, 0);
  assert.equal(layout.placement.y, 416);
});

test('buildPlatformTemplateBatchPlan expands selected preset keys into ordered export entries', async () => {
  const { buildPlatformTemplateBatchPlan } = await import(getRuntimeModuleUrl());

  const entries = buildPlatformTemplateBatchPlan({
    sourceFileName: 'product.png',
    selectedPresetKeys: ['xianyu_main', 'ppt_cover', 'missing_key'],
    outputFormat: 'png'
  });

  assert.deepEqual(entries, [
    {
      presetKey: 'xianyu_main',
      fileName: 'product-xianyu_main.png',
      label: '闲鱼主图'
    },
    {
      presetKey: 'ppt_cover',
      fileName: 'product-ppt_cover.png',
      label: 'PPT 封面'
    }
  ]);
});

test('createAnnotationFromCanvasPoint creates a numbered marker with the requested style payload', async () => {
  const { createAnnotationFromCanvasPoint } = await import(getRuntimeModuleUrl());

  const annotation = createAnnotationFromCanvasPoint({
    mode: 'number',
    pointX: 320,
    pointY: 240,
    color: '#ff3355',
    lineWidth: 6,
    labelText: '3',
    shapeSize: 96,
    arrowDirection: 'right_up',
    mosaicBlockSize: 14
  });

  assert.deepEqual(annotation, {
    kind: 'number',
    x: 320,
    y: 240,
    color: '#ff3355',
    lineWidth: 6,
    labelText: '3',
    shapeSize: 96,
    arrowDirection: 'right_up',
    mosaicBlockSize: 14
  });
});

test('buildBasicImageMetadataSummary formats file and dimension info for preview', async () => {
  const { buildBasicImageMetadataSummary } = await import(getRuntimeModuleUrl());

  const summary = buildBasicImageMetadataSummary({
    fileName: 'sample.jpg',
    mimeType: 'image/jpeg',
    fileSize: 153600,
    imageWidth: 1200,
    imageHeight: 800,
    lastModified: '2026-06-05T08:30:00.000Z'
  });

  assert.match(summary, /文件名：sample\.jpg/);
  assert.match(summary, /格式：image\/jpeg/);
  assert.match(summary, /尺寸：1200 x 800/);
  assert.match(summary, /体积：150\.0 KB/);
});

test('buildRotateAdjustLayout swaps output size when rotating by 90 degrees', async () => {
  const { buildRotateAdjustLayout } = await import(getRuntimeModuleUrl());

  const layout = buildRotateAdjustLayout({
    imageWidth: 1200,
    imageHeight: 800,
    angle: 90
  });

  assert.deepEqual(layout.canvasSize, {
    width: 800,
    height: 1200
  });
  assert.equal(layout.rotationRadians > 1.5, true);
});

test('createErasePatchFromCanvasPoint creates a lightweight erase patch payload', async () => {
  const { createErasePatchFromCanvasPoint } = await import(getRuntimeModuleUrl());

  const patch = createErasePatchFromCanvasPoint({
    pointX: 520,
    pointY: 300,
    brushSize: 64,
    sampleOffset: 20
  });

  assert.deepEqual(patch, {
    x: 520,
    y: 300,
    brushSize: 64,
    sampleOffset: 20
  });
});
