const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { createConversionService } = require('../server/services/conversionService.cjs');

const PYTHON_BIN =
  'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';

test('conversion catalog exposes the first implemented image tool batch under image_tools', () => {
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: os.tmpdir(),
    pythonBin: PYTHON_BIN
  });

  const catalog = conversionService.getCatalog();
  const expectedKeys = [
    'image_compress_batch',
    'image_resize_exact',
    'image_resize_scale',
    'image_crop_free',
    'image_crop_ratio',
    'image_crop_ratio_batch',
    'image_split_grid',
    'image_nine_grid',
    'image_concat_long',
    'image_collage',
    'image_fill_background',
    'image_dark_mode_background',
    'image_watermark_tile',
    'image_grayscale',
    'image_invert',
    'image_printmaking',
    'image_emboss',
    'image_remove_solid_bg',
    'image_smart_bg_remove',
    'favicon_generate',
    'app_icon_generate',
    'chrome_icon_generate',
    'image_add_padding',
    'image_pixelate',
    'image_increase_size',
    'image_clear_content',
    'image_heic_convert',
    'image_format_convert',
    'excel_extract_images',
    'ppt_extract_images',
    'image_modify_dpi',
    'gif_split',
    'gif_merge',
    'png_alpha_invert',
    'image_round_corner',
    'image_tile_fill',
    'id_photo_resize',
    'exam_id_photo_process',
    'id_photo_crop',
    'id_photo_bg_swap',
    'anti_ocr_image',
    'payment_code_merge',
    'qr_generate',
    'qr_generate_batch',
    'qr_decode'
  ];

  const imageTools = catalog.filter((item) => item.categoryKey === 'image_tools');
  assert.deepEqual(
    imageTools.map((item) => item.key),
    expectedKeys
  );
});

