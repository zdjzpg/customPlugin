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
    pdf_to_pptx: 'PDF 转 PPT',
    pdf_to_word: 'PDF 转 Word',
    pdf_to_images: 'PDF 转图片',
    images_to_pdf: '图片转 PDF',
    merge_pdf: 'PDF 合并',
    compress_pdf: 'PDF 压缩',
    pdf_extract_pages: 'PDF 提取页面',
    split_pdf: '拆分 PDF',
    dev_sitemap_extract: 'sitemap 链接提取',
    dev_html_link_extract: '网页链接提取',
    dev_ssl_check: '网站 SSL 证书检测',
    dev_ssl_expiry_check: 'SSL 证书过期查询',
    dev_ssl_cert_parse: 'SSL 证书解析',
    dev_gzip_check: '网页 gzip 压缩检测',
    dev_brotli_check: '网页 brotli 压缩检测',
    dev_redirect_analysis: 'URL 重定向分析',
    dev_whois_lookup: '域名 whois 查询',
    dev_cdn_check: '网站 CDN 检测',
    dev_meta_info_check: '网页 meta 信息检测',
    dev_tdk_check: '网页 TDK 信息检测',
    dev_keyword_density_check: '网页关键词密度检测',
    dev_spider_preview: '网页蜘蛛模拟抓取'
  };

  return labels[conversionKey] || conversionKey;
}
