import { createConversionResultMarkup } from './resultCard.mjs';
import { readApiResponse } from './apiResponse.mjs';
import {
  createSelectedFileOrderMarkup,
  moveItemByOffset
} from './fileSelectionOrder.mjs';
import {
  createMobileDetailScaffold,
  createMobileOverviewMarkup
} from './mobileBuyerMarkup.mjs';
import {
  parseBuyerRouteState,
  stringifyBuyerRouteState
} from './buyerRouteState.mjs';
import { createBuyerShellMarkup } from './buyerShellMarkup.mjs';
import { buyerCategoryCatalog } from './buyerCategoryCatalog.mjs';
import {
  getBuyerToolByKey as resolveBuyerToolByKey,
  getVisibleTools as getVisibleBuyerTools
} from './buyerToolCatalog.mjs';
import { runDevTool } from './devToolRuntime.mjs';
import {
  createAnnotationFromCanvasPoint,
  createErasePatchFromCanvasPoint,
  createPrivacyRedactionFromCanvasPoint,
  createStoredZipBlob,
  buildBasicImageMetadataSummary,
  buildPlatformTemplateBatchPlan,
  buildRotateAdjustLayout,
  exportCanvasBlob,
  getPlatformTemplatePresetMap,
  loadImageFromFile,
  renderAnnotatedImagePreview,
  renderBorderFramePreview,
  renderFlipMirrorPreview,
  renderImageTextPreview,
  renderLightErasePreview,
  renderPlatformTemplatePreview,
  renderPrivacyRedactionPreview,
  renderRotateAdjustPreview,
  renderSocialCoverPreview
} from './localImageToolRuntime.mjs';
import {
  collectWaveformPeaks,
  createObjectUrlFromBytes,
  createToneWavBytes,
  createWhiteNoiseWavBytes,
  drawWaveform
} from './mediaToolRuntime.mjs';
import {
  createDeleteThumbnailMarkup,
  createReorderThumbnailMarkup,
  loadPdfPagePreviews
} from './pdfThumbnailPreview.mjs';
import { runTextTool } from './textToolRuntime.mjs';
import {
  createStructuredRangeRowMarkup,
  createToolDetailMarkup,
  createToolOverviewMarkup
} from './toolCatalogMarkup.mjs';
import { applyBuyerMotion } from './buyerMotion.mjs';
import { validateSelectedFiles } from './conversionValidation.mjs';
import { createUploadProgressMarkup, getUploadStageText } from './uploadProgress.mjs';

const buyerLoginPanel = document.querySelector('#buyer-login-panel');
const buyerDashboard = document.querySelector('#buyer-dashboard');
const buyerLoginForm = document.querySelector('#buyer-login-form');
const buyerMessage = document.querySelector('#buyer-message');

let conversionCatalog = [];
const categoryCatalog = buyerCategoryCatalog;
const quickKeywordCatalog = ['PDF 转 PPT', 'OCR', '批量重命名', '音频转文字', '文字转语音', '图片压缩', 'SSL'];
const selectedFilesByConversionKey = new Map();
const conversionSummaries = new Map();
const localImageStateByConversionKey = new Map();
const localTextDownloadStateByConversionKey = new Map();
const signatureCanvasStateByConversionKey = new Map();
const thumbnailStateByConversionKey = new Map();
let currentViewState = {
  view: 'tool_list',
  categoryKey: categoryCatalog[0].key,
  conversionKey: null,
  searchKeyword: '',
  mobileNavOpen: false
};

buyerDashboard.addEventListener('click', handleDashboardClick);
buyerDashboard.addEventListener('input', handleDashboardInput);
buyerDashboard.addEventListener('keydown', handleDashboardKeydown);

initialize();

async function initialize() {
  const sessionResponse = await fetch('/api/buyer/session');
  const sessionBody = await sessionResponse.json();
  if (sessionResponse.ok && sessionBody.authenticated) {
    currentViewState = {
      ...currentViewState,
      ...parseBuyerRouteState(window.location.hash)
    };
    showBuyerDashboard();
    await loadCatalog();
    return;
  }

  showBuyerLogin();
}

buyerLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(buyerMessage, '正在校验卡密...');

  const code = document.querySelector('#buyer-code').value.trim();
  const response = await fetch('/api/buyer/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ code })
  });

  const body = await readApiResponse(response);
  if (!response.ok) {
    setMessage(buyerMessage, formatBuyerError(body.reason));
    return;
  }

  showBuyerDashboard();
  setMessage(buyerMessage, '');
  await loadCatalog();
});

function showBuyerLogin() {
  buyerLoginPanel.classList.remove('hidden');
  buyerDashboard.classList.add('hidden');
  requestAnimationFrame(() => applyBuyerMotion('login'));
}

function showBuyerDashboard() {
  buyerLoginPanel.classList.add('hidden');
  buyerDashboard.classList.remove('hidden');
}

async function loadCatalog() {
  const response = await fetch('/api/conversions/catalog');
  const body = await readApiResponse(response);
  conversionCatalog = body.conversions || [];
  if (currentViewState.view === 'detail' && currentViewState.conversionKey) {
    renderDetail(currentViewState.conversionKey);
    return;
  }

  renderToolList();
}

function getConversionDetailHost() {
  return buyerDashboard.querySelector('#conversion-detail');
}

function getConversionMessageElement() {
  return buyerDashboard.querySelector('#conversion-message');
}

listenToMediaQuery(window.matchMedia('(max-width: 720px)'), () => {
  rerenderCurrentView();
});

function listenToMediaQuery(mediaQueryList, listener) {
  if (!mediaQueryList || typeof listener !== 'function') {
    return;
  }

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', listener);
    return;
  }

  if (typeof mediaQueryList.addListener === 'function') {
    mediaQueryList.addListener(listener);
  }
}

async function handleConversionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const conversionKey = form.dataset.conversionKey;
  const input = form.querySelector('[data-file-input]');
  let conversionOptions = {};
  try {
    conversionOptions = collectConversionOptions(form, conversionKey);
  } catch (error) {
    setMessage(getConversionMessageElement(), error.message || '请检查页码范围后再试。');
    return;
  }

  try {
    const payload = new FormData();
    payload.append('conversionKey', conversionKey);
    if (Object.keys(conversionOptions).length > 0) {
      payload.append('conversionOptions', JSON.stringify(conversionOptions));
    }

    if (conversionKey === 'watermark_pdf') {
      const pdfFiles = Array.from(input.files || []);
      if (pdfFiles.length === 0) {
        setMessage(getConversionMessageElement(), '先选择一个 PDF 文件。');
        return;
      }

      const pdfValidationMessage = validateSelectedFiles(
        pdfFiles,
        ['.pdf'],
        {
          maxFileSizeMb: toNullableNumber(form.dataset.maxFileSizeMb)
        }
      );
      if (pdfValidationMessage) {
        setMessage(getConversionMessageElement(), pdfValidationMessage);
        return;
      }

      payload.append('files', pdfFiles[0], pdfFiles[0].name);

      if (conversionOptions.watermarkType === 'image') {
        const watermarkImageFiles = Array.from(
          form.querySelector('[data-watermark-image-input]')?.files || []
        );
        if (watermarkImageFiles.length === 0) {
          setMessage(getConversionMessageElement(), '图片水印模式下请上传 PNG 或 JPG 图片。');
          return;
        }

        const imageValidationMessage = validateSelectedFiles(
          watermarkImageFiles,
          ['.png', '.jpg', '.jpeg'],
          {
            maxFileSizeMb: 10
          }
        );
        if (imageValidationMessage) {
          setMessage(getConversionMessageElement(), imageValidationMessage);
          return;
        }

        payload.append('watermarkImage', watermarkImageFiles[0], watermarkImageFiles[0].name);
      }
    } else if (conversionKey === 'sign_stamp_pdf' || conversionKey === 'batch_sign_stamp_pdf') {
      const pdfFiles = Array.from(input.files || []);
      if (pdfFiles.length === 0) {
        setMessage(
          getConversionMessageElement(),
          conversionKey === 'batch_sign_stamp_pdf' ? '请至少选择两个 PDF 文件。' : '先选择一个 PDF 文件。'
        );
        return;
      }

      if (conversionKey === 'batch_sign_stamp_pdf' && pdfFiles.length < 2) {
        setMessage(getConversionMessageElement(), '请至少选择两个 PDF 文件。');
        return;
      }

      const pdfValidationMessage = validateSelectedFiles(
        pdfFiles,
        ['.pdf'],
        {
          maxFileSizeMb: toNullableNumber(form.dataset.maxFileSizeMb)
        }
      );
      if (pdfValidationMessage) {
        setMessage(getConversionMessageElement(), pdfValidationMessage);
        return;
      }

      if (conversionKey === 'batch_sign_stamp_pdf') {
        for (const pdfFile of pdfFiles) {
          payload.append('files', pdfFile, pdfFile.name);
        }
      } else {
        payload.append('files', pdfFiles[0], pdfFiles[0].name);
      }

      if (conversionOptions.stampSourceType === 'image') {
        const stampImageFiles = Array.from(form.querySelector('[data-stamp-image-input]')?.files || []);
        if (stampImageFiles.length === 0) {
          setMessage(getConversionMessageElement(), '请上传签名或印章图片。');
          return;
        }

        const imageValidationMessage = validateSelectedFiles(stampImageFiles, ['.png', '.jpg', '.jpeg'], {
          maxFileSizeMb: 10
        });
        if (imageValidationMessage) {
          setMessage(getConversionMessageElement(), imageValidationMessage);
          return;
        }

        payload.append('stampImage', stampImageFiles[0], stampImageFiles[0].name);
      } else {
        const signatureFile = await buildSignatureFile(form, conversionKey);
        if (!signatureFile) {
          setMessage(getConversionMessageElement(), '请先手写签名后再开始转换。');
          return;
        }

        payload.append('stampImage', signatureFile, signatureFile.name);
      }
    } else {
      const requiresUpload = resolveBuyerToolByKey(conversionCatalog, conversionKey)?.requiresUpload !== false;
      if (requiresUpload) {
        const files = getSelectedFiles(form, conversionKey);
        const accepts = ((input?.dataset.accepts) || '')
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean);
        const limits = {
          maxFileSizeMb: toNullableNumber(form.dataset.maxFileSizeMb),
          maxTotalFileSizeMb: toNullableNumber(form.dataset.maxTotalFileSizeMb)
        };

        if (files.length === 0) {
          setMessage(getConversionMessageElement(), '先选择文件。');
          return;
        }

        const validationMessage = validateSelectedFiles(files, accepts, limits);
        if (validationMessage) {
          setMessage(getConversionMessageElement(), validationMessage);
          return;
        }

        for (const file of files) {
          payload.append('files', file, file.name);
        }
      }
    }

    renderUploadProgress(conversionKey, {
      stage: 'uploading',
      percent: 0,
      detail: getUploadStageText('uploading')
    });

    const response = await uploadWithProgress('/api/conversions/run', payload, (event) => {
      if (!event.lengthComputable) {
        renderUploadProgress(conversionKey, {
          stage: 'uploading',
          percent: 5,
          detail: getUploadStageText('uploading')
        });
        return;
      }

      const percent = event.total > 0 ? (event.loaded / event.total) * 100 : 0;
      renderUploadProgress(conversionKey, {
        stage: 'uploading',
        percent,
        detail: getUploadStageText('uploading')
      });
    });

    renderUploadProgress(conversionKey, {
      stage: 'processing',
      percent: 100,
      detail: getUploadStageText('processing')
    });

    const body = await readApiResponse(response);
    if (!response.ok) {
      conversionSummaries.delete(conversionKey);
      renderUploadProgress(conversionKey, {
        stage: 'error',
        percent: 100,
        detail: body.message || getUploadStageText('error')
      });
      setMessage(getConversionMessageElement(), body.message || '转换失败。');
      return;
    }

    conversionSummaries.set(conversionKey, body.conversion.summary || null);
    clearUploadProgress(conversionKey);
    setMessage(getConversionMessageElement(), '');
    renderResults(conversionKey, body.conversion.files);
  } catch (error) {
    conversionSummaries.delete(conversionKey);
    renderUploadProgress(conversionKey, {
      stage: 'error',
      percent: 100,
      detail: getUploadStageText('error')
    });
    setMessage(getConversionMessageElement(), '上传失败，请确认服务仍在运行，或先压缩大文件后重试。');
  }
}

