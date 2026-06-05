const PLATFORM_TEMPLATE_PRESETS = {
  xianyu_main: { label: '闲鱼主图', width: 1500, height: 1500 },
  xiaohongshu_cover: { label: '小红书封面', width: 1242, height: 1660 },
  pengyouquan_single: { label: '朋友圈单图', width: 1080, height: 1080 },
  wechat_article_cover: { label: '公众号首图', width: 900, height: 383 },
  ppt_cover: { label: 'PPT 封面', width: 1920, height: 1080 }
};

export function getPlatformTemplatePresetMap() {
  return PLATFORM_TEMPLATE_PRESETS;
}

export function buildImageTextLayout(input = {}) {
  const canvasWidth = toPositiveInteger(input.canvasWidth, 1200, 320, 6000);
  const canvasHeight = toPositiveInteger(input.canvasHeight, 900, 320, 6000);
  const layoutPreset = ['top_banner', 'center_focus', 'bottom_caption'].includes(input.layoutPreset)
    ? input.layoutPreset
    : 'top_banner';
  const titleSize = toPositiveInteger(input.titleSize, 84, 20, 240);
  const subtitleSize = toPositiveInteger(input.subtitleSize, 36, 14, 140);
  const badgeSize = toPositiveInteger(input.badgeSize, 28, 12, 96);
  const titleText = String(input.titleText || '').trim();
  const subtitleText = String(input.subtitleText || '').trim();
  const badgeText = String(input.badgeText || '').trim();
  const sidePadding = Math.round(canvasWidth * 0.06);
  const blockGap = 16;
  const blocks = [];
  const layout = {
    canvasWidth,
    canvasHeight,
    layoutPreset,
    overlayBand: null,
    blocks
  };

  if (layoutPreset === 'top_banner') {
    const titleY = Math.round(canvasHeight * 0.14);
    if (titleText) {
      blocks.push(createTextBlock('title', titleText, sidePadding, titleY, canvasWidth - (sidePadding * 2), 'center', titleSize));
    }
    if (subtitleText) {
      blocks.push(createTextBlock('subtitle', subtitleText, sidePadding, titleY + titleSize + blockGap, canvasWidth - (sidePadding * 2), 'center', subtitleSize));
    }
    if (badgeText) {
      blocks.push(createTextBlock('badge', badgeText, canvasWidth - sidePadding, Math.round(canvasHeight * 0.1), Math.round(canvasWidth * 0.28), 'right', badgeSize));
    }
    layout.overlayBand = {
      verticalAlign: 'top',
      top: Math.round(canvasHeight * 0.07),
      height: Math.round(canvasHeight * 0.24)
    };
    return layout;
  }

  if (layoutPreset === 'center_focus') {
    const titleY = Math.round(canvasHeight * 0.44);
    if (titleText) {
      blocks.push(createTextBlock('title', titleText, sidePadding, titleY, canvasWidth - (sidePadding * 2), 'center', titleSize));
    }
    if (subtitleText) {
      blocks.push(createTextBlock('subtitle', subtitleText, sidePadding, titleY + titleSize + blockGap, canvasWidth - (sidePadding * 2), 'center', subtitleSize));
    }
    if (badgeText) {
      blocks.push(createTextBlock('badge', badgeText, sidePadding, Math.round(canvasHeight * 0.12), Math.round(canvasWidth * 0.32), 'left', badgeSize));
    }
    layout.overlayBand = {
      verticalAlign: 'center',
      top: Math.round(canvasHeight * 0.3),
      height: Math.round(canvasHeight * 0.34)
    };
    return layout;
  }

  const titleY = Math.round(canvasHeight * 0.72);
  if (titleText) {
    blocks.push(createTextBlock('title', titleText, sidePadding, titleY, canvasWidth - (sidePadding * 2), 'left', titleSize));
  }
  if (subtitleText) {
    blocks.push(createTextBlock('subtitle', subtitleText, sidePadding, titleY + titleSize + blockGap, canvasWidth - (sidePadding * 2), 'left', subtitleSize));
  }
  if (badgeText) {
    blocks.push(createTextBlock('badge', badgeText, canvasWidth - sidePadding, Math.round(canvasHeight * 0.12), Math.round(canvasWidth * 0.32), 'right', badgeSize));
  }
  layout.overlayBand = {
    verticalAlign: 'bottom',
    top: Math.round(canvasHeight * 0.62),
    height: Math.round(canvasHeight * 0.28)
  };
  return layout;
}

