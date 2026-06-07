import { buyerCategoryCatalog } from './buyerCategoryCatalog.mjs';
import { applyBuyerMotion } from './buyerMotion.mjs';
import { createBuyerShellMarkup } from './buyerShellMarkup.mjs';
import { getVisibleTools } from './buyerToolCatalog.mjs';
import { createMobileOverviewMarkup } from './mobileBuyerMarkup.mjs';
import { createPreviewToolOverviewMarkup } from './toolCatalogMarkup.mjs';

const previewRoot = document.querySelector('#tool-preview-app');
const categoryCatalog = buyerCategoryCatalog;
const quickKeywordCatalog = ['PDF 转 PPT', 'OCR', '批量重命名', '音频转文字', '文字转语音', '图片压缩', 'SSL'];
const defaultPreviewMessage = '可先搜索浏览工具，使用时请先登录或联系卖家获取卡密。';

let conversionCatalog = [];
let currentViewState = {
  categoryKey: categoryCatalog[0].key,
  searchKeyword: '',
  mobileNavOpen: false,
  message: defaultPreviewMessage
};

previewRoot?.addEventListener('click', handlePreviewClick);
previewRoot?.addEventListener('input', handlePreviewInput);
previewRoot?.addEventListener('keydown', handlePreviewKeydown);

initialize();

async function initialize() {
  currentViewState = {
    ...currentViewState,
    ...parsePreviewRouteState(window.location.hash)
  };

  const response = await fetch('/api/conversions/catalog');
  const body = await response.json();
  conversionCatalog = body.conversions || [];
  renderPreviewDashboard();
}

function renderPreviewDashboard() {
  previewRoot.innerHTML = createBuyerShellMarkup({
    title: getCurrentCategory().label,
    titleDescription: getCurrentCategory().description || '',
    searchKeyword: currentViewState.searchKeyword,
    mobileNavOpen: currentViewState.mobileNavOpen,
    quickKeywords: quickKeywordCatalog,
    categories: categoryCatalog,
    activeCategoryKey: currentViewState.categoryKey,
    contentMarkup: buildPreviewListMarkup()
  });
  requestAnimationFrame(() => applyBuyerMotion('tool_list'));
}

function buildPreviewListMarkup() {
  const visibleTools = getVisibleTools(
    conversionCatalog,
    currentViewState.categoryKey,
    currentViewState.searchKeyword
  );
  const mobileMode = isMobileUi();
  const listMarkup = visibleTools.length === 0
    ? '<div class="empty-state-card">没有找到匹配的工具，请换一个关键词试试。</div>'
    : mobileMode
      ? createMobileOverviewMarkup(visibleTools, { showHeader: false, interactionMode: 'preview' })
      : createPreviewToolOverviewMarkup(visibleTools);

  return `
    <section class="buyer-section-shell">
      <div class="preview-notice-card">
        <div class="preview-notice-head">
          <div>
            <p class="preview-notice-title">工具预览页</p>
            <p class="preview-notice-copy">可先搜索浏览支持的工具范围，实际使用前请联系卖家开通。</p>
          </div>
          <a class="button preview-login-link" href="/">已有卡密，去登录</a>
        </div>
      </div>
      <div class="${mobileMode ? 'buyer-mobile-list-shell' : 'buyer-tool-list-shell tool-group grid-row grid-col-space30'}" id="conversion-overview">
        ${listMarkup}
      </div>
      <p class="message preview-tip-message" id="preview-message">${escapeHtml(currentViewState.message)}</p>
    </section>
  `;
}

function handlePreviewClick(event) {
  const mobileNavToggle = event.target.closest('[data-mobile-nav-toggle]');
  if (mobileNavToggle) {
    currentViewState = {
      ...currentViewState,
      mobileNavOpen: !currentViewState.mobileNavOpen
    };
    renderPreviewDashboard();
    return;
  }

  const closeMobileNav = event.target.closest('[data-close-mobile-nav]');
  if (closeMobileNav) {
    currentViewState = {
      ...currentViewState,
      mobileNavOpen: false
    };
    renderPreviewDashboard();
    return;
  }

  const categoryButton = event.target.closest('[data-open-category]');
  if (categoryButton) {
    currentViewState = {
      ...currentViewState,
      categoryKey: categoryButton.dataset.openCategory || categoryCatalog[0].key,
      searchKeyword: '',
      mobileNavOpen: false,
      message: defaultPreviewMessage
    };
    syncPreviewRouteState();
    renderPreviewDashboard();
    return;
  }

  const searchChip = event.target.closest('[data-search-chip]');
  if (searchChip) {
    currentViewState = {
      ...currentViewState,
      searchKeyword: searchChip.dataset.searchChip || '',
      mobileNavOpen: false,
      message: defaultPreviewMessage
    };
    syncPreviewRouteState();
    renderPreviewDashboard();
    return;
  }

  const previewTool = event.target.closest('[data-preview-tool]');
  if (previewTool) {
    showPreviewLockedMessage();
  }
}

function handlePreviewInput(event) {
  const searchInput = event.target.closest('[data-tool-search-input]');
  if (!searchInput) {
    return;
  }

  currentViewState = {
    ...currentViewState,
    searchKeyword: searchInput.value || '',
    mobileNavOpen: false,
    message: defaultPreviewMessage
  };
  syncPreviewRouteState();
  renderPreviewDashboard();
}

function handlePreviewKeydown(event) {
  const previewTool = event.target.closest('[data-preview-tool]');
  if (!previewTool) {
    return;
  }

  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  showPreviewLockedMessage();
}

function showPreviewLockedMessage() {
  currentViewState = {
    ...currentViewState,
    message: '先登录/联系卖家获取卡密'
  };

  const messageElement = previewRoot.querySelector('#preview-message');
  if (messageElement) {
    messageElement.textContent = currentViewState.message;
  }
}

function getCurrentCategory() {
  return categoryCatalog.find((entry) => entry.key === currentViewState.categoryKey) || categoryCatalog[0];
}

function parsePreviewRouteState(hashText) {
  const raw = String(hashText || '').replace(/^#/, '').trim();
  const params = new URLSearchParams(raw);

  return {
    categoryKey: params.get('category') || categoryCatalog[0].key,
    searchKeyword: params.get('search') || ''
  };
}

function syncPreviewRouteState() {
  const params = new URLSearchParams();
  params.set('category', currentViewState.categoryKey);
  if (currentViewState.searchKeyword) {
    params.set('search', currentViewState.searchKeyword);
  }

  const nextHash = `#${params.toString()}`;
  if (window.location.hash === nextHash) {
    return;
  }

  window.history.replaceState(null, '', nextHash);
}

function isMobileUi() {
  return window.matchMedia('(max-width: 720px)').matches;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
