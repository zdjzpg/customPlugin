import {
  createUsageStatsFilterMarkup,
  createUsageStatsTableMarkup
} from './adminUsageStatsMarkup.mjs';

const adminLoginPanel = document.querySelector('#admin-login-panel');
const adminDashboard = document.querySelector('#admin-dashboard');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminMessage = document.querySelector('#admin-message');
const codeCreateForm = document.querySelector('#code-create-form');
const codeMessage = document.querySelector('#code-message');
const codesTableBody = document.querySelector('#codes-table-body');
const conversionsTableBody = document.querySelector('#conversions-table-body');
const usageStatsFilterHost = document.querySelector('#usage-stats-filter-host');
const usageStatsMessage = document.querySelector('#usage-stats-message');
const usageStatsTableBody = document.querySelector('#usage-stats-table-body');

let usageStatsFilter = {
  preset: 'last7days',
  dateFrom: '',
  dateTo: ''
};

initializeAdmin();

async function initializeAdmin() {
  const sessionResponse = await fetch('/api/admin/session');
  const sessionBody = await sessionResponse.json();
  if (sessionResponse.ok && sessionBody.authenticated) {
    showAdminDashboard();
    await loadCodes();
    await loadConversions();
    await loadUsageStats();
    return;
  }

  showAdminLogin();
}

adminLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(adminMessage, '正在登录...');

  const username = document.querySelector('#admin-username').value.trim();
  const password = document.querySelector('#admin-password').value;

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const body = await response.json();
  if (!response.ok) {
    setMessage(adminMessage, body.reason === 'INVALID_CREDENTIALS' ? '账号或密码错误。' : '登录失败。');
    return;
  }

  setMessage(adminMessage, '');
  showAdminDashboard();
  await loadCodes();
  await loadConversions();
  await loadUsageStats();
});

codeCreateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(codeMessage, '正在创建卡密...');

  const payload = {
    code: document.querySelector('#code-value').value.trim(),
    accessType: document.querySelector('#code-access-type').value,
    maxUses: document.querySelector('#code-max-uses').value,
    durationDays: document.querySelector('#code-duration-days').value,
    note: document.querySelector('#code-note').value.trim()
  };

  const response = await fetch('/api/admin/codes', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json();
  if (!response.ok) {
    setMessage(codeMessage, body.reason || '创建失败。');
    return;
  }

  setMessage(codeMessage, `已创建卡密：${body.code.code}`);
  codeCreateForm.reset();
  document.querySelector('#code-access-type').value = 'usage';
  await loadCodes();
});

function showAdminLogin() {
  adminLoginPanel.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
}

function showAdminDashboard() {
  adminLoginPanel.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
}

async function loadCodes() {
  const response = await fetch('/api/admin/codes');
  const body = await response.json();

  codesTableBody.innerHTML = body.codes
    .map(
      (code) => `
        <tr>
          <td>${escapeHtml(code.code)}</td>
          <td>${code.accessType === 'usage' ? '次数型' : '时效型'}</td>
          <td>${code.status === 'active' ? '启用' : '停用'}</td>
          <td>${formatUsage(code)}</td>
          <td>${formatValidity(code)}</td>
          <td>${escapeHtml(code.note || '-')}</td>
          <td>
            <button
              class="table-action-button"
              type="button"
              data-code-id="${code.id}"
              data-next-status="${code.status === 'active' ? 'disabled' : 'active'}"
            >
              ${code.status === 'active' ? '禁用' : '启用'}
            </button>
          </td>
        </tr>
      `
    )
    .join('');

  for (const button of codesTableBody.querySelectorAll('.table-action-button')) {
    button.addEventListener('click', handleCodeStatusToggle);
  }
}

async function loadConversions() {
  const response = await fetch('/api/admin/conversions');
  const body = await response.json();

  conversionsTableBody.innerHTML = body.conversions
    .map(
      (conversion) => `
        <tr>
          <td>${conversion.id}</td>
          <td>${escapeHtml(conversion.codeValue || '-')}</td>
          <td>${escapeHtml(conversion.conversionKey)}</td>
          <td>${escapeHtml(conversion.status)}</td>
          <td>${escapeHtml((conversion.inputFileNames || []).join(', ') || '-')}</td>
          <td>${formatOutputs(conversion.id, conversion.outputFiles || [])}</td>
          <td>${escapeHtml(conversion.errorMessage || '-')}</td>
        </tr>
      `
    )
    .join('');
}

async function loadUsageStats() {
  renderUsageStatsFilter();

  const query = new URLSearchParams({
    preset: usageStatsFilter.preset
  });
  if (usageStatsFilter.preset === 'custom') {
    query.set('dateFrom', usageStatsFilter.dateFrom || '');
    query.set('dateTo', usageStatsFilter.dateTo || '');
  }

  const response = await fetch(`/api/admin/usage-stats?${query.toString()}`);
  const body = await response.json();

  usageStatsTableBody.innerHTML = createUsageStatsTableMarkup(body.stats || []);
  setMessage(usageStatsMessage, usageStatsFilter.preset === 'custom' ? '已按自定义日期统计。' : '已更新功能统计。');
}

function renderUsageStatsFilter() {
  usageStatsFilterHost.innerHTML = createUsageStatsFilterMarkup(usageStatsFilter);
  usageStatsFilterHost
    .querySelector('#usage-stats-filter-form')
    ?.addEventListener('submit', handleUsageStatsFilterSubmit);
}

function formatOutputs(conversionId, files) {
  if (!files.length) {
    return '-';
  }

  return files
    .map(
      (file) =>
        `<a class="result-link" href="/api/downloads/conversions/${conversionId}/${encodeURIComponent(file.fileName)}" target="_blank" rel="noreferrer">${escapeHtml(file.fileName)}</a>`
    )
    .join('<br />');
}

function formatUsage(code) {
  if (code.accessType === 'duration') {
    return `${code.durationDays || '-'} 天`;
  }

  return `${code.usedCount}/${code.maxUses || '-'}`;
}

function formatValidity(code) {
  if (code.accessType === 'usage') {
    return '-';
  }

  const activatedAt = code.activatedAt ? formatDate(code.activatedAt) : '未激活';
  const expiresAt = code.expiresAt ? formatDate(code.expiresAt) : '未开始';
  return `${activatedAt} / ${expiresAt}`;
}

function setMessage(element, value) {
  element.textContent = value;
}

async function handleCodeStatusToggle(event) {
  const button = event.currentTarget;
  const codeId = button.dataset.codeId;
  const nextStatus = button.dataset.nextStatus;

  button.disabled = true;
  setMessage(codeMessage, nextStatus === 'disabled' ? '正在禁用卡密...' : '正在启用卡密...');

  const response = await fetch(`/api/admin/codes/${codeId}/status`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      status: nextStatus
    })
  });

  const body = await response.json();
  if (!response.ok) {
    setMessage(codeMessage, body.reason || '操作失败。');
    button.disabled = false;
    return;
  }

  setMessage(codeMessage, nextStatus === 'disabled' ? '卡密已禁用。' : '卡密已启用。');
  await loadCodes();
}

async function handleUsageStatsFilterSubmit(event) {
  event.preventDefault();
  usageStatsFilter = {
    preset: document.querySelector('#usage-stats-preset').value,
    dateFrom: document.querySelector('#usage-stats-date-from').value,
    dateTo: document.querySelector('#usage-stats-date-to').value
  };

  setMessage(usageStatsMessage, '正在加载功能统计...');
  await loadUsageStats();
}

function formatDate(value) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