export function buildBorderFrameLayout(input = {}) {
  const imageWidth = toPositiveInteger(input.imageWidth, 1200, 1, 6000);
  const imageHeight = toPositiveInteger(input.imageHeight, 900, 1, 6000);
  const padding = toPositiveInteger(input.padding, 48, 0, 800);
  const borderWidth = toPositiveInteger(input.borderWidth, 16, 0, 200);
  const cornerRadius = toPositiveInteger(input.cornerRadius, 28, 0, 600);
  const offset = padding + borderWidth;

  return {
    canvasSize: {
      width: imageWidth + (offset * 2),
      height: imageHeight + (offset * 2)
    },
    imageRect: {
      x: offset,
      y: offset,
      width: imageWidth,
      height: imageHeight
    },
    outerRadius: cornerRadius,
    innerRadius: Math.max(0, cornerRadius - borderWidth)
  };
}

export function buildPlatformTemplateLayout(input = {}) {
  const imageWidth = toPositiveInteger(input.imageWidth, 1200, 1, 6000);
  const imageHeight = toPositiveInteger(input.imageHeight, 900, 1, 6000);
  const presetKey = Object.hasOwn(PLATFORM_TEMPLATE_PRESETS, input.presetKey)
    ? input.presetKey
    : 'xiaohongshu_cover';
  const fitMode = ['cover', 'contain', 'stretch'].includes(input.fitMode) ? input.fitMode : 'cover';
  const preset = PLATFORM_TEMPLATE_PRESETS[presetKey];
  const canvasWidth = preset.width;
  const canvasHeight = preset.height;

  if (fitMode === 'stretch') {
    return {
      canvasSize: { width: canvasWidth, height: canvasHeight },
      placement: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
      preset
    };
  }

  const scale = fitMode === 'cover'
    ? Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight)
    : Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = Math.round(imageWidth * scale);
  const height = Math.round(imageHeight * scale);
  const x = Math.round((canvasWidth - width) / 2);
  const y = Math.round((canvasHeight - height) / 2);

  return {
    canvasSize: { width: canvasWidth, height: canvasHeight },
    placement: { x, y, width, height },
    preset
  };
}

export function buildPlatformTemplateBatchPlan(input = {}) {
  const sourceFileName = stripFileExtension(String(input.sourceFileName || 'image'));
  const outputFormat = String(input.outputFormat || 'png').toLowerCase() === 'jpg' ? 'jpg' : 'png';
  const selectedPresetKeys = Array.isArray(input.selectedPresetKeys) ? input.selectedPresetKeys : [];

  return selectedPresetKeys
    .filter((presetKey) => Object.hasOwn(PLATFORM_TEMPLATE_PRESETS, presetKey))
    .map((presetKey) => ({
      presetKey,
      fileName: `${sourceFileName}-${presetKey}.${outputFormat}`,
      label: PLATFORM_TEMPLATE_PRESETS[presetKey].label
    }));
}

export function createAnnotationFromCanvasPoint(input = {}) {
  return {
    kind: normalizeAnnotationMode(input.mode),
    x: toPositiveInteger(input.pointX, 0, 0, 6000),
    y: toPositiveInteger(input.pointY, 0, 0, 6000),
    color: normalizeColor(input.color, '#ff3355'),
    lineWidth: toPositiveInteger(input.lineWidth, 6, 1, 48),
    labelText: String(input.labelText || '').trim(),
    shapeSize: toPositiveInteger(input.shapeSize, 96, 24, 800),
    arrowDirection: normalizeArrowDirection(input.arrowDirection),
    mosaicBlockSize: toPositiveInteger(input.mosaicBlockSize, 14, 4, 64)
  };
}

export function createPrivacyRedactionFromCanvasPoint(input = {}) {
  return {
    kind: ['mosaic', 'blur', 'fill'].includes(input.mode) ? input.mode : 'mosaic',
    x: toPositiveInteger(input.pointX, 0, 0, 6000),
    y: toPositiveInteger(input.pointY, 0, 0, 6000),
    shapeSize: toPositiveInteger(input.shapeSize, 160, 24, 1200),
    blurRadius: toPositiveInteger(input.blurRadius, 18, 2, 64),
    mosaicBlockSize: toPositiveInteger(input.mosaicBlockSize, 14, 4, 64),
    fillColor: normalizeColor(input.fillColor, '#111111')
  };
}

