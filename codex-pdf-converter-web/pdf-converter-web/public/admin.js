import {
  createUsageStatsFilterMarkup,
  createUsageStatsTableMarkup
} from './adminUsageStatsMarkup.mjs';
import { createAdminPaginationMarkup } from './adminPaginationMarkup.mjs';
import { formatAdminConversionLabel } from './adminToolLabels.mjs';
import { createAdminUsageChartMarkup } from './adminUsageChartMarkup.mjs';

const adminLoginPanel = document.querySelector('#admin-login-panel');
const adminDashboard = document.querySelector('#admin-dashboard');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminMessage = document.querySelector('#admin-message');
const cleanupByCodeForm = document.querySelector('#cleanup-by-code-form');
const cleanupCodeValueInput = document.querySelector('#cleanup-code-value');
const cleanupMessage = document.querySelector('#cleanup-message');
const codeCreateForm = document.querySelector('#code-create-form');
const codeMessage = document.querySelector('#code-message');
const codesTableBody = document.querySelector('#codes-table-body');
const codesSearchInput = document.querySelector('#codes-search-input');
const conversionsTableBody = document.querySelector('#conversions-table-body');
const conversionsSearchInput = document.querySelector('#conversions-search-input');
const conversionsPaginationHost = document.querySelector('#conversions-pagination-host');
const usageStatsFilterHost = document.querySelector('#usage-stats-filter-host');
const usageStatsMessage = document.querySelector('#usage-stats-message');
const usageStatsTableBody = document.querySelector('#usage-stats-table-body');
const usageStatsPaginationHost = document.querySelector('#usage-stats-pagination-host');
const codesPaginationHost = document.querySelector('#codes-pagination-host');
const usageChartFilterForm = document.querySelector('#usage-chart-filter-form');
const usageChartCodeInput = document.querySelector('#usage-chart-code-input');
const usageChartPresetInput = document.querySelector('#usage-chart-preset');
const usageChartDateFromInput = document.querySelector('#usage-chart-date-from');
const usageChartDateToInput = document.querySelector('#usage-chart-date-to');
const usageChartMessage = document.querySelector('#usage-chart-message');
const usageChartHost = document.querySelector('#usage-chart-host');

const ADMIN_PAGE_SIZE = 20;

let usageStatsFilter = {
  preset: 'last7days',
  dateFrom: '',
  dateTo: ''
};
let usageChartFilter = {
  preset: 'last7days',
  dateFrom: '',
  dateTo: '',
  codeValue: ''
};
let codeSearchKeyword = '';
let conversionSearchKeyword = '';
let codeRecords = [];
let conversionRecords = [];
let usageStatsRecords = [];
let usageChartData = {
  days: [],
  series: []
};
let adminDashboardState = {
  activeSection: 'codes',
  pageBySection: {
    codes: 1,
    conversions: 1,
    stats: 1
  }
};

adminDashboard.addEventListener('click', handleAdminDashboardClick);
codesSearchInput?.addEventListener('input', handleCodesSearchInput);
conversionsSearchInput?.addEventListener('input', handleConversionsSearchInput);
usageChartFilterForm?.addEventListener('submit', handleUsageChartFilterSubmit);
cleanupByCodeForm?.addEventListener('submit', handleCleanupByCodeSubmit);

initializeAdmin();

