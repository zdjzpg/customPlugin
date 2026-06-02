import { createConversionResultMarkup } from './resultCard.mjs';
import { readApiResponse } from './apiResponse.mjs';
import {
  createSelectedFileOrderMarkup,
  moveItemByOffset
} from './fileSelectionOrder.mjs';
import {
  createStructuredRangeRowMarkup,
  createToolDetailMarkup,
  createToolOverviewMarkup
} from './toolCatalogMarkup.mjs';
import { validateSelectedFiles } from './conversionValidation.mjs';
import { createUploadProgressMarkup, getUploadStageText } from './uploadProgress.mjs';

const buyerLoginPanel = document.querySelector('#buyer-login-panel');
const buyerDashboard = document.querySelector('#buyer-dashboard');
const buyerHero = document.querySelector('#buyer-hero');
const buyerDashboardHeader = document.querySelector('#buyer-dashboard-header');
const conversionOverview = document.querySelector('#conversion-overview');
const conversionDetail = document.querySelector('#conversion-detail');
const buyerLoginForm = document.querySelector('#buyer-login-form');
const buyerMessage = document.querySelector('#buyer-message');
const conversionMessage = document.querySelector('#conversion-message');
const dashboardTitle = document.querySelector('#dashboard-title');
const dashboardCopy = document.querySelector('#dashboard-copy');

let conversionCatalog = [];
const selectedFilesByConversionKey = new Map();
const conversionSummaries = new Map();

conversionOverview.addEventListener('click', handleOverviewClick);
conversionDetail.addEventListener('click', handleDetailClick);

initialize();

async function initialize() {
  const sessionResponse = await fetch('/api/buyer/session');
  const sessionBody = await sessionResponse.json();
  if (sessionResponse.ok && sessionBody.authenticated) {
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
  renderOverview();
}

async function handleConversionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const conversionKey = form.dataset.conversionKey;
  const input = form.querySelector('[data-file-input]');
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
    setMessage(conversionMessage, '先选择文件。');
    return;
  }

  const validationMessage = validateSelectedFiles(files, accepts, limits);
  if (validationMessage) {
    setMessage(conversionMessage, validationMessage);
    return;
  }

  let conversionOptions = {};
  try {
    conversionOptions = collectConversionOptions(form, conversionKey);
  } catch (error) {
    setMessage(conversionMessage, error.message || '请检查页码范围后再试。');
    return;
  }

  setMessage(conversionMessage, '正在上传并转换...');

  try {
    const payload = new FormData();
    payload.append('conversionKey', conversionKey);
    if (Object.keys(conversionOptions).length > 0) {
      payload.append('conversionOptions', JSON.stringify(conversionOptions));
    }
    for (const file of files) {
      payload.append('files', file, file.name);
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
      setMessage(conversionMessage, body.message || '转换失败。');
      return;
    }

    conversionSummaries.set(conversionKey, body.conversion.summary || null);
    clearUploadProgress(conversionKey);
    setMessage(conversionMessage, '转换完成，可以下载结果了。');
    renderResults(conversionKey, body.conversion.files);
  } catch (error) {
    conversionSummaries.delete(conversionKey);
    renderUploadProgress(conversionKey, {
      stage: 'error',
      percent: 100,
      detail: getUploadStageText('error')
    });
    setMessage(conversionMessage, '上传失败，请确认服务仍在运行，或先压缩大文件后重试。');
  }
}

function renderResults(conversionKey, files) {
  const resultsHost = conversionDetail.querySelector(`[data-results="${conversionKey}"]`);
  const summary = currentConversionSummary(conversionKey);
  resultsHost.innerHTML = createConversionResultMarkup(files, buildGeneratedLabel(), summary);
}

function setMessage(element, value) {
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
  const host = conversionDetail.querySelector(`[data-progress="${conversionKey}"]`);
  if (!host) {
    return;
  }

  host.innerHTML = createUploadProgressMarkup(progressState);
}

function clearUploadProgress(conversionKey) {
  const host = conversionDetail.querySelector(`[data-progress="${conversionKey}"]`);
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

function renderOverview() {
  selectedFilesByConversionKey.clear();
  conversionSummaries.clear();
  buyerHero?.classList.remove('hidden');
  buyerDashboardHeader?.classList.remove('hidden');
  dashboardTitle.textContent = '选择转换方式';
  dashboardCopy.textContent = '先选择一种方法，再进入详情页上传文件和填写参数。';
  conversionOverview.innerHTML = createToolOverviewMarkup(conversionCatalog);
  conversionOverview.classList.remove('hidden');
  conversionDetail.classList.add('hidden');
  conversionDetail.innerHTML = '';
  setMessage(conversionMessage, '');
}

function renderDetail(conversionKey) {
  const item = conversionCatalog.find((entry) => entry.key === conversionKey);
  if (!item) {
    return;
  }

  buyerHero?.classList.add('hidden');
  buyerDashboardHeader?.classList.add('hidden');
  dashboardTitle.textContent = item.label;
  dashboardCopy.textContent = '填写参数并上传文件后，即可开始处理。';
  conversionDetail.innerHTML = createToolDetailMarkup(item);
  conversionOverview.classList.add('hidden');
  conversionDetail.classList.remove('hidden');

  const form = conversionDetail.querySelector('.tool-form');
  ensureDefaultStructuredRangeRow(form);
  form.querySelector('[data-file-input]')?.addEventListener('change', handleFileInputChange);
  renderSelectedFileList(form, conversionKey);
  form.addEventListener('submit', handleConversionSubmit);
  conversionDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setMessage(conversionMessage, '');
}

function handleOverviewClick(event) {
  const openButton = event.target.closest('[data-open-detail]');
  if (!openButton) {
    return;
  }

  renderDetail(openButton.dataset.openDetail);
}

function handleDetailClick(event) {
  if (event.target.closest('[data-back-to-overview]')) {
    renderOverview();
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
  }
}

function handleFileInputChange(event) {
  const input = event.currentTarget;
  const form = input.closest('.tool-form');
  if (!form) {
    return;
  }

  const conversionKey = form.dataset.conversionKey;
  selectedFilesByConversionKey.set(conversionKey, Array.from(input.files || []));
  renderSelectedFileList(form, conversionKey);
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