function renderResults(conversionKey, files) {
  const resultsHost = getConversionDetailHost()?.querySelector(`[data-results="${conversionKey}"]`);
  if (!resultsHost) {
    return;
  }
  const summary = currentConversionSummary(conversionKey);
  resultsHost.innerHTML = createConversionResultMarkup(files, buildGeneratedLabel(), summary);
}

function setMessage(element, value) {
  if (!element) {
    return;
  }

  element.textContent = value;
}

function formatBuyerError(reason) {
  if (reason === 'CODE_EXHAUSTED') {
    return '这个次数型卡密已经用完了。';
  }

  if (reason === 'CODE_EXPIRED') {
    return '这个时效型卡密已经过期。';
  }

  return '卡密不可用，请检查后重试。';
}

function buildGeneratedLabel() {
  return `刚刚生成 · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;
}

function toNullableNumber(value) {
  const parsed = Number.parseFloat(String(value || ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function renderUploadProgress(conversionKey, progressState) {
  const host = getConversionDetailHost()?.querySelector(`[data-progress="${conversionKey}"]`);
  if (!host) {
    return;
  }

  host.innerHTML = createUploadProgressMarkup(progressState);
}

function clearUploadProgress(conversionKey) {
  const host = getConversionDetailHost()?.querySelector(`[data-progress="${conversionKey}"]`);
  if (!host) {
    return;
  }

  host.innerHTML = '';
}

function ensureDefaultStructuredRangeRow(form) {
  if (!requiresPageSelection(form.dataset.conversionKey)) {
    return;
  }

  const host = form.querySelector('[data-range-rows]');
  if (!host || host.children.length > 0) {
    return;
  }

  appendStructuredRangeRow(host, form.dataset.conversionKey);
}

function appendStructuredRangeRow(host, conversionKey) {
  if (!host) {
    return;
  }

  host.insertAdjacentHTML('beforeend', createStructuredRangeRowMarkup(conversionKey));
}

function collectConversionOptions(form, conversionKey) {
  if (isImageConversionKey(conversionKey)) {
    return collectImageConversionOptions(form, conversionKey);
  }

  if (conversionKey === 'compress_pdf') {
    return {
      compressionLevel: form.querySelector('[data-compression-level]')?.value === 'strong'
        ? 'strong'
        : 'standard'
    };
  }

  if (conversionKey === 'pdf_to_word') {
    return {
      pdfToWordMode: form.querySelector('[data-pdf-to-word-mode]')?.value === 'ocr'
        ? 'ocr'
        : 'no_ocr',
      ocrLanguage: form.querySelector('[data-ocr-language]')?.value || 'chi_sim+eng'
    };
  }

  if (conversionKey === 'scan_to_searchable_pdf') {
    return {
      ocrLanguage: form.querySelector('[data-ocr-language]')?.value || 'chi_sim+eng'
    };
  }

  if (conversionKey === 'ocr_text_extract') {
    return {
      ocrLanguage: form.querySelector('[data-ocr-language]')?.value || 'chi_sim+eng'
    };
  }

  if (conversionKey === 'images_to_word') {
    return {
      ocrLanguage: form.querySelector('[data-ocr-language]')?.value || 'chi_sim+eng'
    };
  }

  if (conversionKey === 'image_table_to_excel') {
    return {
      ocrLanguage: form.querySelector('[data-ocr-language]')?.value || 'chi_sim+eng'
    };
  }

  if (conversionKey === 'exam_paper_cleanup') {
    return {
      outputMode: form.querySelector('[data-exam-output-mode]')?.value === 'image_zip'
        ? 'image_zip'
        : 'pdf',
      cleanupMode: form.querySelector('[data-exam-cleanup-mode]')?.value || 'grayscale',
      splitDoublePage: form.querySelector('[data-exam-split-double-page]')?.value === 'true',
      enhanceContrast: form.querySelector('[data-exam-enhance-contrast]')?.value !== 'false'
    };
  }

  if (conversionKey === 'batch_file_rename') {
    return {
      template: form.querySelector('[data-rename-template]')?.value?.trim() || '资料-{n}-{name}',
      startNumber: Number.parseInt(form.querySelector('[data-rename-start-number]')?.value || '1', 10) || 1,
      numberWidth: Number.parseInt(form.querySelector('[data-rename-number-width]')?.value || '2', 10) || 2
    };
  }

  if (conversionKey === 'delete_pages_pdf') {
    const selectedPages = thumbnailStateByConversionKey.get(conversionKey)?.selectedPages;
    return {
      rangeText: form.querySelector('[data-delete-range-text]')?.value?.trim() || '',
      selectedPages: selectedPages ? Array.from(selectedPages) : []
    };
  }

  if (conversionKey === 'reorder_pages_pdf') {
    const orderedPages = thumbnailStateByConversionKey.get(conversionKey)?.pages?.map((page) => page.pageNumber) || [];
    return {
      orderText: form.querySelector('[data-order-text]')?.value?.trim() || '',
      orderedPages
    };
  }

  if (conversionKey === 'protect_unlock_pdf') {
    const mode = form.querySelector('[data-protect-mode]')?.value === 'unlock' ? 'unlock' : 'protect';
    return mode === 'unlock'
      ? {
          mode,
          password: form.querySelector('[data-unlock-password]')?.value || ''
        }
      : {
          mode,
          password: form.querySelector('[data-protect-password]')?.value || '',
          confirmPassword: form.querySelector('[data-protect-confirm-password]')?.value || ''
        };
  }

  if (conversionKey === 'watermark_pdf') {
    const watermarkType = form.querySelector('[data-watermark-type]')?.value === 'image' ? 'image' : 'text';
    return watermarkType === 'image'
      ? {
          watermarkType,
          imagePosition: form.querySelector('[data-image-position]')?.value || 'center',
          imageScalePercent: Number.parseInt(form.querySelector('[data-image-scale-percent]')?.value || '30', 10) || 30,
          opacity: Number.parseFloat(form.querySelector('[data-image-opacity]')?.value || '0.30') || 0.30
        }
      : {
          watermarkType,
          textLayout: form.querySelector('[data-text-layout]')?.value === 'center' ? 'center' : 'tile',
          textContent: form.querySelector('[data-text-content]')?.value?.trim() || '水印',
          fontSize: Number.parseInt(form.querySelector('[data-watermark-font-size]')?.value || '26', 10) || 26,
          opacity: Number.parseFloat(form.querySelector('[data-watermark-opacity]')?.value || '0.18') || 0.18,
          rotation: Number.parseFloat(form.querySelector('[data-watermark-rotation]')?.value || '-32') || -32
        };
  }

  if (conversionKey === 'add_page_numbers_pdf') {
    return {
      pageNumberPosition: form.querySelector('[data-page-number-position]')?.value || 'footer_center',
      pageNumberStart: Number.parseInt(form.querySelector('[data-page-number-start]')?.value || '1', 10) || 1,
      pageNumberFormat: form.querySelector('[data-page-number-format]')?.value || 'plain'
    };
  }

  if (conversionKey === 'sign_stamp_pdf' || conversionKey === 'batch_sign_stamp_pdf') {
    return {
      stampSourceType: form.querySelector('[data-stamp-source-type]')?.value === 'draw' ? 'draw' : 'image',
      stampPosition: form.querySelector('[data-stamp-position]')?.value || 'bottom_right',
      stampScalePercent: Number.parseInt(form.querySelector('[data-stamp-scale-percent]')?.value || '35', 10) || 35,
      opacity: Number.parseFloat(form.querySelector('[data-stamp-opacity]')?.value || '0.40') || 0.40
    };
  }

  if (conversionKey === 'rotate_pdf') {
    return {
      rotationAngle: Number.parseInt(form.querySelector('[data-rotation-angle]')?.value || '90', 10) || 90
    };
  }

  if (!requiresPageSelection(conversionKey)) {
    return {};
  }

  const rangeText = form.querySelector('[data-range-text]')?.value?.trim() || '';
  if (rangeText) {
    return {
      rangeText
    };
  }

  const structuredRanges = [];
  for (const row of form.querySelectorAll('[data-range-row]')) {
    const startPage = row.querySelector('[data-range-start]')?.value?.trim() || '';
    const endPage = row.querySelector('[data-range-end]')?.value?.trim() || '';

    if (!startPage && !endPage) {
      continue;
    }

    if (!startPage || !endPage) {
      throw new Error('请把页码范围补完整后再开始转换。');
    }

    structuredRanges.push({
      startPage: Number.parseInt(startPage, 10),
      endPage: Number.parseInt(endPage, 10)
    });
  }

  if (structuredRanges.length === 0) {
    throw new Error(
      conversionKey === 'split_pdf'
        ? '请先填写要拆分的页码范围。'
        : '请先填写要提取的页码范围。'
    );
  }

  return {
    structuredRanges
  };
}

function isImageConversionKey(conversionKey) {
  return Boolean(resolveBuyerToolByKey(conversionCatalog, conversionKey)?.categoryKey === 'image_tools');
}

function collectImageConversionOptions(form, conversionKey) {
  if (conversionKey === 'qr_generate') {
    return {
      qrText: form.querySelector('[data-qr-text]')?.value?.trim() || '',
      sizePx: Number.parseInt(form.querySelector('[data-qr-size]')?.value || '320', 10) || 320
    };
  }

  if (conversionKey === 'qr_generate_batch') {
    return {
      qrLinesText: form.querySelector('[data-qr-lines-text]')?.value || '',
      sizePx: Number.parseInt(form.querySelector('[data-qr-size]')?.value || '256', 10) || 256
    };
  }

  if (conversionKey === 'payment_code_merge') {
    return {
      layout: form.querySelector('[data-payment-code-layout]')?.value || 'vertical',
      mainTitle: form.querySelector('[data-payment-code-title]')?.value?.trim() || '收款码'
    };
  }

  const outputFormat = form.querySelector('[data-image-output-format]')?.value || '';

  if (conversionKey === 'image_compress_batch') {
    return {
      quality: Number.parseInt(form.querySelector('[data-image-quality]')?.value || '75', 10) || 75
    };
  }

  if (conversionKey === 'image_resize_exact') {
    return {
      targetWidth: Number.parseInt(form.querySelector('[data-target-width]')?.value || '800', 10) || 800,
      targetHeight: Number.parseInt(form.querySelector('[data-target-height]')?.value || '600', 10) || 600,
      outputFormat
    };
  }

  if (conversionKey === 'image_resize_scale') {
    return {
      scalePercent: Number.parseInt(form.querySelector('[data-scale-percent]')?.value || '100', 10) || 100,
      outputFormat
    };
  }

  if (conversionKey === 'image_crop_free') {
    return {
      cropX: Number.parseInt(form.querySelector('[data-crop-x]')?.value || '0', 10) || 0,
      cropY: Number.parseInt(form.querySelector('[data-crop-y]')?.value || '0', 10) || 0,
      cropWidth: Number.parseInt(form.querySelector('[data-crop-width]')?.value || '300', 10) || 300,
      cropHeight: Number.parseInt(form.querySelector('[data-crop-height]')?.value || '300', 10) || 300,
      outputFormat
    };
  }

  if (['image_crop_ratio', 'image_crop_ratio_batch'].includes(conversionKey)) {
    return {
      aspectRatio: form.querySelector('[data-aspect-ratio]')?.value || '1:1',
      outputFormat
    };
  }

  if (conversionKey === 'image_split_grid') {
    return {
      rows: Number.parseInt(form.querySelector('[data-grid-rows]')?.value || '2', 10) || 2,
      columns: Number.parseInt(form.querySelector('[data-grid-columns]')?.value || '2', 10) || 2,
      outputFormat
    };
  }

  if (conversionKey === 'image_nine_grid') {
    return {
      outputFormat
    };
  }

  if (conversionKey === 'image_concat_long') {
    return {
      direction: form.querySelector('[data-image-direction]')?.value || 'vertical',
      gap: Number.parseInt(form.querySelector('[data-image-gap]')?.value || '0', 10) || 0,
      backgroundColor: form.querySelector('[data-background-color]')?.value || '#ffffff',
      outputFormat
    };
  }

  if (conversionKey === 'image_collage') {
    return {
      columns: Number.parseInt(form.querySelector('[data-collage-columns]')?.value || '2', 10) || 2,
      gap: Number.parseInt(form.querySelector('[data-image-gap]')?.value || '12', 10) || 12,
      backgroundColor: form.querySelector('[data-background-color]')?.value || '#ffffff',
      outputFormat
    };
  }

  if (['image_fill_background', 'image_dark_mode_background'].includes(conversionKey)) {
    return {
      backgroundColor: form.querySelector('[data-background-color]')?.value || '#ffffff',
      outputFormat
    };
  }

  if (conversionKey === 'image_watermark_tile') {
    return {
      textContent: form.querySelector('[data-watermark-text]')?.value?.trim() || '仅供内部使用',
      fontSize: Number.parseInt(form.querySelector('[data-watermark-font-size]')?.value || '24', 10) || 24,
      opacity: Number.parseFloat(form.querySelector('[data-watermark-opacity]')?.value || '0.22') || 0.22,
      rotation: Number.parseInt(form.querySelector('[data-watermark-rotation]')?.value || '-28', 10) || -28,
      gap: Number.parseInt(form.querySelector('[data-watermark-gap]')?.value || '120', 10) || 120,
      outputFormat
    };
  }

  if (conversionKey === 'image_printmaking') {
    return {
      threshold: Number.parseInt(form.querySelector('[data-threshold]')?.value || '126', 10) || 126,
      outputFormat
    };
  }

  if (['image_remove_solid_bg', 'image_smart_bg_remove', 'id_photo_bg_swap'].includes(conversionKey)) {
    return {
      backgroundColor: form.querySelector('[data-background-color]')?.value || '#438edb',
      tolerance: Number.parseInt(form.querySelector('[data-color-tolerance]')?.value || '36', 10) || 36,
      outputFormat
    };
  }

  if (conversionKey === 'image_add_padding') {
    return {
      paddingTop: Number.parseInt(form.querySelector('[data-padding-top]')?.value || '40', 10) || 40,
      paddingRight: Number.parseInt(form.querySelector('[data-padding-right]')?.value || '40', 10) || 40,
      paddingBottom: Number.parseInt(form.querySelector('[data-padding-bottom]')?.value || '40', 10) || 40,
      paddingLeft: Number.parseInt(form.querySelector('[data-padding-left]')?.value || '40', 10) || 40,
      backgroundColor: form.querySelector('[data-background-color]')?.value || '#ffffff',
      outputFormat
    };
  }

  if (conversionKey === 'image_pixelate') {
    return {
      blockSize: Number.parseInt(form.querySelector('[data-block-size]')?.value || '12', 10) || 12,
      outputFormat
    };
  }

  if (conversionKey === 'image_increase_size') {
    return {
      targetSizeKb: Number.parseInt(form.querySelector('[data-target-size-kb]')?.value || '100', 10) || 100,
      outputFormat
    };
  }

  if (conversionKey === 'image_clear_content') {
    return {
      backgroundColor: form.querySelector('[data-background-color]')?.value || '#ffffff',
      outputFormat
    };
  }

  if (conversionKey === 'image_format_convert') {
    return { outputFormat };
  }

  if (conversionKey === 'image_modify_dpi') {
    return {
      dpi: Number.parseInt(form.querySelector('[data-image-dpi]')?.value || '300', 10) || 300,
      outputFormat
    };
  }

  if (conversionKey === 'gif_merge') {
    return {
      durationMs: Number.parseInt(form.querySelector('[data-gif-duration-ms]')?.value || '400', 10) || 400
    };
  }

  if (conversionKey === 'image_round_corner') {
    return {
      radius: Number.parseInt(form.querySelector('[data-round-corner-radius]')?.value || '36', 10) || 36
    };
  }

  if (conversionKey === 'image_tile_fill') {
    return {
      targetWidth: Number.parseInt(form.querySelector('[data-target-width]')?.value || '1200', 10) || 1200,
      targetHeight: Number.parseInt(form.querySelector('[data-target-height]')?.value || '1200', 10) || 1200,
      outputFormat
    };
  }

  if (['id_photo_resize', 'exam_id_photo_process', 'id_photo_crop'].includes(conversionKey)) {
    return {
      idPhotoPreset: form.querySelector('[data-id-photo-preset]')?.value || 'one_inch',
      maxSizeKb: Number.parseInt(form.querySelector('[data-target-size-kb]')?.value || '120', 10) || 120,
      outputFormat
    };
  }

  if (conversionKey === 'anti_ocr_image') {
    return {
      noiseLevel: Number.parseInt(form.querySelector('[data-noise-level]')?.value || '18', 10) || 18,
      outputFormat
    };
  }

  return outputFormat ? { outputFormat } : {};
}

function requiresPageSelection(conversionKey) {
  return conversionKey === 'pdf_extract_pages' || conversionKey === 'split_pdf';
}

function renderToolList() {
  currentViewState = {
    ...currentViewState,
    view: 'tool_list',
    conversionKey: null
  };
  syncBuyerRouteState();
  renderBuyerDashboard();
}

function renderDetail(conversionKey) {
  const toolItem = resolveBuyerToolByKey(conversionCatalog, conversionKey);
  if (!toolItem) {
    return;
  }

  currentViewState = {
    ...currentViewState,
    view: 'detail',
    conversionKey
  };
  syncBuyerRouteState();
  renderBuyerDashboard();

  const detailHost = getConversionDetailHost();
  const form = detailHost?.querySelector('.tool-form');
  if (!form) {
    return;
  }

  if (toolItem.kind === 'local_text') {
    form.addEventListener('submit', handleLocalTextToolSubmit);
    detailHost.querySelector(`[data-copy-output="${conversionKey}"]`)?.addEventListener('click', handleCopyTextToolOutput);
    setMessage(getConversionMessageElement(), '');
    return;
  }

  if (toolItem.kind === 'local_image_tool') {
    form.addEventListener('submit', handleLocalImageToolSubmit);
    form.querySelector('[data-local-image-file-input]')?.addEventListener('change', handleLocalImageToolFileChange);
    if (conversionKey === 'image_platform_cover_template') {
      detailHost.querySelector('[data-local-image-batch-export]')?.addEventListener('click', handleLocalImageBatchExport);
    }
    if (['image_annotate_canvas', 'image_privacy_redact', 'image_blur_redact', 'image_object_erase_light'].includes(conversionKey)) {
      detailHost.querySelector('[data-local-image-preview]')?.addEventListener('click', handleLocalImageCanvasClick);
      detailHost.querySelector('[data-local-image-undo]')?.addEventListener('click', handleLocalImageUndo);
      detailHost.querySelector('[data-local-image-clear]')?.addEventListener('click', handleLocalImageClear);
    }
    if (conversionKey === 'image_rotate_adjust') {
      detailHost.querySelectorAll('[data-image-rotate-preset]').forEach((button) => {
        button.addEventListener('click', handleRotatePresetClick);
      });
    }
    detailHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMessage(getConversionMessageElement(), '');
    return;
  }

  if (toolItem.kind === 'local_media_tool') {
    form.addEventListener('submit', handleLocalMediaToolSubmit);
    detailHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMessage(getConversionMessageElement(), '');
    return;
  }

  if (toolItem.kind === 'server_media_tool' || toolItem.kind === 'file_media_tool') {
    form.querySelector('[data-file-input]')?.addEventListener('change', handleFileInputChange);
    renderSelectedFileList(form, conversionKey);
    form.addEventListener('submit', handleRemoteMediaToolSubmit);
    detailHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMessage(getConversionMessageElement(), '');
    return;
  }

  if (toolItem.kind === 'local_dev_tool') {
    form.addEventListener('submit', handleLocalDevToolSubmit);
    detailHost.querySelector(`[data-copy-output="${conversionKey}"]`)?.addEventListener('click', handleCopyTextToolOutput);
    detailHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMessage(getConversionMessageElement(), '');
    return;
  }

  if (toolItem.kind === 'backend_dev_tool' || toolItem.kind === 'network_dev_tool' || toolItem.kind === 'server_dev_tool') {
    form.addEventListener('submit', handleRemoteDevToolSubmit);
    detailHost.querySelector(`[data-copy-output="${conversionKey}"]`)?.addEventListener('click', handleCopyTextToolOutput);
    detailHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMessage(getConversionMessageElement(), '');
    return;
  }

  ensureDefaultStructuredRangeRow(form);
  form.querySelector('[data-file-input]')?.addEventListener('change', handleFileInputChange);
  form.querySelector('[data-watermark-type]')?.addEventListener('change', handleWatermarkTypeChange);
  form.querySelector('[data-stamp-source-type]')?.addEventListener('change', handleStampSourceTypeChange);
  form.querySelector('[data-protect-mode]')?.addEventListener('change', handleProtectModeChange);
  syncWatermarkOptionVisibility(form);
  syncStampSourceVisibility(form);
  syncProtectModeVisibility(form);
  initializeSignatureCanvas(form, conversionKey);
  renderPageThumbnails(form, conversionKey);
  renderSelectedFileList(form, conversionKey);
  form.addEventListener('submit', handleConversionSubmit);
  detailHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setMessage(getConversionMessageElement(), '');
}

function renderBuyerDashboard() {
  const category = getCurrentCategory();
  const contentMarkup = currentViewState.view === 'detail' && currentViewState.conversionKey
    ? buildDetailMarkup(currentViewState.conversionKey)
    : buildToolListMarkup();

  buyerDashboard.innerHTML = createBuyerShellMarkup({
    title: currentViewState.view === 'detail' && currentViewState.conversionKey
      ? resolveBuyerToolByKey(conversionCatalog, currentViewState.conversionKey)?.label || category.label
      : category.label,
    searchKeyword: currentViewState.searchKeyword,
    mobileNavOpen: currentViewState.mobileNavOpen,
    quickKeywords: quickKeywordCatalog,
    categories: categoryCatalog,
    activeCategoryKey: currentViewState.categoryKey,
    contentMarkup
  });

  if (currentViewState.view !== 'detail') {
    requestAnimationFrame(() => applyBuyerMotion('tool_list'));
  }
}

function refreshToolListContent() {
  const contentSlot = buyerDashboard.querySelector('[data-buyer-content-slot]');
  const titleElement = buyerDashboard.querySelector('.buyer-current-title h1');
  if (!contentSlot || !titleElement) {
    renderToolList();
    return;
  }

  titleElement.textContent = getCurrentCategory().label;
  contentSlot.innerHTML = buildToolListMarkup();
  requestAnimationFrame(() => applyBuyerMotion('tool_list_refresh'));
}

function buildToolListMarkup() {
  const hasSearchKeyword = Boolean(String(currentViewState.searchKeyword || '').trim());
  const visibleTools = getVisibleBuyerTools(
    conversionCatalog,
    currentViewState.categoryKey,
    currentViewState.searchKeyword
  );
  const mobileMode = isMobileUi();
  const listMarkup = visibleTools.length === 0
    ? '<div class="empty-state-card">没有找到匹配的工具，请换一个关键词试试。</div>'
    : mobileMode
      ? createMobileOverviewMarkup(visibleTools, { showHeader: false })
      : createToolOverviewMarkup(visibleTools);

  return `
    <section class="buyer-section-shell">
      <div class="${mobileMode ? 'buyer-mobile-list-shell' : 'buyer-tool-list-shell tool-group grid-row grid-col-space30'}" id="conversion-overview" data-animate-tool-list>
        ${listMarkup}
      </div>
      <div class="hidden" id="conversion-detail"></div>
      <p class="message" id="conversion-message"></p>
    </section>
  `;
}

function buildDetailMarkup(conversionKey) {
  const toolItem = resolveBuyerToolByKey(conversionCatalog, conversionKey);
  if (!toolItem) {
    return '';
  }

  const mobileMode = isMobileUi();
  const detailMarkup = mobileMode
    ? createMobileDetailScaffold(toolItem).replace(
        '<div class="mobile-detail-content" data-mobile-detail-content></div>',
        `<div class="mobile-detail-content" data-mobile-detail-content>${createToolDetailMarkup(toolItem, { showHeader: false })}</div>`
      )
    : createToolDetailMarkup(toolItem, { showHeader: false });

  return `
    <section class="buyer-section-shell buyer-detail-shell-wrap">
      <div id="conversion-detail">
        ${detailMarkup}
      </div>
      <p class="message" id="conversion-message"></p>
    </section>
  `;
}

function handleDashboardClick(event) {
  const mobileNavToggle = event.target.closest('[data-mobile-nav-toggle]');
  if (mobileNavToggle) {
    currentViewState = {
      ...currentViewState,
      mobileNavOpen: !currentViewState.mobileNavOpen
    };
    renderBuyerDashboard();
    return;
  }

  const closeMobileNav = event.target.closest('[data-close-mobile-nav]');
  if (closeMobileNav) {
    currentViewState = {
      ...currentViewState,
      mobileNavOpen: false
    };
    renderBuyerDashboard();
    return;
  }

  const categoryButton = event.target.closest('[data-open-category]');
  if (categoryButton) {
    currentViewState = {
      ...currentViewState,
      categoryKey: categoryButton.dataset.openCategory,
      searchKeyword: '',
      mobileNavOpen: false
    };
    renderToolList();
    return;
  }

  const searchChip = event.target.closest('[data-search-chip]');
  if (searchChip) {
    currentViewState = {
      ...currentViewState,
      searchKeyword: searchChip.dataset.searchChip || '',
      mobileNavOpen: false
    };
    renderToolList();
    return;
  }

  const openButton = event.target.closest('[data-open-detail]');
  if (openButton) {
    renderDetail(openButton.dataset.openDetail);
    return;
  }

  if (event.target.closest('[data-back-to-overview]')) {
    renderToolList();
    return;
  }

  const addButton = event.target.closest('[data-add-range]');
  if (addButton) {
    const form = addButton.closest('.tool-form');
    if (!form) {
      return;
    }

    appendStructuredRangeRow(form.querySelector('[data-range-rows]'), form.dataset.conversionKey);
    return;
  }

  const removeButton = event.target.closest('[data-remove-range]');
  if (removeButton) {
    const row = removeButton.closest('[data-range-row]');
    if (row) {
      row.remove();
    }
    return;
  }

  const moveButton = event.target.closest('[data-move-file-index]');
  if (moveButton) {
    const form = moveButton.closest('.tool-form');
    if (!form) {
      return;
    }

    const conversionKey = form.dataset.conversionKey;
    const currentFiles = selectedFilesByConversionKey.get(conversionKey) || [];
    const fileIndex = Number.parseInt(moveButton.dataset.moveFileIndex, 10);
    const fileOffset = Number.parseInt(moveButton.dataset.moveFileOffset, 10);
    selectedFilesByConversionKey.set(
      conversionKey,
      moveItemByOffset(currentFiles, fileIndex, fileOffset)
    );
    renderSelectedFileList(form, conversionKey);
    return;
  }

  const thumbnailButton = event.target.closest('[data-thumbnail-page]');
  if (thumbnailButton) {
    const form = thumbnailButton.closest('.tool-form');
    if (!form) {
      return;
    }

    const conversionKey = form.dataset.conversionKey;
    const pageNumber = Number.parseInt(thumbnailButton.dataset.thumbnailPage, 10);
    const state = thumbnailStateByConversionKey.get(conversionKey);
    if (!state) {
      return;
    }

    if (state.selectedPages.has(pageNumber)) {
      state.selectedPages.delete(pageNumber);
    } else {
      state.selectedPages.add(pageNumber);
    }
    renderDeleteThumbnailGrid(form, conversionKey);
    return;
  }

  const thumbnailMoveButton = event.target.closest('[data-thumbnail-move]');
  if (thumbnailMoveButton) {
    const form = thumbnailMoveButton.closest('.tool-form');
    if (!form) {
      return;
    }

    const conversionKey = form.dataset.conversionKey;
    const pageNumber = Number.parseInt(thumbnailMoveButton.dataset.thumbnailMove, 10);
    const offset = Number.parseInt(thumbnailMoveButton.dataset.thumbnailOffset, 10);
    moveThumbnailPage(form, conversionKey, pageNumber, offset);
    return;
  }

  if (event.target.closest('[data-clear-signature]')) {
    const form = event.target.closest('.tool-form');
    if (!form) {
      return;
    }

    const conversionKey = form.dataset.conversionKey;
    clearSignatureCanvas(form, conversionKey);
  }

  const undoImageAnnotationButton = event.target.closest('[data-local-image-undo]');
  if (undoImageAnnotationButton) {
    const resultHost = undoImageAnnotationButton.closest('[data-results]');
    const conversionKey = resultHost?.dataset.results || '';
    const state = localImageStateByConversionKey.get(conversionKey);
    if (!state?.annotations?.length) {
      return;
    }
    state.annotations.pop();
    redrawAnnotatedImage(conversionKey);
    return;
  }

  const clearImageAnnotationButton = event.target.closest('[data-local-image-clear]');
  if (clearImageAnnotationButton) {
    const resultHost = clearImageAnnotationButton.closest('[data-results]');
    const conversionKey = resultHost?.dataset.results || '';
    const state = localImageStateByConversionKey.get(conversionKey);
    if (!state) {
      return;
    }
    state.annotations = [];
    redrawAnnotatedImage(conversionKey);
  }
}

function handleDashboardInput(event) {
  const searchInput = event.target.closest('[data-tool-search-input]');
  if (!searchInput) {
    return;
  }

  currentViewState = {
    ...currentViewState,
    searchKeyword: searchInput.value || '',
    mobileNavOpen: false
  };
  syncBuyerRouteState();
  if (currentViewState.view === 'tool_list') {
    refreshToolListContent();
    return;
  }

  renderToolList();
}

function handleDashboardKeydown(event) {
  const openCard = event.target.closest('[data-open-detail]');
  if (!openCard) {
    return;
  }

  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  renderDetail(openCard.dataset.openDetail);
}

async function handleLocalTextToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;
  let sourceText = form.querySelector('[data-source-text]')?.value || '';
  const findText = form.querySelector('[data-find-text]')?.value || '';
  const replaceText = form.querySelector('[data-replace-text]')?.value || '';
  const caseMode = form.querySelector('[data-case-mode]')?.value || 'upper';
  const separator = form.querySelector('[data-separator]')?.value || '';
  const sortMode = form.querySelector('[data-sort-mode]')?.value || 'asc';
  const prefixText = form.querySelector('[data-prefix-text]')?.value || '';
  const suffixText = form.querySelector('[data-suffix-text]')?.value || '';
  const cutLength = form.querySelector('[data-cut-length]')?.value || '';
  const regexPattern = form.querySelector('[data-regex-pattern]')?.value || '';
  const unicodeMode = form.querySelector('[data-unicode-mode]')?.value || 'encode';
  const symbolMode = form.querySelector('[data-symbol-mode]')?.value || 'en_to_zh';
  const bannedWords = form.querySelector('[data-banned-words]')?.value || '';
  const uuidCount = form.querySelector('[data-uuid-count]')?.value || '';
  const subtitleDurationSeconds = form.querySelector('[data-subtitle-duration-seconds]')?.value || '2.5';
  const subtitleStartTime = form.querySelector('[data-subtitle-start-time]')?.value || '00:00:00,000';
  const localTextFile = form.querySelector('[data-local-text-file-input]')?.files?.[0] || null;

  if (toolKey === 'text_srt_to_text' && localTextFile && !sourceText.trim()) {
    sourceText = await localTextFile.text();
  }

  const result = runTextTool(toolKey, {
    sourceText,
    findText,
    replaceText,
    caseMode,
    separator,
    sortMode,
    prefixText,
    suffixText,
    cutLength,
    regexPattern,
    unicodeMode,
    symbolMode,
    bannedWords,
    uuidCount,
    subtitleDurationSeconds,
    subtitleStartTime
  });

  const resultHost = buyerDashboard.querySelector(`[data-results="${toolKey}"]`);
  const outputElement = resultHost?.querySelector('[data-output-text]');
  if (outputElement) {
    outputElement.value = result.outputText || '';
  }
  syncLocalTextDownload(resultHost, toolKey, result.downloadFile || null);
  renderTextToolSummary(resultHost, result.summary);
  setMessage(getConversionMessageElement(), '');
}

function handleLocalImageToolFileChange(event) {
  const input = event.currentTarget;
  const form = input.closest('.tool-form');
  const conversionKey = form?.dataset.conversionKey;
  const resultHost = conversionKey
    ? buyerDashboard.querySelector(`[data-results="${conversionKey}"]`)
    : null;
  const statusElement = resultHost?.querySelector('[data-local-image-status]');
  const downloadLink = resultHost?.querySelector('[data-local-image-download]');
  const metadataOutput = resultHost?.querySelector('[data-local-image-metadata-output]');
  const state = localImageStateByConversionKey.get(conversionKey);
  if (state?.downloadUrl) {
    URL.revokeObjectURL(state.downloadUrl);
  }
  localImageStateByConversionKey.delete(conversionKey);

  if (downloadLink) {
    downloadLink.classList.add('hidden');
    downloadLink.removeAttribute('href');
  }
  if (metadataOutput) {
    metadataOutput.value = '';
  }
  if (statusElement) {
    const file = input.files?.[0];
    statusElement.textContent = file
      ? `${['image_annotate_canvas', 'image_privacy_redact', 'image_blur_redact', 'image_object_erase_light'].includes(form?.dataset.conversionKey || '') ? '已选择并等待加载' : '已选择'}：${file.name}`
      : '选择图片后可直接生成预览并导出。';
  }
}

async function handleLocalImageToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;
  const file = form.querySelector('[data-local-image-file-input]')?.files?.[0];
  if (!file) {
    setMessage(getConversionMessageElement(), '先选择一张图片。');
    return;
  }

  const resultHost = buyerDashboard.querySelector(`[data-results="${toolKey}"]`);
  const canvas = resultHost?.querySelector('[data-local-image-preview]');
  const statusElement = resultHost?.querySelector('[data-local-image-status]');
  const downloadLink = resultHost?.querySelector('[data-local-image-download]');
  const metadataOutput = resultHost?.querySelector('[data-local-image-metadata-output]');
  if (!canvas || !resultHost) {
    return;
  }

  try {
    let state = localImageStateByConversionKey.get(toolKey);
    if (!state || state.fileName !== file.name || state.fileSize !== file.size || !state.image) {
      if (state?.image?.__objectUrl) {
        URL.revokeObjectURL(state.image.__objectUrl);
      }
      if (state?.downloadUrl) {
        URL.revokeObjectURL(state.downloadUrl);
      }
      state = {
        image: await loadImageFromFile(file),
        fileName: file.name,
        fileSize: file.size,
        downloadUrl: '',
        annotations: [],
        redactions: [],
        erasePatches: []
      };
      localImageStateByConversionKey.set(toolKey, state);
    }

    const renderOptions = collectLocalImageToolOptions(form, toolKey);
    const layout = renderLocalImagePreview(toolKey, canvas, state, renderOptions);
    if (toolKey === 'image_metadata_view_clear' && metadataOutput) {
      metadataOutput.value = buildBasicImageMetadataSummary({
        fileName: file.name,
        mimeType: file.type || 'image/*',
        fileSize: file.size,
        imageWidth: canvas.width,
        imageHeight: canvas.height,
        lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : ''
      });
    }
    const blob = await exportCanvasBlob(canvas, renderOptions.outputFormat);
    if (state.downloadUrl) {
      URL.revokeObjectURL(state.downloadUrl);
    }
    state.downloadUrl = URL.createObjectURL(blob);

    if (downloadLink) {
      const outputExtension = renderOptions.outputFormat === 'jpg' ? 'jpg' : 'png';
      downloadLink.href = state.downloadUrl;
      downloadLink.download = `${stripFileExtension(file.name)}-${resolveLocalImageToolDownloadSuffix(toolKey)}.${outputExtension}`;
      downloadLink.classList.remove('hidden');
    }
    if (statusElement) {
      statusElement.textContent = describeLocalImageStatus(toolKey, layout, canvas, state);
    }
    setMessage(getConversionMessageElement(), '');
  } catch (error) {
    setMessage(getConversionMessageElement(), error.message || '生成预览失败，请稍后重试。');
  }
}

async function handleLocalImageBatchExport(event) {
  const button = event.currentTarget;
  const form = button.closest('.tool-form');
  const toolKey = form?.dataset.conversionKey || '';
  if (toolKey !== 'image_platform_cover_template') {
    return;
  }

  const file = form.querySelector('[data-local-image-file-input]')?.files?.[0];
  if (!file) {
    setMessage(getConversionMessageElement(), '先选择一张图片。');
    return;
  }

  const resultHost = buyerDashboard.querySelector(`[data-results="${toolKey}"]`);
  const statusElement = resultHost?.querySelector('[data-local-image-status]');
  const downloadLink = resultHost?.querySelector('[data-local-image-download]');
  const renderOptions = collectLocalImageToolOptions(form, toolKey);
  const batchPlan = buildPlatformTemplateBatchPlan({
    sourceFileName: file.name,
    selectedPresetKeys: renderOptions.batchPresetKeys,
    outputFormat: renderOptions.outputFormat
  });
  if (batchPlan.length === 0) {
    setMessage(getConversionMessageElement(), '至少勾选一个平台模板。');
    return;
  }

  try {
    let state = localImageStateByConversionKey.get(toolKey);
    if (!state || state.fileName !== file.name || state.fileSize !== file.size || !state.image) {
      if (state?.image?.__objectUrl) {
        URL.revokeObjectURL(state.image.__objectUrl);
      }
      if (state?.downloadUrl) {
        URL.revokeObjectURL(state.downloadUrl);
      }
      state = {
        image: await loadImageFromFile(file),
        fileName: file.name,
        fileSize: file.size,
        downloadUrl: '',
        annotations: []
      };
      localImageStateByConversionKey.set(toolKey, state);
    }

    if (statusElement) {
      statusElement.textContent = `正在批量导出 ZIP：${batchPlan.length} 个平台模板...`;
    }

    const zipEntries = [];
    for (const entry of batchPlan) {
      const previewCanvas = document.createElement('canvas');
      renderPlatformTemplatePreview(previewCanvas, state.image, {
        ...renderOptions,
        presetKey: entry.presetKey
      });
      const blob = await exportCanvasBlob(previewCanvas, renderOptions.outputFormat);
      zipEntries.push({
        fileName: entry.fileName,
        blob
      });
    }

    const zipBlob = await createStoredZipBlob(zipEntries);
    if (state.downloadUrl) {
      URL.revokeObjectURL(state.downloadUrl);
    }
    state.downloadUrl = URL.createObjectURL(zipBlob);
    if (downloadLink) {
      downloadLink.href = state.downloadUrl;
      downloadLink.download = `${stripFileExtension(file.name)}-platform-batch.zip`;
      downloadLink.classList.remove('hidden');
      downloadLink.click();
    }
    if (statusElement) {
      statusElement.textContent = `ZIP 已生成：${batchPlan.length} 个平台模板`;
    }
    setMessage(getConversionMessageElement(), '');
  } catch (error) {
    setMessage(getConversionMessageElement(), error.message || '批量导出失败，请稍后重试。');
  }
}

async function handleLocalDevToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;

  try {
    const result = await runDevTool(toolKey, collectDevToolOptions(form, toolKey));
    renderDevToolResult(toolKey, result);
    setMessage(getConversionMessageElement(), '');
  } catch (error) {
    setMessage(getConversionMessageElement(), error.message || '处理失败，请检查输入后重试。');
  }
}

async function handleRemoteDevToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;

  try {
    setMessage(getConversionMessageElement(), '正在处理...');
    const response = await fetch('/api/dev-tools/run', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        toolKey,
        toolOptions: collectDevToolOptions(form, toolKey)
      })
    });
    const body = await readApiResponse(response);
    if (!response.ok) {
      setMessage(getConversionMessageElement(), body.message || '处理失败，请稍后重试。');
      return;
    }

    renderDevToolResult(toolKey, body.result || {});
    setMessage(getConversionMessageElement(), '');
  } catch (error) {
    setMessage(getConversionMessageElement(), error.message || '处理失败，请稍后重试。');
  }
}

async function handleRemoteMediaToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;
  const toolItem = resolveBuyerToolByKey(conversionCatalog, toolKey);

  try {
    const payload = new FormData();
    payload.append('toolKey', toolKey);
    payload.append('toolOptions', JSON.stringify(collectMediaToolOptions(form, toolKey)));

    if (toolItem?.kind === 'file_media_tool') {
      const input = form.querySelector('[data-file-input]');
      const files = getSelectedFiles(form, toolKey);
      const accepts = (input?.dataset.accepts || '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      const limits = {
        maxFileSizeMb: toNullableNumber(form.dataset.maxFileSizeMb),
        maxTotalFileSizeMb: toNullableNumber(form.dataset.maxTotalFileSizeMb)
      };

      if (files.length === 0) {
        setMessage(getConversionMessageElement(), '先选择文件。');
        return;
      }

      const validationMessage = validateSelectedFiles(files, accepts, limits);
      if (validationMessage) {
        setMessage(getConversionMessageElement(), validationMessage);
        return;
      }

      for (const file of files) {
        payload.append('files', file, file.name);
      }
    }

    renderUploadProgress(toolKey, {
      stage: 'uploading',
      percent: 0,
      detail: getUploadStageText('uploading')
    });

    const response = await uploadWithProgress('/api/media-tools/run', payload, (progressEvent) => {
      if (!progressEvent.lengthComputable) {
        return;
      }

      const percent = progressEvent.total > 0 ? (progressEvent.loaded / progressEvent.total) * 100 : 0;
      renderUploadProgress(toolKey, {
        stage: 'uploading',
        percent,
        detail: getUploadStageText('uploading')
      });
    });

    renderUploadProgress(toolKey, {
      stage: 'processing',
      percent: 100,
      detail: getUploadStageText('processing')
    });

    const body = await readApiResponse(response);
    if (!response.ok) {
      conversionSummaries.delete(toolKey);
      renderUploadProgress(toolKey, {
        stage: 'error',
        percent: 100,
        detail: body.message || getUploadStageText('error')
      });
      setMessage(getConversionMessageElement(), body.message || '处理失败，请稍后重试。');
      return;
    }

    conversionSummaries.set(toolKey, body.result?.summary || null);
    clearUploadProgress(toolKey);
    renderResults(toolKey, body.result?.files || []);
    setMessage(getConversionMessageElement(), '');
  } catch (error) {
    renderUploadProgress(toolKey, {
      stage: 'error',
      percent: 100,
      detail: getUploadStageText('error')
    });
    setMessage(getConversionMessageElement(), error.message || '处理失败，请稍后重试。');
  }
}

async function handleLocalMediaToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;
  const resultHost = buyerDashboard.querySelector(`[data-results="${toolKey}"]`);
  if (!resultHost) {
    return;
  }

  try {
    if (toolKey === 'media_audio_player') {
      const file = form.querySelector('[data-media-file-input]')?.files?.[0];
      if (!file) {
        setMessage(getConversionMessageElement(), '先选择音频文件。');
        return;
      }

      const audioElement = resultHost.querySelector('[data-media-audio-preview]');
      const waveformCanvas = resultHost.querySelector('[data-media-waveform]');
      const statusElement = resultHost.querySelector('[data-media-status]');
      const objectUrl = URL.createObjectURL(file);
      if (audioElement) {
        audioElement.src = objectUrl;
        audioElement.classList.remove('hidden');
      }
      if (statusElement) {
        statusElement.textContent = `已加载：${file.name}`;
      }

      if (waveformCanvas && window.AudioContext) {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new window.AudioContext();
        try {
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
          drawWaveform(waveformCanvas, collectWaveformPeaks(audioBuffer.getChannelData(0), 160));
        } finally {
          await audioContext.close();
        }
      }

      setMessage(getConversionMessageElement(), '音频已加载，可以直接试听。');
      return;
    }

    if (toolKey === 'media_video_speed_preview') {
      const file = form.querySelector('[data-media-file-input]')?.files?.[0];
      if (!file) {
        setMessage(getConversionMessageElement(), '先选择视频文件。');
        return;
      }

      const videoElement = resultHost.querySelector('[data-media-video-preview]');
      const statusElement = resultHost.querySelector('[data-media-status]');
      const playbackRate = Number.parseFloat(form.querySelector('[data-media-playback-rate]')?.value || '1') || 1;
      if (videoElement) {
        videoElement.src = URL.createObjectURL(file);
        videoElement.playbackRate = playbackRate;
        videoElement.classList.remove('hidden');
      }
      if (statusElement) {
        statusElement.textContent = `已加载：${file.name}，当前速度 ${playbackRate}x`;
      }
      setMessage(getConversionMessageElement(), '视频已加载，可以直接预览。');
      return;
    }

    const durationSeconds = Number.parseFloat(form.querySelector('[data-media-duration]')?.value || '0') || 0;
    const volume = Number.parseFloat(form.querySelector('[data-media-volume]')?.value || '0.5') || 0.5;
    const bytes = toolKey === 'media_tone_generator'
      ? createToneWavBytes({
          frequencyHz: Number.parseFloat(form.querySelector('[data-media-frequency]')?.value || '440') || 440,
          durationSeconds,
          volume
        })
      : createWhiteNoiseWavBytes({
          durationSeconds,
          volume
        });

    const objectUrl = createObjectUrlFromBytes(bytes);
    const audioElement = resultHost.querySelector('[data-media-audio-preview]');
    const downloadLink = resultHost.querySelector('[data-media-download-link]');
    const statusElement = resultHost.querySelector('[data-media-status]');
    if (audioElement) {
      audioElement.src = objectUrl;
      audioElement.classList.remove('hidden');
    }
    if (downloadLink) {
      downloadLink.href = objectUrl;
      downloadLink.download = `${toolKey === 'media_tone_generator' ? 'tone-generator' : 'white-noise'}.wav`;
      downloadLink.classList.remove('hidden');
    }
    if (statusElement) {
      statusElement.textContent = `已生成 ${durationSeconds || 0} 秒音频，可直接试听或下载。`;
    }
    setMessage(getConversionMessageElement(), '音频已生成。');
  } catch (error) {
    setMessage(getConversionMessageElement(), error.message || '处理失败，请稍后重试。');
  }
}

function collectDevToolOptions(form, toolKey) {
  const sourceText = form.querySelector('[data-source-text]')?.value || '';
  const targetUrl = form.querySelector('[data-target-url]')?.value || '';
  const certificateText = form.querySelector('[data-certificate-text]')?.value || '';
  const keywordText = form.querySelector('[data-keyword-text]')?.value || '';
  const base64Mode = form.querySelector('[data-base64-mode]')?.value || 'encode';
  const basicAuthUsername = form.querySelector('[data-basic-auth-username]')?.value || '';
  const basicAuthPassword = form.querySelector('[data-basic-auth-password]')?.value || '';
  const urlMode = form.querySelector('[data-url-mode]')?.value || 'encode';
  const hashAlgorithm = form.querySelector('[data-hash-algorithm]')?.value || 'sha256';
  const timestampMode = form.querySelector('[data-timestamp-mode]')?.value || 'to_readable';
  const cronStartTime = form.querySelector('[data-cron-start-time]')?.value || '';
  const fromBase = form.querySelector('[data-from-base]')?.value || '';
  const toBase = form.querySelector('[data-to-base]')?.value || '';
  const codeBase = form.querySelector('[data-code-base]')?.value || '';
  const htmlEntityMode = form.querySelector('[data-html-entity-mode]')?.value || 'encode';
  const jsonFieldName = form.querySelector('[data-json-field-name]')?.value || '';
  const jsonPath = form.querySelector('[data-json-path]')?.value || '';
  const robotsUserAgent = form.querySelector('[data-robots-user-agent]')?.value || '';
  const robotsAllow = form.querySelector('[data-robots-allow]')?.value || '';
  const robotsDisallow = form.querySelector('[data-robots-disallow]')?.value || '';
  const robotsSitemap = form.querySelector('[data-robots-sitemap]')?.value || '';
  const uuidCount = form.querySelector('[data-uuid-count]')?.value || '';
  const phpArrayStyle = form.querySelector('[data-php-array-style]')?.value || 'short';
  const jsExportName = form.querySelector('[data-js-export-name]')?.value || '';
  const jsonMergeMode = form.querySelector('[data-json-merge-mode]')?.value || 'object_merge';
  const keyValueSeparator = form.querySelector('[data-key-value-separator]')?.value || '=';
  const rsaKeySize = form.querySelector('[data-rsa-key-size]')?.value || '2048';
  const passwordHashCost = form.querySelector('[data-password-hash-cost]')?.value || '10';
  const formatMode = form.querySelector('[data-format-mode]')?.value || 'beautify';
  const cleanupMode = form.querySelector('[data-cleanup-mode]')?.value || 'clear_css_js';
  const requestCount = form.querySelector('[data-request-count]')?.value || '10';
  const requestIntervalMs = form.querySelector('[data-request-interval-ms]')?.value || '300';
  const requestQueryParams = form.querySelector('[data-api-query-params]')?.value || '';
  const compareJsonText = form.querySelector('[data-compare-json-text]')?.value || '';
  const jsonClearMode = form.querySelector('[data-json-clear-mode]')?.value || 'empty_string';
  const jsonSliceSize = form.querySelector('[data-json-slice-size]')?.value || '2';
  const urlSetParamsText = form.querySelector('[data-url-set-params]')?.value || '';
  const metaTitle = form.querySelector('[data-meta-title]')?.value || '';
  const metaDescription = form.querySelector('[data-meta-description]')?.value || '';
  const metaKeywords = form.querySelector('[data-meta-keywords]')?.value || '';
  const metaCanonical = form.querySelector('[data-meta-canonical]')?.value || '';
  const metaRobots = form.querySelector('[data-meta-robots]')?.value || '';
  const jsObjectMode = form.querySelector('[data-js-object-mode]')?.value || 'same_value';
  const jsImportName = form.querySelector('[data-js-import-name]')?.value || '';
  const inlineStyleNames = form.querySelector('[data-inline-style-names]')?.value || '';
  const cookieDomain = form.querySelector('[data-cookie-domain]')?.value || '';
  const cookiePath = form.querySelector('[data-cookie-path]')?.value || '/';
  const generateCount = form.querySelector('[data-generate-count]')?.value || '20';
  const macSeparator = form.querySelector('[data-mac-separator]')?.value ?? ':';

  return {
    sourceText,
    targetUrl,
    certificateText,
    keywordText,
    base64Mode,
    basicAuthUsername,
    basicAuthPassword,
    urlMode,
    hashAlgorithm,
    timestampMode,
    cronStartTime,
    fromBase,
    toBase,
    codeBase,
    htmlEntityMode,
    jsonFieldName,
    jsonPath,
    robotsUserAgent,
    robotsAllow,
    robotsDisallow,
    robotsSitemap,
    phpArrayStyle,
    jsExportName,
    jsonMergeMode,
    keyValueSeparator,
    rsaKeySize,
    passwordHashCost,
    formatMode,
    cleanupMode,
    requestCount,
    requestIntervalMs,
    requestQueryParams,
    compareJsonText,
    jsonClearMode,
    jsonSliceSize,
    urlSetParamsText,
    metaTitle,
    metaDescription,
    metaKeywords,
    metaCanonical,
    metaRobots,
    jsObjectMode,
    jsImportName,
    inlineStyleNames,
    cookieDomain,
    cookiePath,
    generateCount,
    macSeparator,
    browserUserAgent: navigator.userAgent || '',
    browserPlatform: navigator.platform || '',
    browserLanguage: navigator.language || '',
    browserLanguages: Array.isArray(navigator.languages) ? navigator.languages : [],
    browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    browserCookieEnabled: navigator.cookieEnabled,
    browserDoNotTrack: navigator.doNotTrack || '',
    browserHardwareConcurrency: navigator.hardwareConcurrency || 0,
    browserDeviceMemory: navigator.deviceMemory || 0,
    browserMaxTouchPoints: navigator.maxTouchPoints || 0,
    browserOnline: navigator.onLine,
    screenInfo: {
      width: window.screen?.width || 0,
      height: window.screen?.height || 0,
      availWidth: window.screen?.availWidth || 0,
      availHeight: window.screen?.availHeight || 0,
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen?.colorDepth || 0
    },
    viewportInfo: {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0
    },
    uuidCount,
    toolKey
  };
}

function collectMediaToolOptions(form, toolKey) {
  if (toolKey === 'media_text_to_speech') {
    return {
      sourceText: form.querySelector('[data-media-source-text]')?.value || '',
      language: form.querySelector('[data-media-language]')?.value || 'zh',
      outputFormat: form.querySelector('[data-media-output-format]')?.value || 'mp3'
    };
  }

  if (toolKey === 'media_audio_clip') {
    return {
      startTimeText: form.querySelector('[data-media-start-time]')?.value || '',
      endTimeText: form.querySelector('[data-media-end-time]')?.value || '',
      outputFormat: form.querySelector('[data-media-output-format]')?.value || 'mp3'
    };
  }

  if (toolKey === 'media_audio_merge') {
    return {
      outputFormat: form.querySelector('[data-media-output-format]')?.value || 'mp3'
    };
  }

  if (toolKey === 'media_audio_to_text') {
    return {
      language: form.querySelector('[data-media-language]')?.value || 'auto',
      outputFormat: 'txt'
    };
  }

  return {};
}

function collectLocalImageToolOptions(form, toolKey) {
  if (toolKey === 'image_social_cover_pad') {
    return {
      targetRatio: form.querySelector('[data-social-cover-ratio]')?.value || '1:1',
      backgroundMode: form.querySelector('[data-social-cover-background-mode]')?.value || 'solid',
      backgroundColor: form.querySelector('[data-background-color]')?.value || '#ffffff',
      paddingPercent: 8,
      blurRadius: 28,
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_blur_background_fill') {
    return {
      targetRatio: form.querySelector('[data-social-cover-ratio]')?.value || '1:1',
      backgroundMode: 'blur',
      backgroundColor: '#ffffff',
      paddingPercent: 8,
      blurRadius: Number.parseInt(form.querySelector('[data-image-blur-radius]')?.value || '28', 10) || 28,
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_add_border_frame') {
    return {
      borderStyle: form.querySelector('[data-image-border-style]')?.value || 'solid',
      borderWidth: Number.parseInt(form.querySelector('[data-image-border-width]')?.value || '18', 10) || 18,
      shadowStrength: Number.parseInt(form.querySelector('[data-image-shadow-strength]')?.value || '18', 10) || 18,
      cornerRadius: Number.parseInt(form.querySelector('[data-image-corner-radius]')?.value || '36', 10) || 36,
      borderColor: form.querySelector('[data-image-border-color]')?.value || '#2563eb',
      gradientStartColor: form.querySelector('[data-image-gradient-start]')?.value || '#2563eb',
      gradientEndColor: form.querySelector('[data-image-gradient-end]')?.value || '#7c3aed',
      padding: Number.parseInt(form.querySelector('[data-image-padding]')?.value || '60', 10) || 60,
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_platform_cover_template') {
    return {
      presetKey: form.querySelector('[data-image-template-preset]')?.value || 'xiaohongshu_cover',
      fitMode: form.querySelector('[data-image-fit-mode]')?.value || 'contain',
      backgroundMode: form.querySelector('[data-image-template-bg-mode]')?.value || 'solid',
      backgroundColor: form.querySelector('[data-image-template-bg-color]')?.value || '#f3f4f6',
      batchPresetKeys: Array.from(form.querySelectorAll('[data-image-batch-template-option]:checked'))
        .map((input) => input.value)
        .filter(Boolean),
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_flip_mirror') {
    return {
      flipMode: form.querySelector('[data-image-flip-mode]')?.value || 'horizontal',
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_metadata_view_clear') {
    return {
      metadataMode: form.querySelector('[data-image-metadata-mode]')?.value || 'view',
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_blur_redact') {
    return {
      redactMode: form.querySelector('[data-image-redact-mode]')?.value || 'blur',
      redactSize: Number.parseInt(form.querySelector('[data-image-redact-size]')?.value || '160', 10) || 160,
      redactBlurRadius: 18,
      redactMosaicBlockSize: 14,
      redactFillColor: '#111111',
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_rotate_adjust') {
    return {
      angle: Number.parseFloat(form.querySelector('[data-image-rotate-angle]')?.value || '90') || 90,
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_object_erase_light') {
    return {
      eraseBrushSize: Number.parseInt(form.querySelector('[data-image-erase-brush-size]')?.value || '64', 10) || 64,
      eraseSampleOffset: Number.parseInt(form.querySelector('[data-image-erase-sample-offset]')?.value || '20', 10) || 20,
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_annotate_canvas') {
    return {
      annotationMode: form.querySelector('[data-image-annotation-mode]')?.value || 'arrow',
      annotationColor: form.querySelector('[data-image-annotation-color]')?.value || '#ff3355',
      annotationLineWidth: Number.parseInt(form.querySelector('[data-image-annotation-line-width]')?.value || '6', 10) || 6,
      annotationShapeSize: Number.parseInt(form.querySelector('[data-image-annotation-size]')?.value || '96', 10) || 96,
      annotationArrowDirection: form.querySelector('[data-image-arrow-direction]')?.value || 'right_up',
      annotationMosaicBlockSize: Number.parseInt(form.querySelector('[data-image-annotation-mosaic]')?.value || '14', 10) || 14,
      annotationLabel: form.querySelector('[data-image-annotation-label]')?.value || '',
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  if (toolKey === 'image_privacy_redact') {
    return {
      redactMode: form.querySelector('[data-image-redact-mode]')?.value || 'mosaic',
      redactSize: Number.parseInt(form.querySelector('[data-image-redact-size]')?.value || '160', 10) || 160,
      redactBlurRadius: 18,
      redactMosaicBlockSize: 14,
      redactFillColor: '#111111',
      outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
    };
  }

  return {
    titleText: form.querySelector('[data-image-text-title]')?.value || '',
    subtitleText: form.querySelector('[data-image-text-subtitle]')?.value || '',
    badgeText: form.querySelector('[data-image-text-badge]')?.value || '',
    layoutPreset: form.querySelector('[data-image-layout-preset]')?.value || 'top_banner',
    titleSize: Number.parseInt(form.querySelector('[data-image-title-size]')?.value || '88', 10) || 88,
    subtitleSize: Number.parseInt(form.querySelector('[data-image-subtitle-size]')?.value || '40', 10) || 40,
    badgeSize: Number.parseInt(form.querySelector('[data-image-badge-size]')?.value || '28', 10) || 28,
    textColor: form.querySelector('[data-image-text-color]')?.value || '#ffffff',
    badgeTextColor: form.querySelector('[data-image-badge-text-color]')?.value || '#ffffff',
    strokeColor: form.querySelector('[data-image-stroke-color]')?.value || '#111827',
    strokeWidth: Number.parseInt(form.querySelector('[data-image-stroke-width]')?.value || '4', 10) || 4,
    overlayColor: form.querySelector('[data-image-overlay-color]')?.value || '#111827',
    overlayOpacity: 0.38,
    badgeBackgroundColor: form.querySelector('[data-image-badge-bg-color]')?.value || '#ef4444',
    outputFormat: form.querySelector('[data-image-output-format]')?.value || 'png'
  };
}

function syncLocalTextDownload(resultHost, toolKey, downloadFile) {
  const downloadLink = resultHost?.querySelector('[data-local-text-download], [data-text-download-link]');
  const previousUrl = localTextDownloadStateByConversionKey.get(toolKey);
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl);
    localTextDownloadStateByConversionKey.delete(toolKey);
  }

  if (!downloadLink) {
    return;
  }

  if (!downloadFile?.content) {
    downloadLink.classList.add('hidden');
    downloadLink.removeAttribute('href');
    return;
  }

  const blob = new Blob([downloadFile.content], {
    type: downloadFile.mimeType || 'text/plain;charset=utf-8'
  });
  const objectUrl = URL.createObjectURL(blob);
  localTextDownloadStateByConversionKey.set(toolKey, objectUrl);
  downloadLink.href = objectUrl;
  downloadLink.download = downloadFile.fileName || 'result.txt';
  downloadLink.classList.remove('hidden');
}

function renderLocalImagePreview(toolKey, canvas, state, renderOptions) {
  if (toolKey === 'image_social_cover_pad') {
    return renderSocialCoverPreview(canvas, state.image, renderOptions);
  }
  if (toolKey === 'image_blur_background_fill') {
    return renderSocialCoverPreview(canvas, state.image, renderOptions);
  }
  if (toolKey === 'image_flip_mirror') {
    return renderFlipMirrorPreview(canvas, state.image, renderOptions);
  }
  if (toolKey === 'image_metadata_view_clear') {
    canvas.width = state.image.naturalWidth || state.image.width;
    canvas.height = state.image.naturalHeight || state.image.height;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(state.image, 0, 0, canvas.width, canvas.height);
    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      metadataMode: renderOptions.metadataMode
    };
  }
  if (toolKey === 'image_add_border_frame') {
    return renderBorderFramePreview(canvas, state.image, renderOptions);
  }
  if (toolKey === 'image_platform_cover_template') {
    const presetMap = getPlatformTemplatePresetMap();
    const normalizedOptions = {
      ...renderOptions,
      presetKey: Object.hasOwn(presetMap, renderOptions.presetKey) ? renderOptions.presetKey : 'xiaohongshu_cover'
    };
    return renderPlatformTemplatePreview(canvas, state.image, normalizedOptions);
  }
  if (toolKey === 'image_annotate_canvas') {
    return renderAnnotatedImagePreview(canvas, state.image, state.annotations || [], renderOptions);
  }
  if (toolKey === 'image_privacy_redact') {
    return renderPrivacyRedactionPreview(canvas, state.image, state.redactions || []);
  }
  if (toolKey === 'image_blur_redact') {
    return renderPrivacyRedactionPreview(canvas, state.image, state.redactions || []);
  }
  if (toolKey === 'image_rotate_adjust') {
    return renderRotateAdjustPreview(canvas, state.image, renderOptions);
  }
  if (toolKey === 'image_object_erase_light') {
    return renderLightErasePreview(canvas, state.image, state.erasePatches || []);
  }
  return renderImageTextPreview(canvas, state.image, renderOptions);
}

function handleLocalImageCanvasClick(event) {
  const canvas = event.currentTarget;
  const resultHost = canvas.closest('[data-results]');
  const conversionKey = resultHost?.dataset.results || '';
  const form = buyerDashboard.querySelector(`form[data-conversion-key="${conversionKey}"]`);
  const state = localImageStateByConversionKey.get(conversionKey);
  if (!form || !state?.image) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const options = collectLocalImageToolOptions(form, conversionKey);
  if (conversionKey === 'image_privacy_redact' || conversionKey === 'image_blur_redact') {
    state.redactions = state.redactions || [];
    state.redactions.push(createPrivacyRedactionFromCanvasPoint({
      mode: options.redactMode,
      pointX: Math.round((event.clientX - rect.left) * scaleX),
      pointY: Math.round((event.clientY - rect.top) * scaleY),
      shapeSize: options.redactSize,
      blurRadius: options.redactBlurRadius,
      mosaicBlockSize: options.redactMosaicBlockSize,
      fillColor: options.redactFillColor
    }));
    void redrawPrivacyRedactionImage(conversionKey);
    return;
  }
  if (conversionKey === 'image_object_erase_light') {
    state.erasePatches = state.erasePatches || [];
    state.erasePatches.push(createErasePatchFromCanvasPoint({
      pointX: Math.round((event.clientX - rect.left) * scaleX),
      pointY: Math.round((event.clientY - rect.top) * scaleY),
      brushSize: options.eraseBrushSize,
      sampleOffset: options.eraseSampleOffset
    }));
    void redrawEraseImage(conversionKey);
    return;
  }
  state.annotations = state.annotations || [];
  state.annotations.push(createAnnotationFromCanvasPoint({
    mode: options.annotationMode,
    pointX: Math.round((event.clientX - rect.left) * scaleX),
    pointY: Math.round((event.clientY - rect.top) * scaleY),
    color: options.annotationColor,
    lineWidth: options.annotationLineWidth,
    labelText: options.annotationMode === 'number'
      ? (options.annotationLabel || String(state.annotations.length + 1))
      : options.annotationLabel,
    shapeSize: options.annotationShapeSize,
    arrowDirection: options.annotationArrowDirection,
    mosaicBlockSize: options.annotationMosaicBlockSize
  }));
  void redrawAnnotatedImage(conversionKey);
}

async function redrawAnnotatedImage(conversionKey) {
  const state = localImageStateByConversionKey.get(conversionKey);
  const canvas = buyerDashboard.querySelector(`[data-results="${conversionKey}"] [data-local-image-preview]`);
  const form = buyerDashboard.querySelector(`form[data-conversion-key="${conversionKey}"]`);
  const resultHost = buyerDashboard.querySelector(`[data-results="${conversionKey}"]`);
  const statusElement = resultHost?.querySelector('[data-local-image-status]');
  const downloadLink = resultHost?.querySelector('[data-local-image-download]');
  if (!state?.image || !canvas || !form) {
    return;
  }
  const options = collectLocalImageToolOptions(form, conversionKey);
  const layout = renderAnnotatedImagePreview(canvas, state.image, state.annotations || [], options);
  const blob = await exportCanvasBlob(canvas, options.outputFormat);
  if (state.downloadUrl) {
    URL.revokeObjectURL(state.downloadUrl);
  }
  state.downloadUrl = URL.createObjectURL(blob);
  if (downloadLink) {
    const outputExtension = options.outputFormat === 'jpg' ? 'jpg' : 'png';
    downloadLink.href = state.downloadUrl;
    downloadLink.download = `${stripFileExtension(state.fileName)}-${resolveLocalImageToolDownloadSuffix(conversionKey)}.${outputExtension}`;
    downloadLink.classList.remove('hidden');
  }
  if (statusElement) {
    statusElement.textContent = describeLocalImageStatus(conversionKey, layout, canvas, state);
  }
}

function handleLocalImageUndo(event) {
  const resultHost = event.currentTarget.closest('[data-results]');
  const conversionKey = resultHost?.dataset.results || '';
  const state = localImageStateByConversionKey.get(conversionKey);
  if (conversionKey === 'image_privacy_redact' || conversionKey === 'image_blur_redact') {
    if (!state?.redactions?.length) {
      return;
    }
    state.redactions.pop();
    void redrawPrivacyRedactionImage(conversionKey);
    return;
  }
  if (conversionKey === 'image_object_erase_light') {
    if (!state?.erasePatches?.length) {
      return;
    }
    state.erasePatches.pop();
    void redrawEraseImage(conversionKey);
    return;
  }
  if (!state?.annotations?.length) {
    return;
  }
  state.annotations.pop();
  void redrawAnnotatedImage(conversionKey);
}

function handleLocalImageClear(event) {
  const resultHost = event.currentTarget.closest('[data-results]');
  const conversionKey = resultHost?.dataset.results || '';
  const state = localImageStateByConversionKey.get(conversionKey);
  if (!state) {
    return;
  }
  if (conversionKey === 'image_privacy_redact' || conversionKey === 'image_blur_redact') {
    state.redactions = [];
    void redrawPrivacyRedactionImage(conversionKey);
    return;
  }
  if (conversionKey === 'image_object_erase_light') {
    state.erasePatches = [];
    void redrawEraseImage(conversionKey);
    return;
  }
  state.annotations = [];
  void redrawAnnotatedImage(conversionKey);
}

async function redrawPrivacyRedactionImage(conversionKey) {
  const state = localImageStateByConversionKey.get(conversionKey);
  const canvas = buyerDashboard.querySelector(`[data-results="${conversionKey}"] [data-local-image-preview]`);
  const form = buyerDashboard.querySelector(`form[data-conversion-key="${conversionKey}"]`);
  const resultHost = buyerDashboard.querySelector(`[data-results="${conversionKey}"]`);
  const statusElement = resultHost?.querySelector('[data-local-image-status]');
  const downloadLink = resultHost?.querySelector('[data-local-image-download]');
  if (!state?.image || !canvas || !form) {
    return;
  }
  const options = collectLocalImageToolOptions(form, conversionKey);
  const layout = renderPrivacyRedactionPreview(canvas, state.image, state.redactions || []);
  const blob = await exportCanvasBlob(canvas, options.outputFormat);
  if (state.downloadUrl) {
    URL.revokeObjectURL(state.downloadUrl);
  }
  state.downloadUrl = URL.createObjectURL(blob);
  if (downloadLink) {
    const outputExtension = options.outputFormat === 'jpg' ? 'jpg' : 'png';
    downloadLink.href = state.downloadUrl;
    downloadLink.download = `${stripFileExtension(state.fileName)}-${resolveLocalImageToolDownloadSuffix(conversionKey)}.${outputExtension}`;
    downloadLink.classList.remove('hidden');
  }
  if (statusElement) {
    statusElement.textContent = `已添加 ${layout.redactionCount} 个区域，点击画布可继续处理。`;
  }
}

async function redrawEraseImage(conversionKey) {
  const state = localImageStateByConversionKey.get(conversionKey);
  const canvas = buyerDashboard.querySelector(`[data-results="${conversionKey}"] [data-local-image-preview]`);
  const form = buyerDashboard.querySelector(`form[data-conversion-key="${conversionKey}"]`);
  const resultHost = buyerDashboard.querySelector(`[data-results="${conversionKey}"]`);
  const statusElement = resultHost?.querySelector('[data-local-image-status]');
  const downloadLink = resultHost?.querySelector('[data-local-image-download]');
  if (!state?.image || !canvas || !form) {
    return;
  }
  const options = collectLocalImageToolOptions(form, conversionKey);
  const layout = renderLightErasePreview(canvas, state.image, state.erasePatches || []);
  const blob = await exportCanvasBlob(canvas, options.outputFormat);
  if (state.downloadUrl) {
    URL.revokeObjectURL(state.downloadUrl);
  }
  state.downloadUrl = URL.createObjectURL(blob);
  if (downloadLink) {
    const outputExtension = options.outputFormat === 'jpg' ? 'jpg' : 'png';
    downloadLink.href = state.downloadUrl;
    downloadLink.download = `${stripFileExtension(state.fileName)}-${resolveLocalImageToolDownloadSuffix(conversionKey)}.${outputExtension}`;
    downloadLink.classList.remove('hidden');
  }
  if (statusElement) {
    statusElement.textContent = `已添加 ${layout.eraseCount} 处涂抹消除，点击画布可继续覆盖。`;
  }
}

function resolveLocalImageToolDownloadSuffix(toolKey) {
  const suffixMap = {
    image_add_text: 'text',
    image_add_border_frame: 'bordered',
    image_platform_cover_template: 'template',
    image_annotate_canvas: 'annotated',
    image_flip_mirror: 'flipped',
    image_metadata_view_clear: 'metadata',
    image_blur_redact: 'blur-redact',
    image_rotate_adjust: 'rotated',
    image_object_erase_light: 'erased',
    image_social_cover_pad: 'social-cover',
    image_privacy_redact: 'redacted',
    image_blur_background_fill: 'blur-fill'
  };
  return suffixMap[toolKey] || 'image';
}

function describeLocalImageStatus(toolKey, layout, canvas, state) {
  if (toolKey === 'image_add_text') {
    return `预览已生成：${layout.blocks.length} 个文字块，画布 ${canvas.width} x ${canvas.height}`;
  }
  if (toolKey === 'image_add_border_frame') {
    return `预览已生成：边框画布 ${layout.canvasSize.width} x ${layout.canvasSize.height}`;
  }
  if (toolKey === 'image_platform_cover_template') {
    return `预览已生成：模板画布 ${layout.canvasSize.width} x ${layout.canvasSize.height}`;
  }
  if (toolKey === 'image_annotate_canvas') {
    return `已加载画布：当前 ${layout.annotationCount} 个标注，点击预览区域可继续添加。`;
  }
  if (toolKey === 'image_flip_mirror') {
    return `预览已生成：已按 ${layout.flipMode} 模式翻转。`;
  }
  if (toolKey === 'image_metadata_view_clear') {
    return layout.metadataMode === 'clear'
      ? '已读取元数据并生成清理后导出图。'
      : '已读取元数据，可查看图片基本信息。';
  }
  if (toolKey === 'image_rotate_adjust') {
    return `预览已生成：旋转角度 ${layout.angle}°，画布 ${layout.canvasSize.width} x ${layout.canvasSize.height}`;
  }
  if (toolKey === 'image_social_cover_pad') {
    return `预览已生成：主体区域 ${layout.imageRect.width} x ${layout.imageRect.height}，画布 ${canvas.width} x ${canvas.height}`;
  }
  if (toolKey === 'image_blur_background_fill') {
    return `预览已生成：主体区域 ${layout.imageRect.width} x ${layout.imageRect.height}，画布 ${canvas.width} x ${canvas.height}`;
  }
  if (toolKey === 'image_privacy_redact') {
    return `已添加 ${layout.redactionCount} 个打码区域，点击画布可继续打码。`;
  }
  return `预览已生成：画布 ${canvas.width} x ${canvas.height}`;
}

function handleRotatePresetClick(event) {
  const angle = event.currentTarget.dataset.imageRotatePreset || '';
  const form = event.currentTarget.closest('.tool-form');
  const input = form?.querySelector('[data-image-rotate-angle]');
  if (input) {
    input.value = angle;
  }
}

function renderDevToolResult(toolKey, result) {
  const resultHost = buyerDashboard.querySelector(`[data-results="${toolKey}"]`);
  const outputElement = resultHost?.querySelector('[data-output-text]');
  if (outputElement) {
    outputElement.value = result.outputText || '';
  }

  if (toolKey === 'dev_html_preview') {
    const previewFrame = resultHost?.querySelector('[data-html-preview-frame]');
    if (previewFrame) {
      previewFrame.srcdoc = result.outputText || '';
    }
  }
}

function renderTextToolSummary(resultHost, summary) {
  const summaryHost = resultHost?.querySelector('[data-text-tool-summary]');
  if (!summaryHost) {
    return;
  }

  if (!summary) {
    summaryHost.classList.add('hidden');
    summaryHost.innerHTML = '';
    return;
  }

  summaryHost.classList.remove('hidden');
  summaryHost.innerHTML = `
    <span class="text-tool-summary-pill">字符数：${summary.totalChars}</span>
    <span class="text-tool-summary-pill">非空白：${summary.nonWhitespaceChars}</span>
    <span class="text-tool-summary-pill">行数：${summary.lineCount}</span>
  `;
}

async function handleCopyTextToolOutput(event) {
  const button = event.currentTarget;
  const resultHost = button.closest('.tool-results');
  const outputText = resultHost?.querySelector('[data-output-text]')?.value || '';
  if (!outputText) {
    setMessage(getConversionMessageElement(), '当前还没有可复制的结果。');
    return;
  }

  await navigator.clipboard.writeText(outputText);
  setMessage(getConversionMessageElement(), '结果已复制到剪贴板。');
}

function handleFileInputChange(event) {
  const input = event.currentTarget;
  const form = input.closest('.tool-form');
  if (!form) {
    return;
  }

  const conversionKey = form.dataset.conversionKey;
  selectedFilesByConversionKey.set(conversionKey, Array.from(input.files || []));
  void renderPageThumbnails(form, conversionKey);
  renderSelectedFileList(form, conversionKey);
}

function handleWatermarkTypeChange(event) {
  const form = event.currentTarget.closest('.tool-form');
  if (!form) {
    return;
  }

  syncWatermarkOptionVisibility(form);
}

function syncWatermarkOptionVisibility(form) {
  const watermarkType = form.querySelector('[data-watermark-type]')?.value || 'text';
  form.querySelector('[data-watermark-text-options]')?.classList.toggle('hidden', watermarkType !== 'text');
  form.querySelector('[data-watermark-image-options]')?.classList.toggle('hidden', watermarkType !== 'image');
}

function handleStampSourceTypeChange(event) {
  const form = event.currentTarget.closest('.tool-form');
  if (!form) {
    return;
  }

  syncStampSourceVisibility(form);
}

function syncStampSourceVisibility(form) {
  const stampSourceType = form.querySelector('[data-stamp-source-type]')?.value || 'image';
  form.querySelector('[data-stamp-image-options]')?.classList.toggle('hidden', stampSourceType !== 'image');
  form.querySelector('[data-stamp-draw-options]')?.classList.toggle('hidden', stampSourceType !== 'draw');
}

function handleProtectModeChange(event) {
  const form = event.currentTarget.closest('.tool-form');
  if (!form) {
    return;
  }

  syncProtectModeVisibility(form);
}

function syncProtectModeVisibility(form) {
  const mode = form.querySelector('[data-protect-mode]')?.value || 'protect';
  form.querySelector('[data-protect-fields]')?.classList.toggle('hidden', mode !== 'protect');
  form.querySelector('[data-unlock-fields]')?.classList.toggle('hidden', mode !== 'unlock');
}

function renderSelectedFileList(form, conversionKey) {
  const host = form.querySelector('[data-selected-file-list]');
  if (!host) {
    return;
  }

  host.innerHTML = createSelectedFileOrderMarkup(
    selectedFilesByConversionKey.get(conversionKey) || []
  );
}

function getSelectedFiles(form, conversionKey) {
  const toolItem = resolveBuyerToolByKey(conversionCatalog, conversionKey);
  if (conversionKey === 'merge_pdf' || toolItem?.allowMultipleFiles) {
    return selectedFilesByConversionKey.get(conversionKey) || [];
  }

  return Array.from(form.querySelector('[data-file-input]')?.files || []);
}

function currentConversionSummary(conversionKey) {
  return conversionSummaries.get(conversionKey) || null;
}

async function renderPageThumbnails(form, conversionKey) {
  if (!['delete_pages_pdf', 'reorder_pages_pdf'].includes(conversionKey)) {
    return;
  }

  const file = form.querySelector('[data-file-input]')?.files?.[0];
  const deleteGrid = form.querySelector('[data-delete-thumbnail-grid]');
  const reorderGrid = form.querySelector('[data-reorder-thumbnail-grid]');

  if (!file) {
    if (deleteGrid) {
      deleteGrid.innerHTML = '';
    }
    if (reorderGrid) {
      reorderGrid.innerHTML = '';
    }
    thumbnailStateByConversionKey.delete(conversionKey);
    return;
  }

  const pages = await loadPdfPagePreviews(file);
  thumbnailStateByConversionKey.set(conversionKey, {
    pages,
    selectedPages: new Set()
  });

  renderDeleteThumbnailGrid(form, conversionKey);
  renderReorderThumbnailGrid(form, conversionKey);
}

function renderDeleteThumbnailGrid(form, conversionKey) {
  const grid = form.querySelector('[data-delete-thumbnail-grid]');
  if (!grid) {
    return;
  }

  const state = thumbnailStateByConversionKey.get(conversionKey);
  if (!state) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = createDeleteThumbnailMarkup(state.pages, state.selectedPages);
}

function renderReorderThumbnailGrid(form, conversionKey) {
  const grid = form.querySelector('[data-reorder-thumbnail-grid]');
  if (!grid) {
    return;
  }

  const state = thumbnailStateByConversionKey.get(conversionKey);
  if (!state) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = createReorderThumbnailMarkup(state.pages);
  for (const card of grid.querySelectorAll('[data-reorder-page]')) {
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer?.setData('text/plain', card.dataset.reorderPage || '');
    });
    card.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      const sourcePageNumber = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
      const targetPageNumber = Number.parseInt(card.dataset.reorderPage || '', 10);
      if (!Number.isFinite(sourcePageNumber) || !Number.isFinite(targetPageNumber) || sourcePageNumber === targetPageNumber) {
        return;
      }

      reorderThumbnailPages(form, conversionKey, sourcePageNumber, targetPageNumber);
    });
  }
}

function moveThumbnailPage(form, conversionKey, pageNumber, offset) {
  const state = thumbnailStateByConversionKey.get(conversionKey);
  if (!state) {
    return;
  }

  const index = state.pages.findIndex((page) => page.pageNumber === pageNumber);
  const nextIndex = index + offset;
  if (index === -1 || nextIndex < 0 || nextIndex >= state.pages.length) {
    return;
  }

  const nextPages = state.pages.slice();
  const [movedPage] = nextPages.splice(index, 1);
  nextPages.splice(nextIndex, 0, movedPage);
  state.pages = nextPages;
  renderReorderThumbnailGrid(form, conversionKey);
}

function reorderThumbnailPages(form, conversionKey, sourcePageNumber, targetPageNumber) {
  const state = thumbnailStateByConversionKey.get(conversionKey);
  if (!state) {
    return;
  }

  const sourceIndex = state.pages.findIndex((page) => page.pageNumber === sourcePageNumber);
  const targetIndex = state.pages.findIndex((page) => page.pageNumber === targetPageNumber);
  if (sourceIndex === -1 || targetIndex === -1) {
    return;
  }

  const nextPages = state.pages.slice();
  const [movedPage] = nextPages.splice(sourceIndex, 1);
  nextPages.splice(targetIndex, 0, movedPage);
  state.pages = nextPages;
  renderReorderThumbnailGrid(form, conversionKey);
}

function rerenderCurrentView() {
  if (!conversionCatalog.length) {
    return;
  }

  if (currentViewState.view === 'detail' && currentViewState.conversionKey) {
    renderDetail(currentViewState.conversionKey);
    return;
  }

  renderToolList();
}

function getCurrentCategory() {
  return categoryCatalog.find((entry) => entry.key === currentViewState.categoryKey) || categoryCatalog[0];
}

function stripFileExtension(fileName) {
  return String(fileName || 'image')
    .replace(/\.[^.]+$/, '')
    .trim() || 'image';
}

function syncBuyerRouteState() {
  if (typeof window === 'undefined') {
    return;
  }

  const nextHash = stringifyBuyerRouteState(currentViewState);
  if (window.location.hash === nextHash) {
    return;
  }

  window.history.replaceState(null, '', nextHash);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isMobileUi() {
  return window.matchMedia('(max-width: 720px)').matches;
}

function initializeSignatureCanvas(form, conversionKey) {
  const canvas = form.querySelector('[data-signature-canvas]');
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');
  context.lineWidth = 2.5;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#3b2a18';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const state = {
    drawing: false,
    hasStroke: false
  };
  signatureCanvasStateByConversionKey.set(conversionKey, state);

  const startDrawing = (x, y) => {
    state.drawing = true;
    state.hasStroke = true;
    context.beginPath();
    context.moveTo(x, y);
  };

  const continueDrawing = (x, y) => {
    if (!state.drawing) {
      return;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    state.drawing = false;
  };

  const getPosition = (event) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  canvas.addEventListener('mousedown', (event) => {
    const position = getPosition(event);
    startDrawing(position.x, position.y);
  });
  canvas.addEventListener('mousemove', (event) => {
    const position = getPosition(event);
    continueDrawing(position.x, position.y);
  });
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const position = getPosition(event);
    startDrawing(position.x, position.y);
  }, { passive: false });
  canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    const position = getPosition(event);
    continueDrawing(position.x, position.y);
  }, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
}

function clearSignatureCanvas(form, conversionKey) {
  const canvas = form.querySelector('[data-signature-canvas]');
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const state = signatureCanvasStateByConversionKey.get(conversionKey);
  if (state) {
    state.hasStroke = false;
    state.drawing = false;
  }
}

async function buildSignatureFile(form, conversionKey) {
  const canvas = form.querySelector('[data-signature-canvas]');
  const state = signatureCanvasStateByConversionKey.get(conversionKey);
  if (!canvas || !state?.hasStroke) {
    return null;
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    return null;
  }

  return new File([blob], 'signature-draw.png', { type: 'image/png' });
}

function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'text';

    xhr.upload.addEventListener('progress', onProgress);
    xhr.onerror = () => reject(new TypeError('Failed to fetch'));
    xhr.onload = () => {
      const headers = new Headers();
      const rawHeaders = xhr.getAllResponseHeaders().trim().split(/[\r\n]+/);
      for (const line of rawHeaders) {
        if (!line) {
          continue;
        }

        const parts = line.split(': ');
        const header = parts.shift();
        headers.append(header, parts.join(': '));
      }

      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers
        })
      );
    };

    xhr.send(formData);
  });
}
