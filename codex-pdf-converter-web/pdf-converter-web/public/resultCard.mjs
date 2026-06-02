export function createConversionResultMarkup(files, generatedLabel, summary = null) {
  return files
    .map(
      (file, index) => `
        <section class="result-card">
          <div class="result-card-head">
            <span class="result-badge">新生成文件</span>
            <span class="result-time">${escapeHtml(generatedLabel)}</span>
          </div>
          <p class="result-file-name">${escapeHtml(file.fileName)}</p>
          <p class="result-file-copy">这是本次转换刚生成的结果文件。</p>
          ${index === 0 && (summary || file.summary) ? createSummaryMarkup(summary || file.summary) : ''}
          <a class="result-download" href="${escapeAttribute(file.downloadUrl)}" target="_blank" rel="noreferrer">立即下载</a>
        </section>
      `
    )
    .join('');
}

function createSummaryMarkup(summary) {
  return `
    <div class="result-summary">
      <p class="result-summary-line">压缩强度：${escapeHtml(summary.compressionLevel === 'strong' ? '强力压缩' : '标准压缩')}</p>
      <p class="result-summary-line">压缩前：${escapeHtml(formatBytes(summary.inputSizeBytes))}</p>
      <p class="result-summary-line">压缩后：${escapeHtml(formatBytes(summary.outputSizeBytes))}</p>
      <p class="result-summary-line">减少了：${escapeHtml(formatBytes(summary.savedBytes))}</p>
    </div>
  `;
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  const absolute = Math.abs(bytes);
  if (absolute >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (absolute >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
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