export function createErasePatchFromCanvasPoint(input = {}) {
  return {
    x: toPositiveInteger(input.pointX, 0, 0, 6000),
    y: toPositiveInteger(input.pointY, 0, 0, 6000),
    brushSize: toPositiveInteger(input.brushSize, 64, 12, 480),
    sampleOffset: toPositiveInteger(input.sampleOffset, 20, 4, 160)
  };
}

export function buildBasicImageMetadataSummary(input = {}) {
  const lines = [
    `文件名：${String(input.fileName || '未命名图片')}`,
    `格式：${String(input.mimeType || '未知格式')}`,
    `尺寸：${toPositiveInteger(input.imageWidth, 0, 0, 20000)} x ${toPositiveInteger(input.imageHeight, 0, 0, 20000)}`,
    `体积：${formatBytes(toPositiveInteger(input.fileSize, 0, 0, Number.MAX_SAFE_INTEGER))}`
  ];
  if (input.lastModified) {
    lines.push(`修改时间：${String(input.lastModified)}`);
  }
  return lines.join('\n');
}

export function buildRotateAdjustLayout(input = {}) {
  const imageWidth = toPositiveInteger(input.imageWidth, 1200, 1, 6000);
  const imageHeight = toPositiveInteger(input.imageHeight, 900, 1, 6000);
  const angle = normalizeRotationAngle(input.angle);
  const radians = (angle * Math.PI) / 180;
  const swapSize = Math.abs(angle) % 180 === 90;
  return {
    angle,
    rotationRadians: radians,
    canvasSize: {
      width: swapSize ? imageHeight : imageWidth,
      height: swapSize ? imageWidth : imageHeight
    }
  };
}

