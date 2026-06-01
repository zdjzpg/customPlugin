import { createConversionResultMarkup } from './resultCard.mjs';
import { readApiResponse } from './apiResponse.mjs';
import { validateSelectedFiles } from './conversionValidation.mjs';
import { createUploadProgressMarkup, getUploadStageText } from './uploadProgress.mjs';

const buyerLoginPanel = document.querySelector('#buyer-login-panel');
const buyerDashboard = document.querySelector('#buyer-dashboard');
const buyerLoginForm = document.querySelector('#buyer-login-form');
const buyerMessage = document.querySelector('#buyer-message');
const conversionGrid = document.querySelector('#conversion-grid');
const conversionMessage = document.querySelector('#conversion-message');

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

  conversionGrid.innerHTML = body.conversions
    .map(
      (item) => `
        <article class="tool-card">
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
          <form
            class="tool-form"
            data-conversion-key="${item.key}"
            data-max-file-size-mb="${item.maxFileSizeMb || ''}"
            data-max-total-file-size-mb="${item.maxTotalFileSizeMb || ''}"
          >
            <label class="field">
              <span>选择文件</span>
              <input type="file" data-file-input data-accepts="${item.accepts}" accept="${item.accepts}" ${item.key === 'images_to_pdf' ? 'multiple' : ''} required />
            </label>
            <button class="button" type="submit">开始转换</button>
          </form>
          <div class="upload-progress-host" data-progress="${item.key}"></div>
          <div class="tool-results" data-results="${item.key}"></div>
        </article>
      `
    )
    .join('');

  for (const form of conversionGrid.querySelectorAll('.tool-form')) {
    form.addEventListener('submit', handleConversionSubmit);
  }
}

async function handleConversionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const conversionKey = form.dataset.conversionKey;
  const input = form.querySelector('[data-file-input]');
  const files = Array.from(input.files || []);
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

  setMessage(conversionMessage, '正在上传并转换...');

  try {
    const payload = new FormData();
    payload.append('conversionKey', conversionKey);
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
      renderUploadProgress(conversionKey, {
        stage: 'error',
        percent: 100,
        detail: body.message || getUploadStageText('error')
      });
      setMessage(conversionMessage, body.message || '转换失败。');
      return;
    }

    clearUploadProgress(conversionKey);
    setMessage(conversionMessage, '转换完成，可以下载结果了。');
    renderResults(conversionKey, body.conversion.files);
  } catch (error) {
    renderUploadProgress(conversionKey, {
      stage: 'error',
      percent: 100,
      detail: getUploadStageText('error')
    });
    setMessage(conversionMessage, '上传失败，请确认服务仍在运行，或先压缩大文件后重试。');
  }
}

function renderResults(conversionKey, files) {
  const resultsHost = conversionGrid.querySelector(`[data-results="${conversionKey}"]`);
  resultsHost.innerHTML = createConversionResultMarkup(files, buildGeneratedLabel());
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
  const host = conversionGrid.querySelector(`[data-progress="${conversionKey}"]`);
  if (!host) {
    return;
  }

  host.innerHTML = createUploadProgressMarkup(progressState);
}

function clearUploadProgress(conversionKey) {
  const host = conversionGrid.querySelector(`[data-progress="${conversionKey}"]`);
  if (!host) {
    return;
  }

  host.innerHTML = '';
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
