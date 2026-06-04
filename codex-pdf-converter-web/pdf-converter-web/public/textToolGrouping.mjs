import { createMobileOverviewMarkup } from './mobileBuyerMarkup.mjs';
import { createToolOverviewMarkup } from './toolCatalogMarkup.mjs';

const groupOrder = ['high_frequency', 'extract_filter', 'list_helper', 'advanced'];

const groupLabels = {
  high_frequency: '高频文本处理',
  extract_filter: '提取与筛选',
  list_helper: '列表与表格辅助',
  advanced: '高级与长尾'
};

export function createTextToolGroupedMarkup(textTools, options = {}) {
  const { mobileMode = false } = options;
  const grouped = groupOrder
    .map((groupKey) => ({
      key: groupKey,
      label: groupLabels[groupKey],
      items: textTools.filter((item) => item.groupKey === groupKey)
    }))
    .filter((group) => group.items.length > 0);

  return grouped
    .map(
      (group) => `
        <section class="text-tool-group-section">
          <div class="text-tool-group-head">
            <h3>${group.label}</h3>
            <p>${group.items.length} 个工具</p>
          </div>
          <div class="${mobileMode ? 'buyer-mobile-list-shell' : 'buyer-tool-list-shell'}">
            ${mobileMode ? createMobileOverviewMarkup(group.items, { showHeader: false }) : createToolOverviewMarkup(group.items)}
          </div>
        </section>
      `
    )
    .join('');
}