export async function loadImageFromFile(file) {
  if (!file) {
    throw new Error('先选择一张图片。');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromUrl(objectUrl);
    image.__objectUrl = objectUrl;
    return image;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function renderImageTextPreview(canvas, image, options = {}) {
  if (!canvas || !image) {
    throw new Error('当前还没有可预览的图片。');
  }

  prepareCanvas(canvas, image.naturalWidth || image.width, image.naturalHeight || image.height);
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const layout = buildImageTextLayout({
    canvasWidth: width,
    canvasHeight: height,
    layoutPreset: options.layoutPreset,
    titleText: options.titleText,
    subtitleText: options.subtitleText,
    badgeText: options.badgeText,
    titleSize: options.titleSize,
    subtitleSize: options.subtitleSize,
    badgeSize: options.badgeSize
  });

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  if (layout.overlayBand && options.overlayColor !== 'transparent') {
    context.fillStyle = withAlpha(options.overlayColor || '#111827', options.overlayOpacity ?? 0.38);
    context.fillRect(0, layout.overlayBand.top, width, layout.overlayBand.height);
  }

  for (const block of layout.blocks) {
    drawTextBlock(context, block, options);
  }

  return layout;
}

export function renderFlipMirrorPreview(canvas, image, options = {}) {
  prepareCanvas(canvas, image.naturalWidth || image.width, image.naturalHeight || image.height);
  const context = canvas.getContext('2d');
  const mode = ['horizontal', 'vertical', 'both'].includes(options.flipMode) ? options.flipMode : 'horizontal';
  const scaleX = mode === 'horizontal' || mode === 'both' ? -1 : 1;
  const scaleY = mode === 'vertical' || mode === 'both' ? -1 : 1;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(scaleX < 0 ? canvas.width : 0, scaleY < 0 ? canvas.height : 0);
  context.scale(scaleX, scaleY);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.restore();
  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    flipMode: mode
  };
}

export function renderRotateAdjustPreview(canvas, image, options = {}) {
  const layout = buildRotateAdjustLayout({
    imageWidth: image.naturalWidth || image.width,
    imageHeight: image.naturalHeight || image.height,
    angle: options.angle
  });
  prepareCanvas(canvas, layout.canvasSize.width, layout.canvasSize.height);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(layout.rotationRadians);
  context.drawImage(
    image,
    -(image.naturalWidth || image.width) / 2,
    -(image.naturalHeight || image.height) / 2
  );
  context.restore();
  return layout;
}

export function renderBorderFramePreview(canvas, image, options = {}) {
  const layout = buildBorderFrameLayout({
    imageWidth: image.naturalWidth || image.width,
    imageHeight: image.naturalHeight || image.height,
    padding: options.padding,
    borderWidth: options.borderWidth,
    cornerRadius: options.cornerRadius
  });
  prepareCanvas(canvas, layout.canvasSize.width, layout.canvasSize.height);
  const context = canvas.getContext('2d');
  const borderStyle = options.borderStyle === 'gradient' ? 'gradient' : 'solid';

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.shadowColor = 'rgba(15, 23, 42, 0.18)';
  context.shadowBlur = toPositiveInteger(options.shadowStrength, 18, 0, 80);
  context.shadowOffsetY = Math.round(toPositiveInteger(options.shadowStrength, 18, 0, 80) * 0.4);
  drawRoundedRect(context, 0, 0, canvas.width, canvas.height, layout.outerRadius);
  context.fillStyle = borderStyle === 'gradient'
    ? createLinearGradient(context, canvas.width, canvas.height, options.gradientStartColor, options.gradientEndColor)
    : normalizeColor(options.borderColor, '#2563eb');
  context.fill();
  context.restore();

  context.save();
  drawRoundedRect(
    context,
    layout.imageRect.x - toPositiveInteger(options.borderWidth, 16, 0, 200),
    layout.imageRect.y - toPositiveInteger(options.borderWidth, 16, 0, 200),
    layout.imageRect.width + (toPositiveInteger(options.borderWidth, 16, 0, 200) * 2),
    layout.imageRect.height + (toPositiveInteger(options.borderWidth, 16, 0, 200) * 2),
    layout.innerRadius + toPositiveInteger(options.borderWidth, 16, 0, 200)
  );
  context.clip();
  context.drawImage(image, layout.imageRect.x, layout.imageRect.y, layout.imageRect.width, layout.imageRect.height);
  context.restore();

  return layout;
}

export function renderPlatformTemplatePreview(canvas, image, options = {}) {
  const layout = buildPlatformTemplateLayout({
    imageWidth: image.naturalWidth || image.width,
    imageHeight: image.naturalHeight || image.height,
    presetKey: options.presetKey,
    fitMode: options.fitMode
  });
  prepareCanvas(canvas, layout.canvasSize.width, layout.canvasSize.height);
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (options.backgroundMode === 'blur') {
    context.save();
    context.filter = 'blur(28px)';
    const blurLayout = buildPlatformTemplateLayout({
      imageWidth: image.naturalWidth || image.width,
      imageHeight: image.naturalHeight || image.height,
      presetKey: options.presetKey,
      fitMode: 'cover'
    });
    context.drawImage(
      image,
      blurLayout.placement.x,
      blurLayout.placement.y,
      blurLayout.placement.width,
      blurLayout.placement.height
    );
    context.restore();
    context.fillStyle = 'rgba(255, 255, 255, 0.18)';
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    context.fillStyle = normalizeColor(options.backgroundColor, '#f3f4f6');
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(
    image,
    layout.placement.x,
    layout.placement.y,
    layout.placement.width,
    layout.placement.height
  );
  return layout;
}

export function renderSocialCoverPreview(canvas, image, options = {}) {
  const ratioText = String(options.targetRatio || '1:1');
  const [leftText, rightText] = ratioText.split(':');
  const left = Math.max(1, Number.parseInt(leftText || '1', 10) || 1);
  const right = Math.max(1, Number.parseInt(rightText || '1', 10) || 1);
  const height = 1200;
  const width = Math.round((height * left) / right);
  const paddingPercent = Math.max(0.02, Math.min(0.2, Number.parseFloat(String(options.paddingPercent ?? 0.08)) || 0.08));
  const imageRect = {
    x: Math.round(width * paddingPercent),
    y: Math.round(height * paddingPercent),
    width: Math.round(width * (1 - (paddingPercent * 2))),
    height: Math.round(height * (1 - (paddingPercent * 2)))
  };

  prepareCanvas(canvas, width, height);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (options.backgroundMode === 'blur') {
    context.save();
    context.filter = `blur(${Math.max(8, Math.min(48, Number.parseInt(String(options.blurRadius ?? 28), 10) || 28))}px)`;
    context.drawImage(image, 0, 0, width, height);
    context.restore();
    context.fillStyle = 'rgba(255, 255, 255, 0.15)';
    context.fillRect(0, 0, width, height);
  } else {
    context.fillStyle = normalizeColor(options.backgroundColor, '#ffffff');
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
  return {
    canvasSize: { width, height },
    imageRect
  };
}

export function renderPrivacyRedactionPreview(canvas, image, redactions = []) {
  prepareCanvas(canvas, image.naturalWidth || image.width, image.naturalHeight || image.height);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  redactions.forEach((redaction) => drawPrivacyRedaction(context, image, redaction));
  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    redactionCount: redactions.length
  };
}

export function renderLightErasePreview(canvas, image, erasePatches = []) {
  prepareCanvas(canvas, image.naturalWidth || image.width, image.naturalHeight || image.height);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  erasePatches.forEach((patch) => drawLightErasePatch(context, patch));
  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    eraseCount: erasePatches.length
  };
}

export function renderAnnotatedImagePreview(canvas, image, annotations = [], options = {}) {
  prepareCanvas(canvas, image.naturalWidth || image.width, image.naturalHeight || image.height);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  annotations.forEach((annotation) => drawAnnotation(context, annotation, options));
  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    annotationCount: annotations.length
  };
}

