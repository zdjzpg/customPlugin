export function createToolOverviewMarkup(conversions) {
  return conversions
    .map(
      (item) => `
        <article class="tool-overview-card">
          <div class="tool-overview-copy">
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
          <button class="button tool-overview-button" type="button" data-open-detail="${item.key}">
            查看详情
          </button>
        </article>
      `
    )
    .join('');
}

export function createToolDetailMarkup(item) {
  return `
    <article class="tool-detail-card">
      <div class="tool-detail-head">
        <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
        <h3>${item.label}</h3>
        <p>${item.helperText || ''}</p>
      </div>
      <form
        class="tool-form"
        data-conversion-key="${item.key}"
        data-max-file-size-mb="${item.maxFileSizeMb || ''}"
        data-max-total-file-size-mb="${item.maxTotalFileSizeMb || ''}"
      >
        <label class="field">
          <span>选择文件</span>
          <input type="file" data-file-input data-accepts="${item.accepts}" accept="${item.accepts}" ${supportsMultipleFiles(item.key) ? 'multiple' : ''} required />
        </label>
        ${createSelectedFileListMarkup(item)}
        ${createConversionOptionsMarkup(item)}
        <button class="button" type="submit">开始转换</button>
      </form>
      <div class="upload-progress-host" data-progress="${item.key}"></div>
      <div class="tool-results" data-results="${item.key}"></div>
    </article>
  `;
}

function createSelectedFileListMarkup(item) {
  if (item.key !== 'merge_pdf') {
    return '';
  }

  return `
    <div class="selected-file-list" data-selected-file-list>
      <p class="field-tip">按当前顺序合并，后续可在页面中调整上下顺序。</p>
    </div>
  `;
}

export function createStructuredRangeRowMarkup(conversionKey) {
  const hint = conversionKey === 'split_pdf' ? '生成一个拆分文件' : '按这一段顺序提取';
  return `
    <div class="range-row" data-range-row>
      <label class="field">
        <span>开始页</span>
        <input type="number" min="1" step="1" data-range-start placeholder="例如：2" />
      </label>
      <label class="field">
        <span>结束页</span>
        <input type="number" min="1" step="1" data-range-end placeholder="例如：5" />
      </label>
      <div class="range-row-actions">
        <button class="table-action-button" type="button" data-remove-range>删除</button>
        <span class="range-row-hint">${hint}</span>
      </div>
    </div>
  `;
}

function createConversionOptionsMarkup(item) {
  if (item.key === 'pdf_extract_pages') {
    return `
      <label class="field">
        <span>提取页码</span>
        <input type="text" data-range-text placeholder="例如：1,3,5-8" />
      </label>
      <p class="field-tip">按输入顺序提取页面，可填写单页、逗号分隔和连续范围。</p>
      ${createStructuredRangeMarkup('也可以按分段填写')}
    `;
  }

  if (item.key === 'split_pdf') {
    return `
      <label class="field">
        <span>拆分范围</span>
        <textarea data-range-text rows="4" placeholder="每行一个文件，例如：&#10;1-3&#10;4-6&#10;7,9-10"></textarea>
      </label>
      <p class="field-tip">每一行会生成一个 PDF，最后统一打包成 ZIP 下载。</p>
      ${createStructuredRangeMarkup('也可以逐段填写起始页和结束页')}
    `;
  }

  if (item.key === 'compress_pdf') {
    return `
      <label class="field">
        <span>压缩强度</span>
        <select data-compression-level>
          <option value="standard">标准压缩</option>
          <option value="strong">强力压缩</option>
        </select>
      </label>
      <p class="field-tip">标准压缩优先兼顾清晰度，强力压缩优先进一步减小体积。</p>
    `;
  }

  if (item.key === 'pdf_to_word') {
    return `
      <label class="field">
        <span>转换方式</span>
        <select data-pdf-to-word-mode>
          <option value="no_ocr">文本型 PDF</option>
          <option value="ocr">扫描件 OCR</option>
        </select>
      </label>
      <label class="field">
        <span>识别语言</span>
        <select data-ocr-language>
          <option value="chi_sim+eng">中文 + 英文</option>
          <option value="chi_sim">仅中文</option>
          <option value="eng">仅英文</option>
        </select>
      </label>
      <p class="field-tip">文本型 PDF 优先保留排版并导出可编辑 Word；扫描件会先做 OCR 再导出。</p>
    `;
  }

  return '';
}

function createStructuredRangeMarkup(summaryText) {
  return `
    <details class="range-advanced">
      <summary>${summaryText}</summary>
      <div class="range-rows" data-range-rows></div>
      <div class="range-actions">
        <button class="button button-muted range-action-button" type="button" data-add-range>新增一段</button>
      </div>
      <p class="field-tip">如果上面的文本框已经填写，这里的分段输入会被忽略。</p>
    </details>
  `;
}

function supportsMultipleFiles(conversionKey) {
  return conversionKey === 'images_to_pdf' || conversionKey === 'merge_pdf';
}
