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
import { createCategoryIconMarkup } from './categoryIconMarkup.mjs';
import { devToolCatalog, getDevToolByKey } from './devToolCatalog.mjs';
import { runDevTool } from './devToolRuntime.mjs';
import { getTextToolByKey, textToolCatalog } from './textToolCatalog.mjs';
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
import { validateSelectedFiles } from './conversionValidation.mjs';
import { createUploadProgressMarkup, getUploadStageText } from './uploadProgress.mjs';

const buyerLoginPanel = document.querySelector('#buyer-login-panel');
const buyerDashboard = document.querySelector('#buyer-dashboard');
const buyerLoginForm = document.querySelector('#buyer-login-form');
const buyerMessage = document.querySelector('#buyer-message');

let conversionCatalog = [];
const categoryCatalog = buyerCategoryCatalog;
const quickKeywordCatalog = ['PDF 转 PPT', '文本去重', 'Base64', 'UUID', '图片压缩', 'GIF 拆分', 'SSL'];
const selectedFilesByConversionKey = new Map();
const conversionSummaries = new Map();
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

window.matchMedia('(max-width: 720px)').addEventListener('change', () => {
  rerenderCurrentView();
});

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

  setMessage(getConversionMessageElement(), '正在上传并转换...');

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
    } else if (conversionKey === 'sign_stamp_pdf') {
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
      const files = getSelectedFiles(form, conversionKey);
      const accepts = (input.dataset.accepts || '')
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
    setMessage(getConversionMessageElement(), '转换完成，可以下载结果了。');
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

  if (conversionKey === 'sign_stamp_pdf') {
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
  const toolItem = getBuyerToolByKey(conversionKey);
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
      ? getBuyerToolByKey(currentViewState.conversionKey)?.label || category.label
      : category.label,
    searchKeyword: currentViewState.searchKeyword,
    mobileNavOpen: currentViewState.mobileNavOpen,
    quickKeywords: quickKeywordCatalog,
    categories: categoryCatalog,
    activeCategoryKey: currentViewState.categoryKey,
    contentMarkup
  });
}

function buildToolListMarkup() {
  const hasSearchKeyword = Boolean(String(currentViewState.searchKeyword || '').trim());
  const visibleTools = getVisibleTools(currentViewState.categoryKey, currentViewState.searchKeyword);
  const mobileMode = isMobileUi();
  const listMarkup = visibleTools.length === 0
    ? '<div class="empty-state-card">没有找到匹配的工具，请换一个关键词试试。</div>'
    : mobileMode
      ? createMobileOverviewMarkup(visibleTools, { showHeader: false })
      : createToolOverviewMarkup(visibleTools);

  return `
    <section class="buyer-section-shell">
      <div class="${mobileMode ? 'buyer-mobile-list-shell' : 'buyer-tool-list-shell tool-group grid-row grid-col-space30'}" id="conversion-overview">
        ${listMarkup}
      </div>
      <div class="hidden" id="conversion-detail"></div>
      <p class="message" id="conversion-message"></p>
    </section>
  `;
}

function buildDetailMarkup(conversionKey) {
  const toolItem = getBuyerToolByKey(conversionKey);
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

  const homeButton = event.target.closest('[data-topbar-home]');
  if (homeButton) {
    currentViewState = {
      ...currentViewState,
      searchKeyword: '',
      mobileNavOpen: false
    };
    renderToolList();
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

function handleLocalTextToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;
  const sourceText = form.querySelector('[data-source-text]')?.value || '';
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
    uuidCount
  });

  const resultHost = buyerDashboard.querySelector(`[data-results="${toolKey}"]`);
  const outputElement = resultHost?.querySelector('[data-output-text]');
  if (outputElement) {
    outputElement.value = result.outputText || '';
  }
  renderTextToolSummary(resultHost, result.summary);
  setMessage(getConversionMessageElement(), '处理完成，可以复制结果了。');
}

async function handleLocalDevToolSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const toolKey = form.dataset.conversionKey;

  try {
    const result = await runDevTool(toolKey, collectDevToolOptions(form, toolKey));
    renderDevToolResult(toolKey, result);
    setMessage(getConversionMessageElement(), '处理完成，可以复制结果了。');
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
    setMessage(getConversionMessageElement(), '处理完成，可以复制结果了。');
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
  if (conversionKey === 'merge_pdf') {
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

function getToolsForCategory(categoryKey) {
  if (categoryKey === 'ppt_tools') {
    return conversionCatalog.filter((item) => (item.categoryKey || 'ppt_tools') === 'ppt_tools');
  }

  if (categoryKey === 'text_tools') {
    return textToolCatalog;
  }

  if (categoryKey === 'dev_tools') {
    return devToolCatalog;
  }

  if (categoryKey === 'image_tools') {
    return conversionCatalog.filter((item) => item.categoryKey === 'image_tools');
  }

  return [];
}

function getVisibleTools(categoryKey, searchKeyword = '') {
  const keyword = String(searchKeyword || '').trim().toLowerCase();
  const tools = keyword ? getAllBuyerTools() : getToolsForCategory(categoryKey);
  if (!keyword) {
    return tools;
  }

  return tools.filter((item) =>
    item.label.toLowerCase().includes(keyword) ||
    (item.helperText || '').toLowerCase().includes(keyword)
  );
}

function getCurrentCategory() {
  return categoryCatalog.find((entry) => entry.key === currentViewState.categoryKey) || categoryCatalog[0];
}

function getAllBuyerTools() {
  return [
    ...conversionCatalog.map((item) => ({ ...item, categoryKey: item.categoryKey || 'ppt_tools' })),
    ...textToolCatalog,
    ...devToolCatalog
  ];
}

function getBuyerToolByKey(toolKey) {
  return conversionCatalog.find((entry) => entry.key === toolKey) ||
    getTextToolByKey(toolKey) ||
    getDevToolByKey(toolKey);
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