export async function exportCanvasBlob(canvas, outputFormat = 'png') {
  const format = String(outputFormat || 'png').toLowerCase() === 'jpg' ? 'jpeg' : 'png';
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, 0.92));
  if (!blob) {
    throw new Error('导出图片失败，请稍后重试。');
  }
  return blob;
}

export async function createStoredZipBlob(entries = []) {
  const normalizedEntries = entries.filter((entry) => entry && entry.fileName && entry.blob);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of normalizedEntries) {
    const nameBytes = encodeUtf8(entry.fileName);
    const dataBytes = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, normalizedEntries.length, true);
  endView.setUint16(10, normalizedEntries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endHeader], { type: 'application/zip' });
}

function prepareCanvas(canvas, width, height) {
  if (!canvas) {
    throw new Error('当前还没有可预览的图片。');
  }
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('当前浏览器不支持图片预览。');
  }
  return context;
}

function createTextBlock(role, text, x, y, maxWidth, align, fontSize) {
  return { role, text, x, y, maxWidth, align, fontSize };
}

function drawTextBlock(context, block, options) {
  const lines = wrapTextLines(context, block.text, block.fontSize, block.maxWidth);
  const fontWeight = block.role === 'title' ? 800 : block.role === 'badge' ? 700 : 500;
  const fontFamily = `"Microsoft YaHei", "PingFang SC", sans-serif`;
  const lineHeight = Math.round(block.fontSize * 1.2);
  const align = block.align;
  const drawX = align === 'right'
    ? block.x
    : align === 'center'
      ? block.x + (block.maxWidth / 2)
      : block.x;
  const textColor = block.role === 'badge'
    ? (options.badgeTextColor || '#ffffff')
    : (options.textColor || '#ffffff');

  context.save();
  context.font = `${fontWeight} ${block.fontSize}px ${fontFamily}`;
  context.textAlign = align;
  context.textBaseline = 'top';

  if (block.role === 'badge' && options.badgeBackgroundColor && options.badgeBackgroundColor !== 'transparent') {
    const longestLine = lines.reduce((current, line) => Math.max(current, context.measureText(line).width), 0);
    const horizontalPadding = Math.round(block.fontSize * 0.48);
    const verticalPadding = Math.round(block.fontSize * 0.28);
    const boxWidth = Math.ceil(longestLine + (horizontalPadding * 2));
    const boxHeight = Math.ceil((lines.length * lineHeight) + (verticalPadding * 2));
    const rectX = align === 'right'
      ? drawX - boxWidth
      : align === 'center'
        ? drawX - (boxWidth / 2)
        : drawX;
    const rectY = block.y - verticalPadding;
    context.fillStyle = withAlpha(options.badgeBackgroundColor, 0.9);
    drawRoundedRect(context, rectX, rectY, boxWidth, boxHeight, Math.max(10, Math.round(block.fontSize * 0.32)));
    context.fill();
  }

  const strokeWidth = toPositiveInteger(options.strokeWidth, 4, 0, 32);
  lines.forEach((line, index) => {
    const lineY = block.y + (index * lineHeight);
    if (strokeWidth > 0) {
      context.lineWidth = strokeWidth;
      context.strokeStyle = options.strokeColor || '#111827';
      context.lineJoin = 'round';
      context.strokeText(line, drawX, lineY);
    }
    context.fillStyle = textColor;
    context.fillText(line, drawX, lineY);
  });
  context.restore();
}