test('image_nine_grid exports nine image tiles in one zip', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const inputImagePath = path.join(tempRoot, 'cover.png');
  writePngFixture(inputImagePath, 90, 90, '#44aa66');

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'image_nine_grid',
      conversionOptions: {
        outputFormat: 'png'
      },
      files: [
        {
          fileName: 'cover.png',
          tempPath: inputImagePath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'cover-nine-grid.zip');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'cover-nine-grid.zip');
    assert.deepEqual(readZipImageEntries(outputPath), [
      'cover-r1-c1.png',
      'cover-r1-c2.png',
      'cover-r1-c3.png',
      'cover-r2-c1.png',
      'cover-r2-c2.png',
      'cover-r2-c3.png',
      'cover-r3-c1.png',
      'cover-r3-c2.png',
      'cover-r3-c3.png'
    ]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('image_smart_bg_remove outputs a transparent png with edge background removed', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const inputImagePath = path.join(tempRoot, 'portrait.png');
  writeSmartBgFixture(inputImagePath);

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'image_smart_bg_remove',
      conversionOptions: {
        tolerance: 40
      },
      files: [
        {
          fileName: 'portrait.png',
          tempPath: inputImagePath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'portrait-smart-cutout.png');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'portrait-smart-cutout.png');
    assert.deepEqual(readAlphaSamples(outputPath), {
      cornerAlpha: 0,
      centerAlpha: 255
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('image_resize_exact writes a resized png with the requested width and height', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const inputImagePath = path.join(tempRoot, 'poster.png');
  writePngFixture(inputImagePath, 20, 10, '#3366cc');

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'image_resize_exact',
      conversionOptions: {
        targetWidth: 320,
        targetHeight: 180,
        outputFormat: 'png'
      },
      files: [
        {
          fileName: 'poster.png',
          tempPath: inputImagePath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'poster-resized.png');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'poster-resized.png');
    assert.deepEqual(readImageMeta(outputPath), {
      format: 'PNG',
      width: 320,
      height: 180
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('image_format_convert converts a png into jpg output', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const inputImagePath = path.join(tempRoot, 'avatar.png');
  writePngFixture(inputImagePath, 40, 40, '#dd5533');

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'image_format_convert',
      conversionOptions: {
        outputFormat: 'jpg'
      },
      files: [
        {
          fileName: 'avatar.png',
          tempPath: inputImagePath
        }
      ]
    });

    assert.equal(result.files[0].fileName, 'avatar-converted.jpg');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'avatar-converted.jpg');
    assert.deepEqual(readImageMeta(outputPath), {
      format: 'JPEG',
      width: 40,
      height: 40
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('payment_code_merge combines two payment-code images into one png output', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const firstPath = path.join(tempRoot, 'wechat.png');
  const secondPath = path.join(tempRoot, 'alipay.png');
  writePngFixture(firstPath, 180, 180, '#22c55e');
  writePngFixture(secondPath, 180, 180, '#2563eb');

  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'payment_code_merge',
      conversionOptions: {
        layout: 'vertical',
        mainTitle: '收款码'
      },
      files: [
        { fileName: 'wechat.png', tempPath: firstPath },
        { fileName: 'alipay.png', tempPath: secondPath }
      ]
    });

    assert.equal(result.files[0].fileName, 'merged-payment-codes.png');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'merged-payment-codes.png');
    const meta = readImageMeta(outputPath);
    assert.equal(meta.format, 'PNG');
    assert.ok(meta.width >= 180);
    assert.ok(meta.height > 360);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('qr_generate creates one qr png from text input without uploaded files', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'qr_generate',
      conversionOptions: {
        qrText: 'https://example.com/pay?id=88',
        sizePx: 320
      },
      files: []
    });

    assert.equal(result.files[0].fileName, 'qr-code.png');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'qr-code.png');
    assert.deepEqual(readImageMeta(outputPath), {
      format: 'PNG',
      width: 320,
      height: 320
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('qr_generate_batch creates one zip with one qr image per input line', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'qr_generate_batch',
      conversionOptions: {
        qrLinesText: 'alpha\nbeta',
        sizePx: 256
      },
      files: []
    });

    assert.equal(result.files[0].fileName, 'qr-codes.zip');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'qr-codes.zip');
    assert.deepEqual(readZipImageEntries(outputPath), ['qr-001.png', 'qr-002.png']);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('qr_decode extracts text from an uploaded qr image into txt output', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-converter-web-image-'));
  const inputPath = path.join(tempRoot, 'code.png');
  writeQrFixture(inputPath, 'hello-qr');
  const conversionService = createConversionService({
    conversionRepository: createNoopConversionRepository(),
    storageRoot: tempRoot,
    pythonBin: PYTHON_BIN
  });

  try {
    const result = await conversionService.runConversion({
      session: { codeId: 9, codeValue: 'DEMO-DAYS-7' },
      conversionKey: 'qr_decode',
      conversionOptions: {},
      files: [
        { fileName: 'code.png', tempPath: inputPath }
      ]
    });

    assert.equal(result.files[0].fileName, 'code-qr.txt');
    const outputPath = path.join(tempRoot, 'conversions', '999', 'outputs', 'code-qr.txt');
    assert.equal(fs.readFileSync(outputPath, 'utf8').trim(), 'hello-qr');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function createNoopConversionRepository() {
  return {
    create() {
      return { id: 999 };
    },
    markCompleted() {},
    markFailed() {}
  };
}

function writePngFixture(outputPath, width, height, colorHex) {
  const script = `
from PIL import Image
image = Image.new('RGBA', (${width}, ${height}), '${colorHex}')
image.save(r"${outputPath.replace(/\\/g, '\\\\')}", format='PNG')
`;
  execFileSync(PYTHON_BIN, ['-c', script], { stdio: 'ignore' });
}

function readImageMeta(imagePath) {
  const script = `
from PIL import Image
image = Image.open(r"${imagePath.replace(/\\/g, '\\\\')}")
print(image.format)
print(f"{image.size[0]}x{image.size[1]}")
`;
  const output = execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [format, sizeText] = output;
  const [width, height] = String(sizeText || '0x0').split('x').map((value) => Number.parseInt(value, 10));
  return {
    format,
    width,
    height
  };
}

function readZipImageEntries(zipPath) {
  const script = `
from zipfile import ZipFile
with ZipFile(r"${zipPath.replace(/\\/g, '\\\\')}") as archive:
    for name in sorted(archive.namelist()):
        print(name)
`;

  return execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readAlphaSamples(imagePath) {
  const script = `
from PIL import Image
image = Image.open(r"${imagePath.replace(/\\/g, '\\\\')}").convert('RGBA')
corner = image.getpixel((2, 2))[3]
center = image.getpixel((image.size[0] // 2, image.size[1] // 2))[3]
print(corner)
print(center)
`;

  const [cornerAlpha, centerAlpha] = execFileSync(PYTHON_BIN, ['-c', script], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => Number.parseInt(value, 10));

  return {
    cornerAlpha,
    centerAlpha
  };
}

function writeSmartBgFixture(outputPath) {
  const script = `
from PIL import Image, ImageDraw
image = Image.new('RGBA', (120, 120), '#ffffff')
draw = ImageDraw.Draw(image)
draw.ellipse((20, 16, 100, 108), fill='#2f6de1')
image.save(r"${outputPath.replace(/\\/g, '\\\\')}", format='PNG')
`;
  execFileSync(PYTHON_BIN, ['-c', script], { stdio: 'ignore' });
}

function writeQrFixture(outputPath, text) {
  const script = `
import qrcode
img = qrcode.make(${JSON.stringify(text)})
img.save(r"${outputPath.replace(/\\/g, '\\\\')}")
`;
  execFileSync(PYTHON_BIN, ['-c', script], { stdio: 'ignore' });
}
