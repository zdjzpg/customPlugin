import { createCategoryIconMarkup } from './categoryIconMarkup.mjs';

export function createBuyerShellMarkup(input) {
  const {
    title,
    titleDescription = '',
    searchKeyword = '',
    mobileNavOpen = false,
    quickKeywords = [],
    categories = [],
    activeCategoryKey = '',
    contentMarkup = ''
  } = input;

  return `
    <div class="buyer-station-shell" data-buyer-motion-root>
      <header class="buyer-topbar" data-buyer-topbar data-animate-topbar>
        <div class="buyer-brand">
          <div class="buyer-brand-mark" aria-hidden="true">
            <img class="brand-mark-icon" src="/brand-mark.svg?v=20260604" alt="" />
          </div>
          <div class="buyer-brand-copy">
            <strong>轻舟文件工具站</strong>
            <span>文件、图像与文本处理一站完成</span>
          </div>
        </div>
        <div class="buyer-topbar-actions">
          <button class="buyer-mobile-nav-toggle" type="button" data-mobile-nav-toggle aria-label="打开分类菜单">
            ☰
          </button>
        </div>
      </header>
      <div class="buyer-layout">
        <aside class="buyer-side-nav" data-desktop-side-nav>
          <nav class="buyer-side-nav-list" data-animate-side-nav>
            ${categories
              .map(
                (category) => `
                <button
                  class="buyer-side-nav-item ${category.key === activeCategoryKey ? 'buyer-side-nav-item-active' : ''}"
                  type="button"
                  data-open-category="${category.key}"
                >
                  <span class="buyer-side-nav-icon" aria-hidden="true">${createCategoryIconMarkup(category.key)}</span>
                  <span>${category.label}</span>
                </button>
                `
              )
              .join('')}
          </nav>
        </aside>
        <main class="buyer-main-shell">
          <section class="buyer-search-panel" data-animate-search-panel>
            <div class="buyer-search-row">
              <label class="buyer-search-input-wrap">
                <span class="buyer-search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value="${escapeHtml(searchKeyword)}"
                  placeholder="搜索全部工具，支持工具名、用途和关键词"
                  data-tool-search-input
                />
              </label>
              <button class="buyer-search-button" type="button">搜索</button>
            </div>
            <div class="buyer-search-chips">
              ${quickKeywords
                .map(
                  (keyword) => `
                    <button class="buyer-search-chip" type="button" data-search-chip="${escapeAttribute(keyword)}">
                      ${escapeHtml(keyword)}
                    </button>
                  `
                )
                .join('')}
            </div>
          </section>
          <section class="buyer-current-title" data-animate-current-title>
            <h1>${escapeHtml(title)}</h1>
            ${titleDescription ? `<p data-buyer-title-copy>${escapeHtml(titleDescription)}</p>` : ''}
          </section>
          <div class="buyer-content-shell" data-buyer-content-slot>
            ${contentMarkup}
          </div>
        </main>
      </div>
      <div class="buyer-mobile-nav-panel ${mobileNavOpen ? '' : 'hidden'}" data-mobile-category-list>
        <div class="buyer-mobile-nav-head">
          <strong>进入工具分类</strong>
          <button class="buyer-mobile-nav-close" type="button" data-close-mobile-nav>关闭</button>
        </div>
        <div class="buyer-mobile-nav-list">
          ${categories
            .map(
              (category) => `
                <button
                  class="buyer-mobile-nav-item ${category.key === activeCategoryKey ? 'buyer-mobile-nav-item-active' : ''}"
                  type="button"
                  data-open-category="${category.key}"
                >
                  <span class="buyer-mobile-nav-item-icon" aria-hidden="true">${createCategoryIconMarkup(category.key)}</span>
                  ${category.label}
                </button>
              `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