async function initializeAdmin() {
  const sessionResponse = await fetch('/api/admin/session');
  const sessionBody = await sessionResponse.json();
  if (sessionResponse.ok && sessionBody.authenticated) {
    showAdminDashboard();
    await loadCodes();
    await loadConversions();
    await loadUsageStats();
    renderUsageChart();
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
  renderUsageChart();
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
  renderAdminSectionVisibility();
}

async function loadCodes() {
  const response = await fetch('/api/admin/codes');
  const body = await response.json();

  codeRecords = Array.isArray(body.codes) ? body.codes : [];
  renderCodesTable();
}

function renderCodesTable() {
  const filteredCodes = filterCodesByKeyword(codeRecords, codeSearchKeyword);
  const pageState = paginateItems(filteredCodes, adminDashboardState.pageBySection.codes);
  adminDashboardState.pageBySection.codes = pageState.currentPage;

  codesTableBody.innerHTML = pageState.items.length > 0
    ? pageState.items
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
    .join('')
    : `<tr><td colspan="7">${codeSearchKeyword ? '没有匹配的卡密记录。' : '当前还没有卡密记录。'}</td></tr>`;

  codesPaginationHost.innerHTML = createAdminPaginationMarkup({
    sectionKey: 'codes',
    currentPage: pageState.currentPage,
    totalPages: pageState.totalPages,
    totalItems: pageState.totalItems
  });
}

async function loadConversions() {
  const response = await fetch('/api/admin/conversions');
  const body = await response.json();

  conversionRecords = Array.isArray(body.conversions) ? body.conversions : [];
  renderConversionsTable();
}

function renderConversionsTable() {
  const filteredConversions = filterConversionsByKeyword(conversionRecords, conversionSearchKeyword);
  const pageState = paginateItems(filteredConversions, adminDashboardState.pageBySection.conversions);
  adminDashboardState.pageBySection.conversions = pageState.currentPage;

  conversionsTableBody.innerHTML = pageState.items.length > 0
    ? pageState.items
    .map(
      (conversion) => `
        <tr>
          <td>${conversion.id}</td>
          <td>${escapeHtml(formatAdminDateTime(conversion.createdAt))}</td>
          <td>${escapeHtml(conversion.codeValue || '-')}</td>
          <td>${escapeHtml(formatAdminConversionLabel(conversion.conversionKey))}</td>
          <td>${escapeHtml(conversion.status)}</td>
          <td>${escapeHtml((conversion.inputFileNames || []).join(', ') || '-')}</td>
          <td>${formatOutputs(conversion.id, conversion.outputFiles || [])}</td>
          <td>${escapeHtml(conversion.errorMessage || '-')}</td>
        </tr>
      `
    )
    .join('')
    : `<tr><td colspan="8">${conversionSearchKeyword ? '没有匹配的转换记录。' : '当前还没有转换记录。'}</td></tr>`;

  conversionsPaginationHost.innerHTML = createAdminPaginationMarkup({
    sectionKey: 'conversions',
    currentPage: pageState.currentPage,
    totalPages: pageState.totalPages,
    totalItems: pageState.totalItems
  });
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

  usageStatsRecords = Array.isArray(body.stats) ? body.stats : [];
  renderUsageStatsTable();
  setMessage(usageStatsMessage, usageStatsFilter.preset === 'custom' ? '已按自定义日期统计。' : '已更新功能统计。');
}

function renderUsageStatsFilter() {
  usageStatsFilterHost.innerHTML = createUsageStatsFilterMarkup(usageStatsFilter);
  usageStatsFilterHost
    .querySelector('#usage-stats-filter-form')
    ?.addEventListener('submit', handleUsageStatsFilterSubmit);
}

function renderUsageStatsTable() {
  const pageState = paginateItems(usageStatsRecords, adminDashboardState.pageBySection.stats);
  adminDashboardState.pageBySection.stats = pageState.currentPage;

  usageStatsTableBody.innerHTML = createUsageStatsTableMarkup(pageState.items);
  usageStatsPaginationHost.innerHTML = createAdminPaginationMarkup({
    sectionKey: 'stats',
    currentPage: pageState.currentPage,
    totalPages: pageState.totalPages,
    totalItems: pageState.totalItems
  });
}

async function loadUsageChart() {
  const query = new URLSearchParams({
    preset: usageChartFilter.preset,
    codeValue: usageChartFilter.codeValue
  });

  if (usageChartFilter.preset === 'custom') {
    query.set('dateFrom', usageChartFilter.dateFrom || '');
    query.set('dateTo', usageChartFilter.dateTo || '');
  }

  const response = await fetch(`/api/admin/usage-chart?${query.toString()}`);
  const body = await response.json();
  usageChartData = body.chart || {
    days: [],
    series: []
  };
  renderUsageChart();
}

function renderUsageChart() {
  usageChartHost.innerHTML = createAdminUsageChartMarkup(usageChartData);
}

function formatOutputs(conversionId, files) {
  if (!files.length) {
    return '-';
  }

  return files
    .map(
      (file) => file.cleanedAt
        ? `<span class="admin-cleaned-file">${escapeHtml(file.fileName)}（文件已清理）</span>`
        : `<a class="result-link" href="/api/downloads/conversions/${conversionId}/${encodeURIComponent(file.fileName)}" target="_blank" rel="noreferrer">${escapeHtml(file.fileName)}</a>`
    )
    .join('<br />');
}

function formatAdminDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('zh-CN', {
    hour12: false
  });
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
  adminDashboardState.pageBySection.stats = 1;

  setMessage(usageStatsMessage, '正在加载功能统计...');
  await loadUsageStats();
}

async function handleUsageChartFilterSubmit(event) {
  event.preventDefault();
  usageChartFilter = {
    preset: usageChartPresetInput.value,
    dateFrom: usageChartDateFromInput.value,
    dateTo: usageChartDateToInput.value,
    codeValue: usageChartCodeInput.value.trim()
  };

  setMessage(usageChartMessage, '正在加载卡密图表...');
  await loadUsageChart();
  setMessage(usageChartMessage, usageChartFilter.codeValue ? '已更新卡密图表。' : '请输入卡密值后再查询。');
}

