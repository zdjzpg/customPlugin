export function createUsageStatsFilterMarkup(filter) {
  const currentPreset = filter?.preset || 'last7days';
  const dateFrom = escapeHtml(filter?.dateFrom || '');
  const dateTo = escapeHtml(filter?.dateTo || '');

  return `
    <form class="form-grid admin-stats-filter" id="usage-stats-filter-form">
      <label class="field">
        <span>时间范围</span>
        <select id="usage-stats-preset" name="preset">
          ${createPresetOption('today', '今天', currentPreset)}
          ${createPresetOption('yesterday', '昨天', currentPreset)}
          ${createPresetOption('last7days', '近7天', currentPreset)}
          ${createPresetOption('last30days', '近30天', currentPreset)}
          ${createPresetOption('custom', '自定义日期', currentPreset)}
        </select>
      </label>
      <label class="field">
        <span>开始日期</span>
        <input id="usage-stats-date-from" name="dateFrom" type="date" value="${dateFrom}" />
      </label>
      <label class="field">
        <span>结束日期</span>
        <input id="usage-stats-date-to" name="dateTo" type="date" value="${dateTo}" />
      </label>
      <button class="button" type="submit">查询统计</button>
    </form>
  `;
}

export function createUsageStatsTableMarkup(stats) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return '<tr><td colspan="3">当前范围内还没有统计数据。</td></tr>';
  }

  return stats
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.day)}</td>
          <td>${escapeHtml(formatConversionKey(item.conversionKey))}</td>
          <td>${escapeHtml(item.count)}</td>
        </tr>
      `
    )
    .join('');
}

function createPresetOption(value, label, currentPreset) {
  return `<option value="${value}" ${currentPreset === value ? 'selected' : ''}>${label}</option>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatConversionKey(conversionKey) {
  const labels = {
    word_to_pdf: 'Word 转 PDF',
    pdf_to_word: 'PDF 转 Word',
    pdf_to_images: 'PDF 转图片',
    images_to_pdf: '图片转 PDF',
    merge_pdf: 'PDF 合并',
    compress_pdf: 'PDF 压缩',
    pdf_extract_pages: 'PDF 提取页面',
    split_pdf: '拆分 PDF'
  };

  return labels[conversionKey] || conversionKey;
}
