export function createConversionResultMarkup(files, generatedLabel) {
  return files
    .map(
      (file) => `
        <section class="result-card">
          <div class="result-card-head">
            <span class="result-badge">新生成文件</span>
            <span class="result-time">${escapeHtml(generatedLabel)}</span>
          </div>
          <p class="result-file-name">${escapeHtml(file.fileName)}</p>
          <p class="result-file-copy">这是本次转换刚生成的结果文件。</p>
          <a class="result-download" href="${escapeAttribute(file.downloadUrl)}" target="_blank" rel="noreferrer">立即下载</a>
        </section>
      `
    )
    .join('');
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