async function handleCleanupByCodeSubmit(event) {
  event.preventDefault();
  const codeValue = String(cleanupCodeValueInput?.value || '').trim();
  if (!codeValue) {
    setMessage(cleanupMessage, '请先输入卡密值后再清理。');
    return;
  }

  setMessage(cleanupMessage, '正在清理该卡密的历史文件...');
  const response = await fetch('/api/admin/conversions/cleanup-by-code', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      codeValue
    })
  });
  const body = await response.json();

  if (!response.ok) {
    setMessage(cleanupMessage, body.message || body.reason || '清理失败。');
    return;
  }

  setMessage(cleanupMessage, `已清理 ${body.result.cleanedConversions} 条转换记录的 ${body.result.cleanedFiles} 个文件。`);
  await loadConversions();
}

function handleCodesSearchInput(event) {
  codeSearchKeyword = String(event.target.value || '').trim();
  adminDashboardState.pageBySection.codes = 1;
  renderCodesTable();
}

function handleConversionsSearchInput(event) {
  conversionSearchKeyword = String(event.target.value || '').trim();
  adminDashboardState.pageBySection.conversions = 1;
  renderConversionsTable();
}

async function handleAdminDashboardClick(event) {
  const sectionTab = event.target.closest('[data-admin-section-tab]');
  if (sectionTab) {
    adminDashboardState = {
      ...adminDashboardState,
      activeSection: sectionTab.dataset.adminSectionTab || 'codes'
    };
    renderAdminSectionVisibility();
    return;
  }

  const pageButton = event.target.closest('[data-admin-page-section]');
  if (pageButton) {
    const sectionKey = pageButton.dataset.adminPageSection;
    const pageAction = pageButton.dataset.adminPageAction;
    const pageNumber = Number.parseInt(pageButton.dataset.adminPageNumber || '', 10);
    const currentPage = adminDashboardState.pageBySection[sectionKey] || 1;
    const nextPage = Number.isFinite(pageNumber)
      ? pageNumber
      : pageAction === 'prev'
        ? currentPage - 1
        : currentPage + 1;

    adminDashboardState = {
      ...adminDashboardState,
      pageBySection: {
        ...adminDashboardState.pageBySection,
        [sectionKey]: Math.max(1, nextPage)
      }
    };
    renderSectionByKey(sectionKey);
    return;
  }

  const codeStatusButton = event.target.closest('.table-action-button[data-code-id]');
  if (codeStatusButton) {
    await handleCodeStatusToggle({
      currentTarget: codeStatusButton
    });
  }
}

function renderAdminSectionVisibility() {
  adminDashboard.querySelectorAll('[data-admin-section-tab]').forEach((button) => {
    button.classList.toggle(
      'admin-section-tab-active',
      button.dataset.adminSectionTab === adminDashboardState.activeSection
    );
  });

  adminDashboard.querySelectorAll('[data-admin-section-panel]').forEach((panel) => {
    panel.classList.toggle(
      'hidden',
      panel.dataset.adminSectionPanel !== adminDashboardState.activeSection
    );
  });
}

function renderSectionByKey(sectionKey) {
  if (sectionKey === 'codes') {
    renderCodesTable();
    return;
  }

  if (sectionKey === 'conversions') {
    renderConversionsTable();
    return;
  }

  if (sectionKey === 'stats') {
    renderUsageStatsTable();
    return;
  }

  if (sectionKey === 'charts') {
    renderUsageChart();
  }
}

function paginateItems(items, requestedPage) {
  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, requestedPage || 1), totalPages);
  const startIndex = (currentPage - 1) * ADMIN_PAGE_SIZE;
  const pagedItems = Array.isArray(items)
    ? items.slice(startIndex, startIndex + ADMIN_PAGE_SIZE)
    : [];

  return {
    items: pagedItems,
    currentPage,
    totalPages,
    totalItems
  };
}

function filterCodesByKeyword(items, keywordText) {
  const keyword = String(keywordText || '').trim().toLowerCase();
  if (!keyword) {
    return items;
  }

  return items.filter((item) => String(item.code || '').toLowerCase().includes(keyword));
}

function filterConversionsByKeyword(items, keywordText) {
  const keyword = String(keywordText || '').trim().toLowerCase();
  if (!keyword) {
    return items;
  }

  return items.filter((item) => String(item.codeValue || '').toLowerCase().includes(keyword));
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
