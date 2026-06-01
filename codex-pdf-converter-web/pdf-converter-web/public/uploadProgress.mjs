export function createUploadProgressMarkup({ stage, percent, detail }) {
  return `
    <section class="upload-progress-card upload-progress-${escapeHtml(stage)}">
      <div class="upload-progress-head">
        <span class="upload-progress-title">${escapeHtml(getUploadStageText(stage))}</span>
        <span class="upload-progress-percent">${Math.max(0, Math.min(100, Math.round(percent)))}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: ${Math.max(0, Math.min(100, Math.round(percent)))}%"></div>
      </div>
      <p class="upload-progress-detail">${escapeHtml(detail || getUploadStageText(stage))}</p>
    </section>
  `;
}

export function getUploadStageText(stage) {
  if (stage === 'uploading') {
    return '正在上传文件...';
  }

  if (stage === 'processing') {
    return '文件已上传，正在生成结果...';
  }

  if (stage === 'error') {
    return '上传或转换失败。';
  }

  return '准备上传...';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
