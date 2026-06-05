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
    'favicon_generate',
    'app_icon_generate',
    'chrome_icon_generate',
    'image_add_padding',
    'image_pixelate',
    'image_increase_size',
    'image_clear_content',
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
    'anti_ocr_image'
  ];

  const imageTools = catalog.filter((item) => item.categoryKey === 'image_tools');
  assert.deepEqual(
    imageTools.map((item) => item.key),
    expectedKeys
  );
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