function wrapTextLines(context, text, fontSize, maxWidth) {
  const source = String(text || '').trim();
  if (!source) {
    return [];
  }

  const lines = [];
  const paragraphs = source.split(/\r?\n/);
  context.save();
  context.font = `700 ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  for (const paragraph of paragraphs) {
    let current = '';
    for (const char of paragraph) {
      const candidate = current + char;
      if (current && context.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = char;
      } else {
        current = candidate;
      }
    }
    if (current) {
      lines.push(current);
    }
  }
  context.restore();
  return lines.length > 0 ? lines : [source];
}

function drawAnnotation(context, annotation) {
  const size = annotation.shapeSize;
  const half = Math.round(size / 2);
  const color = annotation.color;
  const lineWidth = annotation.lineWidth;
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = lineWidth;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.font = `700 ${Math.max(18, Math.round(size * 0.42))}px "Microsoft YaHei", sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  if (annotation.kind === 'arrow') {
    const target = getArrowTarget(annotation);
    drawArrow(context, annotation.x, annotation.y, target.x, target.y, lineWidth);
    context.restore();
    return;
  }

  if (annotation.kind === 'rect') {
    context.strokeRect(annotation.x - half, annotation.y - half, size, size);
    context.restore();
    return;
  }

  if (annotation.kind === 'circle') {
    context.beginPath();
    context.arc(annotation.x, annotation.y, half, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    return;
  }

  if (annotation.kind === 'number') {
    context.beginPath();
    context.arc(annotation.x, annotation.y, half, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ffffff';
    context.fillText(annotation.labelText || '1', annotation.x, annotation.y + 2);
    context.restore();
    return;
  }

  if (annotation.kind === 'text') {
    const text = annotation.labelText || '说明';
    const width = Math.max(size, context.measureText(text).width + 28);
    const height = Math.max(42, Math.round(size * 0.48));
    context.fillStyle = withAlpha(color, 0.94);
    drawRoundedRect(context, annotation.x - (width / 2), annotation.y - (height / 2), width, height, 14);
    context.fill();
    context.fillStyle = '#ffffff';
    context.fillText(text, annotation.x, annotation.y + 2);
    context.restore();
    return;
  }

  if (annotation.kind === 'mosaic') {
    drawMosaicRegion(context, annotation.x - half, annotation.y - half, size, size, annotation.mosaicBlockSize);
    context.restore();
  }
}

function getArrowTarget(annotation) {
  const span = annotation.shapeSize;
  const directionMap = {
    right_up: { x: span, y: -span * 0.65 },
    right_down: { x: span, y: span * 0.65 },
    left_up: { x: -span, y: -span * 0.65 },
    left_down: { x: -span, y: span * 0.65 }
  };
  const delta = directionMap[annotation.arrowDirection] || directionMap.right_up;
  return {
    x: annotation.x + delta.x,
    y: annotation.y + delta.y
  };
}

function drawArrow(context, fromX, fromY, toX, toY, lineWidth) {
  const headLength = Math.max(14, lineWidth * 3);
  const angle = Math.atan2(toY - fromY, toX - fromX);
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();

  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(
    toX - (headLength * Math.cos(angle - Math.PI / 6)),
    toY - (headLength * Math.sin(angle - Math.PI / 6))
  );
  context.moveTo(toX, toY);
  context.lineTo(
    toX - (headLength * Math.cos(angle + Math.PI / 6)),
    toY - (headLength * Math.sin(angle + Math.PI / 6))
  );
  context.stroke();
}

function drawMosaicRegion(context, x, y, width, height, blockSize) {
  const sampleWidth = Math.max(1, Math.floor(width / Math.max(1, blockSize)));
  const sampleHeight = Math.max(1, Math.floor(height / Math.max(1, blockSize)));
  const imageData = context.getImageData(x, y, width, height);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sampleWidth;
  tempCanvas.height = sampleHeight;
  const tempContext = tempCanvas.getContext('2d');
  if (!tempContext) {
    return;
  }

  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = width;
  paintCanvas.height = height;
  const paintContext = paintCanvas.getContext('2d');
  if (!paintContext) {
    return;
  }

  paintContext.putImageData(imageData, 0, 0);
  tempContext.imageSmoothingEnabled = false;
  paintContext.imageSmoothingEnabled = false;
  tempContext.drawImage(paintCanvas, 0, 0, width, height, 0, 0, sampleWidth, sampleHeight);
  paintContext.clearRect(0, 0, width, height);
  paintContext.drawImage(tempCanvas, 0, 0, sampleWidth, sampleHeight, 0, 0, width, height);
  context.drawImage(paintCanvas, x, y);
}

function drawPrivacyRedaction(context, image, redaction) {
  const size = redaction.shapeSize;
  const half = Math.round(size / 2);
  const x = Math.max(0, redaction.x - half);
  const y = Math.max(0, redaction.y - half);
  const width = Math.min(size, context.canvas.width - x);
  const height = Math.min(size, context.canvas.height - y);
  if (width <= 0 || height <= 0) {
    return;
  }

  if (redaction.kind === 'fill') {
    context.save();
    context.fillStyle = redaction.fillColor;
    context.fillRect(x, y, width, height);
    context.restore();
    return;
  }

  if (redaction.kind === 'blur') {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempContext = tempCanvas.getContext('2d');
    if (!tempContext) {
      return;
    }
    tempContext.filter = `blur(${redaction.blurRadius}px)`;
    tempContext.drawImage(image, x, y, width, height, 0, 0, width, height);
    context.drawImage(tempCanvas, x, y);
    return;
  }

  drawMosaicRegion(context, x, y, width, height, redaction.mosaicBlockSize);
}

function drawLightErasePatch(context, patch) {
  const radius = Math.round(patch.brushSize / 2);
  const sampleX = Math.max(0, Math.min(context.canvas.width - 1, patch.x + patch.sampleOffset));
  const sampleY = Math.max(0, Math.min(context.canvas.height - 1, patch.y + patch.sampleOffset));
  const sample = context.getImageData(sampleX, sampleY, 1, 1).data;
  context.save();
  context.fillStyle = `rgba(${sample[0]}, ${sample[1]}, ${sample[2]}, 0.96)`;
  context.filter = 'blur(10px)';
  context.beginPath();
  context.arc(patch.x, patch.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function createLinearGradient(context, width, height, startColor, endColor) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, normalizeColor(startColor, '#2563eb'));
  gradient.addColorStop(1, normalizeColor(endColor, '#7c3aed'));
  return gradient;
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function encodeUtf8(text) {
  return new TextEncoder().encode(String(text || ''));
}

function stripFileExtension(fileName) {
  return String(fileName || 'image').replace(/\.[^.]+$/, '') || 'image';
}

function formatBytes(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
}

function normalizeRotationAngle(angle) {
  const parsed = Number.parseFloat(String(angle ?? '0'));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(-270, Math.min(270, parsed));
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败，请换一张图片重试。'));
    image.src = url;
  });
}

function normalizeAnnotationMode(mode) {
  return ['arrow', 'rect', 'circle', 'number', 'text', 'mosaic'].includes(mode)
    ? mode
    : 'arrow';
}

function normalizeArrowDirection(direction) {
  return ['right_up', 'right_down', 'left_up', 'left_down'].includes(direction)
    ? direction
    : 'right_up';
}

function normalizeColor(value, fallbackColor) {
  const text = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallbackColor;
}

function withAlpha(color, alpha) {
  const normalized = String(color || '#111827').trim();
  const opacity = Math.min(1, Math.max(0, Number.parseFloat(String(alpha ?? 1)) || 0));
  if (!normalized.startsWith('#') || ![4, 7].includes(normalized.length)) {
    return `rgba(17, 24, 39, ${opacity})`;
  }
  const expanded = normalized.length === 4
    ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
    : normalized;
  const red = Number.parseInt(expanded.slice(1, 3), 16);
  const green = Number.parseInt(expanded.slice(3, 5), 16);
  const blue = Number.parseInt(expanded.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function toPositiveInteger(value, fallbackValue, minValue, maxValue) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }
  return Math.min(Math.max(parsed, minValue), maxValue);
}
