import { createUuToolCardMarkup } from './toolCardMeta.mjs';

export function createMobileOverviewMarkup(conversions, options = {}) {
  const { showHeader = true } = options;
  return `
    ${showHeader ? `
      <section class="mobile-overview-head">
        <p class="mobile-overview-eyebrow">移动端工具箱</p>
        <h2>选择要处理的文件功能</h2>
        <p>点击进入具体功能页，上传文件后即可开始处理。</p>
      </section>
    ` : ''}
    <div class="buyer-mobile-list-shell tool-group grid-row grid-col-space30">
      ${conversions
        .map((item) => createUuToolCardMarkup(item, createMobileToolSummary(item)))
        .join('')}
    </div>
  `;
}

export function createMobileCategoryOverviewMarkup(categories) {
  return `
    <section class="mobile-overview-head">
      <p class="mobile-overview-eyebrow">工具分类</p>
      <h2>先进入一个分类</h2>
      <p>当前先提供一个统一分类入口，进入后查看全部已实现工具。</p>
    </section>
    <div class="mobile-tool-list">
      ${categories
        .map(
          (category) => `
            <article class="mobile-tool-card">
              <div class="mobile-tool-copy">
                <h3>${category.label}</h3>
                <p>${category.description || ''}</p>
              </div>
              <button class="button mobile-tool-button" type="button" data-open-category="${category.key}">
                进入分类
              </button>
            </article>
          `
        )
        .join('')}
    </div>
  `;
}

export function createMobileDetailScaffold(item) {
  return `
    <section class="mobile-detail-shell">
      <div class="mobile-detail-bar">
        <button class="button button-muted mobile-back-button" type="button" data-back-to-overview>
          返回工具列表
        </button>
        <div class="mobile-detail-copy">
          <p class="mobile-overview-eyebrow">当前功能</p>
          <h2>${item.label}</h2>
        </div>
      </div>
      <div class="mobile-detail-content" data-mobile-detail-content></div>
    </section>
  `;
}

function createMobileToolSummary(item) {
  const text = String(item.helperText || '').trim();
  if (!text) {
    return '打开后即可上传文件并开始处理。';
  }

  return text.replace(/，建议单个文件不超过.*$/, '').replace(/，复杂分页按实际导出结果为准。$/, '。');
}
