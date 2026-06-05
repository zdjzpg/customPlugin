import { createUuToolCardMarkup } from './toolCardMeta.mjs';

const externalDevToolUrlMap = {
  dev_qq_block_check: 'https://uutool.cn/block-qq/',
  dev_wechat_block_check: 'https://uutool.cn/block-wechat/',
  dev_cdn_node_ip_check: 'https://uutool.cn/cdn-ip/',
  dev_seo_backlink_publish: 'https://uutool.cn/seo/',
  dev_image_to_base64: 'https://uutool.cn/img2base64/',
  dev_base64_to_image: 'https://uutool.cn/img2base64/',
  dev_rich_text_editor: 'https://uutool.cn/ueditor/',
  dev_ckeditor4: 'https://uutool.cn/ckeditor4/',
  dev_ckeditor5: 'https://uutool.cn/ckeditor5/',
  dev_tinymce: 'https://uutool.cn/tinymce/',
  dev_win_desktop_client_generator: 'https://uutool.cn/win/',
  dev_bt_firewall_ip_import: 'https://uutool.cn/bt-firewall/',
  dev_fontawesome_to_image: 'https://uutool.cn/fa2img/',
  dev_dlib_face_landmarks: 'https://uutool.cn/landmark/'
};

export function createToolOverviewMarkup(conversions) {
  return conversions
    .map(
      (item) => {
        return createUuToolCardMarkup(item, createToolSummary(item));
      }
    )
    .join('');
}

export function createPreviewToolOverviewMarkup(conversions) {
  return conversions
    .map(
      (item) => {
        return createUuToolCardMarkup(item, createToolSummary(item), {
          interactionMode: 'preview'
        });
      }
    )
    .join('');
}

export function createToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  if (item.kind === 'local_text') {
    return createEnhancedLocalTextToolDetailMarkup(item, options);
  }
  if (item.kind === 'local_image_tool') {
    return createEnhancedLocalImageToolDetailMarkup(item, options);
  }
  if (item.kind === 'local_media_tool') {
    return createLocalMediaToolDetailMarkup(item, options);
  }
  if (item.kind === 'server_media_tool') {
    return createServerMediaToolDetailMarkup(item, options);
  }
  if (['local_dev_tool', 'backend_dev_tool', 'network_dev_tool', 'server_dev_tool'].includes(item.kind)) {
    return createDevToolDetailMarkup(item, options);
  }
  if (item.requiresUpload === false) {
    return createNoUploadToolDetailMarkup(item, options);
  }

  const submitLabel = item.kind === 'file_media_tool' ? '开始处理' : '开始转换';
  const requiresUpload = item.requiresUpload !== false;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form
        class="tool-form"
        data-conversion-key="${item.key}"
        data-max-file-size-mb="${item.maxFileSizeMb || ''}"
        data-max-total-file-size-mb="${item.maxTotalFileSizeMb || ''}"
      >
        ${requiresUpload ? `
          <label class="field">
            <span>选择文件</span>
            <input type="file" data-file-input data-accepts="${item.accepts}" accept="${item.accepts}" ${supportsMultipleFiles(item) ? 'multiple' : ''} required />
          </label>
          ${createSelectedFileListMarkup(item)}
        ` : ''}
        ${createConversionOptionsMarkup(item)}
        <button class="button" type="submit">${submitLabel}</button>
      </form>
      <div class="upload-progress-host" data-progress="${item.key}"></div>
      <div class="tool-results" data-results="${item.key}"></div>
    </article>
  `;
}

function createNoUploadToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form
        class="tool-form"
        data-conversion-key="${item.key}"
        data-max-file-size-mb="${item.maxFileSizeMb || ''}"
        data-max-total-file-size-mb="${item.maxTotalFileSizeMb || ''}"
      >
        ${createConversionOptionsMarkup(item)}
        <button class="button" type="submit">开始转换</button>
      </form>
      <div class="upload-progress-host" data-progress="${item.key}"></div>
      <div class="tool-results" data-results="${item.key}"></div>
    </article>
  `;
}

function createEnhancedLocalImageToolDetailMarkup(item, options = {}) {
  if (item.key === 'image_add_border_frame') {
    return createBorderLocalImageToolDetailMarkup(item, options);
  }
  if (item.key === 'image_platform_cover_template') {
    return createPlatformTemplateLocalImageToolDetailMarkup(item, options);
  }
  if (item.key === 'image_annotate_canvas') {
    return createAnnotateLocalImageToolDetailMarkup(item, options);
  }
  return createLocalImageToolDetailMarkup(item, options);
}

function createBorderLocalImageToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
        <label class="field field-wide">
          <span>选择图片</span>
          <input type="file" data-local-image-file-input accept="${item.accepts}" required />
        </label>
        <label class="field">
          <span>边框样式</span>
          <select data-image-border-style>
            <option value="solid">纯色边框</option>
            <option value="gradient">渐变边框</option>
          </select>
        </label>
        <label class="field">
          <span>边框宽度</span>
          <input type="number" min="0" max="200" step="1" data-image-border-width value="18" />
        </label>
        <label class="field">
          <span>内边距</span>
          <input type="number" min="0" max="400" step="1" data-image-padding value="60" />
        </label>
        <label class="field">
          <span>圆角</span>
          <input type="number" min="0" max="200" step="1" data-image-corner-radius value="36" />
        </label>
        <label class="field">
          <span>阴影强度</span>
          <input type="number" min="0" max="80" step="1" data-image-shadow-strength value="18" />
        </label>
        <label class="field">
          <span>边框颜色</span>
          <input type="color" data-image-border-color value="#2563eb" />
        </label>
        <label class="field">
          <span>渐变起点</span>
          <input type="color" data-image-gradient-start value="#2563eb" />
        </label>
        <label class="field">
          <span>渐变终点</span>
          <input type="color" data-image-gradient-end value="#7c3aed" />
        </label>
        <label class="field">
          <span>导出格式</span>
          <select data-image-output-format>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </label>
        <button class="button" type="submit">生成预览</button>
      </form>
      ${createSharedLocalImageResultHost(item, { canvasHeight: 900 })}
    </article>
  `;
}

function createPlatformTemplateLocalImageToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
        <label class="field field-wide">
          <span>选择图片</span>
          <input type="file" data-local-image-file-input accept="${item.accepts}" required />
        </label>
        <label class="field">
          <span>目标模板</span>
          <select data-image-template-preset>
            <option value="xianyu_main">闲鱼主图</option>
            <option value="xiaohongshu_cover">小红书封面</option>
            <option value="pengyouquan_single">朋友圈单图</option>
            <option value="wechat_article_cover">公众号首图</option>
            <option value="ppt_cover">PPT 封面</option>
          </select>
        </label>
        <label class="field">
          <span>铺图方式</span>
          <select data-image-fit-mode>
            <option value="cover">铺满裁切</option>
            <option value="contain">完整居中留白</option>
            <option value="stretch">拉伸铺满</option>
          </select>
        </label>
        <label class="field">
          <span>背景模式</span>
          <select data-image-template-bg-mode>
            <option value="solid">纯色背景</option>
            <option value="blur">模糊铺底</option>
          </select>
        </label>
        <label class="field">
          <span>背景颜色</span>
          <input type="color" data-image-template-bg-color value="#f3f4f6" />
        </label>
        <div class="field field-wide">
          <span>批量导出模板</span>
          <div class="local-image-template-checkbox-grid">
            <label class="local-image-checkbox"><input type="checkbox" data-image-batch-template-option value="xianyu_main" checked /> 闲鱼主图</label>
            <label class="local-image-checkbox"><input type="checkbox" data-image-batch-template-option value="xiaohongshu_cover" checked /> 小红书封面</label>
            <label class="local-image-checkbox"><input type="checkbox" data-image-batch-template-option value="pengyouquan_single" /> 朋友圈单图</label>
            <label class="local-image-checkbox"><input type="checkbox" data-image-batch-template-option value="wechat_article_cover" /> 公众号首图</label>
            <label class="local-image-checkbox"><input type="checkbox" data-image-batch-template-option value="ppt_cover" /> PPT 封面</label>
          </div>
        </div>
        <label class="field">
          <span>导出格式</span>
          <select data-image-output-format>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </label>
        <div class="local-image-action-row">
          <button class="button" type="submit">生成预览</button>
          <button class="button button-muted" type="button" data-local-image-batch-export>批量导出 ZIP</button>
        </div>
      </form>
      ${createSharedLocalImageResultHost(item, { canvasWidth: 1242, canvasHeight: 1660 })}
    </article>
  `;
}

function createAnnotateLocalImageToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
        <label class="field field-wide">
          <span>选择图片</span>
          <input type="file" data-local-image-file-input accept="${item.accepts}" required />
        </label>
        <label class="field">
          <span>标注类型</span>
          <select data-image-annotation-mode>
            <option value="arrow">箭头</option>
            <option value="rect">矩形框</option>
            <option value="circle">圆形框</option>
            <option value="number">序号点</option>
            <option value="text">文字注释</option>
            <option value="mosaic">局部马赛克</option>
          </select>
        </label>
        <label class="field">
          <span>说明文字</span>
          <input type="text" data-image-annotation-label value="1" placeholder="序号或说明文字" />
        </label>
        <label class="field">
          <span>方向</span>
          <select data-image-arrow-direction>
            <option value="right_up">右上</option>
            <option value="right_down">右下</option>
            <option value="left_up">左上</option>
            <option value="left_down">左下</option>
          </select>
        </label>
        <label class="field">
          <span>颜色</span>
          <input type="color" data-image-annotation-color value="#ff3355" />
        </label>
        <label class="field">
          <span>线宽</span>
          <input type="number" min="1" max="48" step="1" data-image-annotation-line-width value="6" />
        </label>
        <label class="field">
          <span>尺寸</span>
          <input type="number" min="24" max="400" step="1" data-image-annotation-size value="96" />
        </label>
        <label class="field">
          <span>局部马赛克</span>
          <input type="number" min="4" max="64" step="1" data-image-annotation-mosaic value="14" />
        </label>
        <label class="field">
          <span>导出格式</span>
          <select data-image-output-format>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </label>
        <p class="field-tip">先加载画布，再点击下方预览区域即可逐个添加标注。</p>
        <button class="button" type="submit">加载画布</button>
      </form>
      <div class="tool-results" data-results="${item.key}">
        <div class="local-image-result-shell">
          <p class="field-tip" data-local-image-status>选择图片后可直接生成预览并导出。</p>
          <div class="local-image-action-row">
            <button class="button button-muted" type="button" data-local-image-undo>撤销最后一个</button>
            <button class="button button-muted" type="button" data-local-image-clear>清空标注</button>
          </div>
          <div class="local-image-preview-shell">
            <canvas class="local-image-preview-canvas local-image-preview-canvas-annotate" data-local-image-preview width="1200" height="900"></canvas>
          </div>
          <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
        </div>
      </div>
    </article>
  `;
}

function createSharedLocalImageResultHost(item, options = {}) {
  const canvasWidth = options.canvasWidth || 1200;
  const canvasHeight = options.canvasHeight || 900;
  return `
    <div class="tool-results" data-results="${item.key}">
      <div class="local-image-result-shell">
        <p class="field-tip" data-local-image-status>选择图片后可直接生成预览并导出。</p>
        <div class="local-image-preview-shell">
          <canvas class="local-image-preview-canvas" data-local-image-preview width="${canvasWidth}" height="${canvasHeight}"></canvas>
        </div>
        <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
      </div>
    </div>
  `;
}

function createEnhancedLocalTextToolDetailMarkup(item, options = {}) {
  if (item.key === 'text_srt_to_text' || item.key === 'text_text_to_srt') {
    return createSubtitleLocalTextToolDetailMarkup(item, options);
  }
  return createLocalTextToolDetailMarkup(item, options);
}

function createSubtitleLocalTextToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-text" data-conversion-key="${item.key}" data-tool-kind="local_text">
        ${item.key === 'text_srt_to_text' ? `
          <label class="field field-wide">
            <span>字幕文件</span>
            <input type="file" data-local-text-file-input accept=".srt" />
          </label>
        ` : ''}
        <label class="field field-wide">
          <span>原始文本</span>
          <textarea data-source-text rows="10" placeholder="${item.key === 'text_srt_to_text' ? '请粘贴 SRT 内容，或直接上传字幕文件' : '请每行输入一条字幕文本'}"></textarea>
        </label>
        ${item.key === 'text_text_to_srt' ? `
          <label class="field">
            <span>每条字幕时长</span>
            <input type="number" min="0.2" max="30" step="0.1" data-subtitle-duration-seconds value="2.5" />
          </label>
          <label class="field">
            <span>起始时间</span>
            <input type="text" data-subtitle-start-time value="00:00:05,000" placeholder="例如：00:00:05,000" />
          </label>
        ` : ''}
        <button class="button" type="submit">开始处理</button>
      </form>
      <div class="tool-results" data-results="${item.key}">
        <div class="text-tool-result-shell">
          <div class="text-tool-result-summary hidden" data-text-tool-summary></div>
          <label class="field field-wide">
            <span>处理结果</span>
            <textarea data-output-text rows="10" readonly placeholder="处理结果会显示在这里"></textarea>
          </label>
          <a class="button button-muted hidden" data-text-download-link download="${item.key === 'text_text_to_srt' ? 'generated-subtitles.srt' : 'subtitle-text.txt'}">导出文件</a>
          <button class="button button-muted" type="button" data-copy-output="${item.key}">复制结果</button>
        </div>
      </div>
    </article>
  `;
}

function createLocalImageToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  if (item.key === 'image_add_border_frame') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>边框样式</span>
            <select data-image-border-style>
              <option value="solid">纯色边框</option>
              <option value="gradient">渐变边框</option>
            </select>
          </label>
          <label class="field">
            <span>边框宽度</span>
            <input type="number" min="0" max="120" step="1" data-image-border-width value="16" />
          </label>
          <label class="field">
            <span>阴影强度</span>
            <input type="number" min="0" max="80" step="1" data-image-shadow-strength value="18" />
          </label>
          <label class="field">
            <span>圆角半径</span>
            <input type="number" min="0" max="240" step="1" data-image-corner-radius value="28" />
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_privacy_redact') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>打码方式</span>
            <select data-image-redact-mode>
              <option value="mosaic">局部马赛克</option>
              <option value="blur">模糊打码</option>
              <option value="fill">纯色遮挡</option>
            </select>
          </label>
          <label class="field">
            <span>打码区域大小</span>
            <input type="number" min="24" max="1200" step="4" data-image-redact-size value="160" />
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        <div class="tool-results" data-results="${item.key}">
          <div class="local-image-result-shell">
            <div class="button-row">
              <button class="button button-muted" type="button" data-local-image-undo>撤销一步</button>
              <button class="button button-muted" type="button" data-local-image-clear>清空打码</button>
            </div>
            <p class="field-tip" data-local-image-status>选择图片后点击画布即可添加打码区域。</p>
            <div class="local-image-preview-shell">
              <canvas class="local-image-preview-canvas local-image-preview-canvas-annotate" data-local-image-preview width="1200" height="900"></canvas>
            </div>
            <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
          </div>
        </div>
      </article>
    `;
  }

  if (item.key === 'image_blur_background_fill') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>目标比例</span>
            <select data-social-cover-ratio>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="3:4">3:4</option>
              <option value="9:16">9:16</option>
            </select>
          </label>
          <label class="field">
            <span>模糊强度</span>
            <input type="number" min="8" max="48" step="1" data-image-blur-radius value="28" />
          </label>
          <label class="field">
            <span>导出格式</span>
            <select data-image-output-format>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 1200)}
      </article>
    `;
  }

  if (item.key === 'image_flip_mirror') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>翻转方向</span>
            <select data-image-flip-mode>
              <option value="horizontal">水平镜像</option>
              <option value="vertical">垂直翻转</option>
              <option value="both">双向翻转</option>
            </select>
          </label>
          <label class="field">
            <span>导出格式</span>
            <select data-image-output-format>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_metadata_view_clear') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>处理模式</span>
            <select data-image-metadata-mode>
              <option value="view">仅查看</option>
              <option value="clear">清除元数据并导出</option>
            </select>
          </label>
          <label class="field">
            <span>导出格式</span>
            <select data-image-output-format>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <button class="button" type="submit">读取信息</button>
        </form>
        <div class="tool-results" data-results="${item.key}">
          <div class="local-image-result-shell">
            <p class="field-tip" data-local-image-status>选择图片后可查看基本信息，或导出去除元数据后的图片。</p>
            <label class="field field-wide">
              <span>元数据预览</span>
              <textarea data-local-image-metadata-output rows="7" readonly placeholder="图片信息会显示在这里"></textarea>
            </label>
            <div class="local-image-preview-shell">
              <canvas class="local-image-preview-canvas" data-local-image-preview width="1200" height="900"></canvas>
            </div>
            <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
          </div>
        </div>
      </article>
    `;
  }

  if (item.key === 'image_blur_redact') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>处理方式</span>
            <select data-image-redact-mode>
              <option value="blur">模糊</option>
              <option value="mosaic">马赛克</option>
            </select>
          </label>
          <label class="field">
            <span>区域宽度</span>
            <input type="number" min="24" max="1200" step="4" data-image-redact-size value="160" />
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        <div class="tool-results" data-results="${item.key}">
          <div class="local-image-result-shell">
            <div class="button-row">
              <button class="button button-muted" type="button" data-local-image-undo>撤销一步</button>
              <button class="button button-muted" type="button" data-local-image-clear>清空打码</button>
            </div>
            <p class="field-tip" data-local-image-status>选择图片后点击画布即可添加模糊或马赛克区域。</p>
            <div class="local-image-preview-shell">
              <canvas class="local-image-preview-canvas local-image-preview-canvas-annotate" data-local-image-preview width="1200" height="900"></canvas>
            </div>
            <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
          </div>
        </div>
      </article>
    `;
  }

  if (item.key === 'image_rotate_adjust') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>旋转角度</span>
            <input type="number" min="-270" max="270" step="1" data-image-rotate-angle value="90" />
          </label>
          <div class="button-row">
            <button class="button button-muted" type="button" data-image-rotate-preset="90">90°</button>
            <button class="button button-muted" type="button" data-image-rotate-preset="180">180°</button>
            <button class="button button-muted" type="button" data-image-rotate-preset="270">270°</button>
          </div>
          <label class="field">
            <span>导出格式</span>
            <select data-image-output-format>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_object_erase_light') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>笔刷大小</span>
            <input type="number" min="12" max="480" step="2" data-image-erase-brush-size value="64" />
          </label>
          <label class="field">
            <span>取样偏移</span>
            <input type="number" min="4" max="160" step="1" data-image-erase-sample-offset value="20" />
          </label>
          <p class="field-tip">轻量版：点击局部区域后，会按附近颜色做涂抹覆盖。</p>
          <button class="button" type="submit">加载画布</button>
        </form>
        <div class="tool-results" data-results="${item.key}">
          <div class="local-image-result-shell">
            <div class="button-row">
              <button class="button button-muted" type="button" data-local-image-undo>撤销一步</button>
              <button class="button button-muted" type="button" data-local-image-clear>清空消除</button>
            </div>
            <p class="field-tip" data-local-image-status>轻量版局部涂抹消除已就绪，点击画布可快速覆盖小杂物。</p>
            <div class="local-image-preview-shell">
              <canvas class="local-image-preview-canvas local-image-preview-canvas-annotate" data-local-image-preview width="1200" height="900"></canvas>
            </div>
            <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
          </div>
        </div>
      </article>
    `;
  }

  if (item.key === 'image_flip_mirror') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>翻转方向</span>
            <select data-image-flip-direction>
              <option value="horizontal">水平镜像</option>
              <option value="vertical">垂直翻转</option>
              <option value="both">双向翻转</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_metadata_view_clear') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>处理模式</span>
            <select data-image-metadata-mode>
              <option value="view">查看元数据</option>
              <option value="clear">清除元数据</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_blur_redact') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>模糊方式</span>
            <select data-image-blur-redact-mode>
              <option value="blur">局部模糊</option>
              <option value="mosaic">局部马赛克</option>
            </select>
          </label>
          <label class="field">
            <span>模糊半径</span>
            <input type="number" min="4" max="48" step="1" data-image-blur-radius value="18" />
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_rotate_adjust') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>旋转角度</span>
            <input type="number" min="-180" max="180" step="1" data-image-rotate-angle value="90" />
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_object_erase_light') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>笔刷大小</span>
            <input type="number" min="8" max="128" step="1" data-image-erase-brush-size value="32" />
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1200, 900)}
      </article>
    `;
  }

  if (item.key === 'image_platform_cover_template') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>目标模板</span>
            <select data-image-platform-preset>
              <option value="xianyu_main">闲鱼主图</option>
              <option value="xiaohongshu_cover">小红书封面</option>
              <option value="pengyouquan_single">朋友圈单图</option>
            </select>
          </label>
          <label class="field">
            <span>铺图模式</span>
            <select data-image-platform-fit-mode>
              <option value="contain">完整显示</option>
              <option value="cover">铺满裁切</option>
            </select>
          </label>
          <label class="field">
            <span>背景模式</span>
            <select data-image-platform-background-mode>
              <option value="solid">纯色铺底</option>
              <option value="blur">模糊铺底</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        ${createLocalImageResultShell(item.key, 1242, 1660)}
      </article>
    `;
  }

  if (item.key === 'image_annotate_canvas') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>标注类型</span>
            <select data-image-annotation-mode>
              <option value="arrow">箭头</option>
              <option value="rect">矩形框</option>
              <option value="number">序号点</option>
              <option value="mosaic">局部马赛克</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        <div class="tool-results" data-results="${item.key}">
          <div class="local-image-result-shell">
            <div class="button-row">
              <button class="button button-muted" type="button" data-local-image-undo>撤销一步</button>
              <button class="button button-muted" type="button" data-local-image-clear>清空标注</button>
            </div>
            <p class="field-tip" data-local-image-status>选择图片后可直接生成预览并导出。</p>
            <div class="local-image-preview-shell">
              <canvas class="local-image-preview-canvas" data-local-image-preview width="1200" height="900"></canvas>
            </div>
            <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
          </div>
        </div>
      </article>
    `;
  }

  if (item.key === 'image_social_cover_pad') {
    return `
      <article class="tool-detail-card">
        ${showHeader ? `
          <div class="tool-detail-head">
            <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
            <h3>${item.label}</h3>
            <p>${item.helperText || ''}</p>
          </div>
        ` : ''}
        <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
          <label class="field field-wide">
            <span>选择图片</span>
            <input type="file" data-local-image-file-input accept="${item.accepts}" required />
          </label>
          <label class="field">
            <span>目标比例</span>
            <select data-social-cover-ratio>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="3:4">3:4</option>
              <option value="9:16">9:16</option>
            </select>
          </label>
          <label class="field">
            <span>背景模式</span>
            <select data-social-cover-background-mode>
              <option value="solid">纯色背景</option>
              <option value="blur">模糊原图背景</option>
            </select>
          </label>
          <label class="field">
            <span>背景颜色</span>
            <input type="color" data-background-color value="#ffffff" />
          </label>
          <label class="field">
            <span>导出格式</span>
            <select data-image-output-format>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <button class="button" type="submit">生成预览</button>
        </form>
        <div class="tool-results" data-results="${item.key}">
          ${createLocalImageResultShell(item.key, 1200, 1200)}
        </div>
      </article>
    `;
  }

  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-image" data-conversion-key="${item.key}" data-tool-kind="local_image_tool">
        <label class="field field-wide">
          <span>选择图片</span>
          <input type="file" data-local-image-file-input accept="${item.accepts}" required />
        </label>
        <label class="field field-wide">
          <span>主标题</span>
          <input type="text" data-image-text-title value="主标题示例" placeholder="输入大标题" />
        </label>
        <label class="field field-wide">
          <span>副标题</span>
          <input type="text" data-image-text-subtitle value="这里可以放副标题或说明文案" placeholder="输入副标题" />
        </label>
        <label class="field">
          <span>角标</span>
          <input type="text" data-image-text-badge value="限时" placeholder="例如：限时 / 教程 / 干货" />
        </label>
        <label class="field">
          <span>版式</span>
          <select data-image-layout-preset>
            <option value="top_banner">顶部横幅</option>
            <option value="center_focus">中间聚焦</option>
            <option value="bottom_caption">底部说明</option>
          </select>
        </label>
        <label class="field">
          <span>标题字号</span>
          <input type="number" min="20" max="240" step="1" data-image-title-size value="88" />
        </label>
        <label class="field">
          <span>副标题字号</span>
          <input type="number" min="14" max="140" step="1" data-image-subtitle-size value="40" />
        </label>
        <label class="field">
          <span>角标字号</span>
          <input type="number" min="12" max="96" step="1" data-image-badge-size value="28" />
        </label>
        <label class="field">
          <span>主文字颜色</span>
          <input type="color" data-image-text-color value="#ffffff" />
        </label>
        <label class="field">
          <span>角标文字色</span>
          <input type="color" data-image-badge-text-color value="#ffffff" />
        </label>
        <label class="field">
          <span>描边颜色</span>
          <input type="color" data-image-stroke-color value="#111827" />
        </label>
        <label class="field">
          <span>描边宽度</span>
          <input type="number" min="0" max="32" step="1" data-image-stroke-width value="4" />
        </label>
        <label class="field">
          <span>文字底板色</span>
          <input type="color" data-image-overlay-color value="#111827" />
        </label>
        <label class="field">
          <span>角标底色</span>
          <input type="color" data-image-badge-bg-color value="#ef4444" />
        </label>
        <label class="field">
          <span>导出格式</span>
          <select data-image-output-format>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </label>
        <button class="button" type="submit">生成预览</button>
      </form>
      ${createLocalImageResultShell(item.key, 1200, 900)}
    </article>
  `;
}

function createLocalImageResultShell(toolKey, canvasWidth, canvasHeight) {
  return `
    <div class="tool-results" data-results="${toolKey}">
      <div class="local-image-result-shell">
        <p class="field-tip" data-local-image-status>选择图片后可直接生成预览并导出。</p>
        <div class="local-image-preview-shell">
          <canvas class="local-image-preview-canvas" data-local-image-preview width="${canvasWidth}" height="${canvasHeight}"></canvas>
        </div>
        <a class="button button-muted hidden" data-local-image-download download>导出图片</a>
      </div>
    </div>
  `;
}

function createLocalMediaToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-media" data-conversion-key="${item.key}" data-tool-kind="local_media_tool">
        ${createLocalMediaToolPrimaryInputMarkup(item)}
        ${createLocalMediaToolOptionsMarkup(item)}
        <button class="button" type="submit">${item.key === 'media_tone_generator' || item.key === 'media_white_noise_generator' ? '生成音频' : item.key === 'media_video_speed_preview' ? '加载视频' : '加载音频'}</button>
      </form>
      <div class="tool-results" data-results="${item.key}">
        ${createLocalMediaToolResultMarkup(item)}
      </div>
    </article>
  `;
}

function createServerMediaToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-text" data-conversion-key="${item.key}" data-tool-kind="server_media_tool">
        <label class="field field-wide">
          <span>待合成文本</span>
          <textarea data-media-source-text rows="8" placeholder="请输入要转换成语音的文本内容"></textarea>
        </label>
        <label class="field">
          <span>语言</span>
          <select data-media-language>
            <option value="zh">中文普通话</option>
            <option value="en">英文</option>
          </select>
        </label>
        <label class="field">
          <span>输出格式</span>
          <select data-media-output-format>
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
          </select>
        </label>
        <button class="button" type="submit">开始合成</button>
      </form>
      <div class="upload-progress-host" data-progress="${item.key}"></div>
      <div class="tool-results" data-results="${item.key}"></div>
    </article>
  `;
}

function createDevToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  const externalToolUrl = externalDevToolUrlMap[item.key];
  if (externalToolUrl) {
    return createExternalDevToolDetailMarkup(item, externalToolUrl, showHeader);
  }

  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-text" data-conversion-key="${item.key}" data-tool-kind="${item.kind}">
        ${createDevToolPrimaryInputMarkup(item)}
        ${createDevToolOptionsMarkup(item)}
        <button class="button" type="submit">开始处理</button>
      </form>
      <div class="tool-results" data-results="${item.key}">
        ${createDevToolResultMarkup(item)}
      </div>
    </article>
  `;
}

function createExternalDevToolDetailMarkup(item, externalToolUrl, showHeader) {
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <div class="text-tool-result-shell remote-tool-shell">
        <p class="field-tip">直接加载 UU 原始工具页，复杂编辑器与图像工具保持现成前端资源。</p>
        <a class="button button-muted remote-tool-link" href="${externalToolUrl}" target="_blank" rel="noreferrer">新窗口打开</a>
        <iframe class="remote-tool-frame" data-remote-tool-frame src="${externalToolUrl}" title="${item.label}" loading="lazy" referrerpolicy="no-referrer"></iframe>
      </div>
    </article>
  `;
}

function createDevToolPrimaryInputMarkup(item) {
  if (item.key === 'dev_ssl_cert_parse') {
    return `
      <label class="field field-wide">
        <span>证书内容</span>
        <textarea data-certificate-text rows="10" placeholder="请粘贴 PEM 或 Base64 证书文本"></textarea>
      </label>
    `;
  }

  if (['dev_browser_fingerprint_check', 'dev_multi_source_ip_check', 'dev_ipv6_check', 'dev_web_meta_generate'].includes(item.key)) {
    if (item.key === 'dev_web_meta_generate') {
      return '';
    }
    if (item.key === 'dev_ipv6_check') {
      return '<p class="field-tip">点击开始处理后检测当前网络是否支持 IPv6，并输出检测结果。</p>';
    }
    return '<p class="field-tip">点击开始处理后读取当前浏览器环境信息并输出检测结果。</p>';
  }

  if (['dev_ip_generate', 'dev_ip_random_generate', 'dev_mac_generate', 'dev_random_color_generate'].includes(item.key)) {
    return '<p class="field-tip">设置生成数量后直接批量生成结果，无需输入原始文本。</p>';
  }

  if (['dev_nslookup_query', 'dev_ip_to_hostname', 'dev_sitemap_extract', 'dev_html_link_extract', 'dev_meta_info_check', 'dev_tdk_check', 'dev_keyword_density_check', 'dev_spider_preview', 'dev_ssl_check', 'dev_ssl_expiry_check', 'dev_redirect_analysis', 'dev_whois_lookup', 'dev_cdn_check', 'dev_ssl_chain_download', 'dev_batch_request', 'dev_icp_query', 'dev_short_url_restore'].includes(item.key)) {
    return `
      <label class="field field-wide">
        <span>目标地址</span>
        <input type="text" data-target-url placeholder="例如：https://example.com 或 example.com" />
      </label>
    `;
  }

  if (item.key === 'dev_api_batch_request') {
    return `
      <label class="field field-wide">
        <span>API 列表</span>
        <textarea data-source-text rows="10" placeholder="每行一个 API 地址，例如：&#10;https://a.example.com/search&#10;https://b.example.com/search"></textarea>
      </label>
    `;
  }

  if (['dev_dead_link_check', 'dev_domain_to_ip_batch', 'dev_whois_batch'].includes(item.key)) {
    const labelText = item.key === 'dev_dead_link_check'
      ? 'URL 列表'
      : '域名列表';
    return `
      <label class="field field-wide">
        <span>${labelText}</span>
        <textarea data-source-text rows="10" placeholder="每行一个${item.key === 'dev_dead_link_check' ? ' URL，例如：&#10;https://example.com&#10;https://example.com/docs' : '域名，例如：&#10;example.com&#10;openai.com'}"></textarea>
      </label>
    `;
  }

  if (item.key === 'dev_icp_batch_query') {
    return `
      <label class="field field-wide">
        <span>域名列表</span>
        <textarea data-source-text rows="10" placeholder="每行一个域名，例如：&#10;baidu.com&#10;qq.com"></textarea>
      </label>
    `;
  }

  if (item.key === 'dev_icp_reverse_query') {
    return `
      <label class="field field-wide">
        <span>备案主体</span>
        <textarea data-source-text rows="6" placeholder="例如：北京百度网讯科技有限公司"></textarea>
      </label>
    `;
  }

  return `
    <label class="field field-wide">
      <span>原始文本</span>
      <textarea data-source-text rows="10" placeholder="请粘贴要处理的内容"></textarea>
    </label>
  `;
}

function createDevToolOptionsMarkup(item) {
  if (item.key === 'dev_keyword_density_check') {
    return `
      <label class="field">
        <span>关键词</span>
        <input type="text" data-keyword-text placeholder="例如：PDF" />
      </label>
    `;
  }

  if (item.key === 'dev_batch_request') {
    return `
      <label class="field">
        <span>请求次数</span>
        <input type="number" min="1" max="50" step="1" data-request-count value="10" />
      </label>
      <label class="field">
        <span>请求间隔（毫秒）</span>
        <input type="number" min="0" max="10000" step="100" data-request-interval-ms value="300" />
      </label>
    `;
  }

  if (item.key === 'dev_api_batch_request') {
    return `
      <label class="field field-wide">
        <span>公共参数</span>
        <textarea data-api-query-params rows="6" placeholder="每行一个参数，例如：&#10;token=abc&#10;q=pdf"></textarea>
      </label>
    `;
  }

  if (item.key === 'dev_base64_codec') {
    return `
      <label class="field">
        <span>转换方式</span>
        <select data-base64-mode>
          <option value="encode">编码为 Base64</option>
          <option value="decode">解码为文本</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_url_codec') {
    return `
      <label class="field">
        <span>转换方式</span>
        <select data-url-mode>
          <option value="encode">URL 编码</option>
          <option value="decode">URL 解码</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_basic_auth_credential') {
    return `
      <label class="field">
        <span>用户名</span>
        <input type="text" data-basic-auth-username placeholder="例如：admin" />
      </label>
      <label class="field">
        <span>密码</span>
        <input type="text" data-basic-auth-password placeholder="例如：OpenAI123" />
      </label>
    `;
  }

  if (item.key === 'dev_timestamp_convert') {
    return `
      <label class="field">
        <span>转换方式</span>
        <select data-timestamp-mode>
          <option value="to_readable">时间戳转可读时间</option>
          <option value="to_timestamp">日期转时间戳</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_string_hash') {
    return `
      <label class="field">
        <span>哈希算法</span>
        <select data-hash-algorithm>
          <option value="md5">MD5</option>
          <option value="sha1">SHA-1</option>
          <option value="sha256">SHA-256</option>
          <option value="sha384">SHA-384</option>
          <option value="sha512">SHA-512</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_crontab_parse') {
    return `
      <label class="field">
        <span>起始时间</span>
        <input type="text" data-cron-start-time placeholder="例如：2026-06-05T09:10:00.000Z" />
      </label>
      <p class="field-tip">原始文本中填写标准 5 段 Crontab 表达式，例如：*/30 9-18 * * 1-5。</p>
    `;
  }

  if (item.key === 'dev_radix_convert') {
    return `
      <label class="field">
        <span>原进制</span>
        <input type="number" min="2" max="36" step="1" data-from-base value="10" />
      </label>
      <label class="field">
        <span>目标进制</span>
        <input type="number" min="2" max="36" step="1" data-to-base value="16" />
      </label>
    `;
  }

  if (item.key === 'dev_text_to_base_n' || item.key === 'dev_base_n_to_text') {
    return `
      <label class="field">
        <span>编码进制</span>
        <input type="number" min="2" max="36" step="1" data-code-base value="16" />
      </label>
    `;
  }

  if (item.key === 'dev_html_entity_codec') {
    return `
      <label class="field">
        <span>转换方式</span>
        <select data-html-entity-mode>
          <option value="encode">编码为 HTML 实体</option>
          <option value="decode">解码为原始文本</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_list_to_json') {
    return `
      <label class="field">
        <span>字段名</span>
        <input type="text" data-json-field-name placeholder="例如：url" value="value" />
      </label>
      <p class="field-tip">填写字段名后会输出对象数组；留空则输出字符串数组。</p>
    `;
  }

  if (item.key === 'dev_robots_generate') {
    return `
      <label class="field">
        <span>User-agent</span>
        <input type="text" data-robots-user-agent value="*" />
      </label>
      <label class="field">
        <span>Allow</span>
        <input type="text" data-robots-allow placeholder="例如：/public" />
      </label>
      <label class="field field-wide">
        <span>Disallow</span>
        <textarea data-robots-disallow rows="4" placeholder="每行一个禁止路径，例如：&#10;/admin&#10;/private"></textarea>
      </label>
      <label class="field field-wide">
        <span>Sitemap</span>
        <input type="text" data-robots-sitemap placeholder="例如：https://example.com/sitemap.xml" />
      </label>
    `;
  }

  if (item.key === 'dev_json_to_list' || item.key === 'dev_json_field_extract') {
    return `
      <label class="field">
        <span>字段路径</span>
        <input type="text" data-json-path placeholder="例如：items.0.name 或 name" />
      </label>
    `;
  }

  if (item.key === 'dev_uuid_generate') {
    return `
      <label class="field">
        <span>生成数量</span>
        <input type="number" min="1" max="100" step="1" data-uuid-count value="10" />
      </label>
    `;
  }

  if (item.key === 'dev_json_to_php') {
    return `
      <label class="field">
        <span>数组语法</span>
        <select data-php-array-style>
          <option value="short">短数组</option>
          <option value="long">传统 array()</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_json_to_js_object') {
    return `
      <label class="field">
        <span>变量名</span>
        <input type="text" data-js-export-name value="dataObject" placeholder="例如：toolConfig" />
      </label>
    `;
  }

  if (item.key === 'dev_json_merge') {
    return `
      <label class="field">
        <span>合并方式</span>
        <select data-json-merge-mode>
          <option value="object_merge">对象合并</option>
          <option value="array_concat">数组拼接</option>
        </select>
      </label>
      <p class="field-tip">多个 JSON 之间请用空行分隔。</p>
    `;
  }

  if (item.key === 'dev_json_key_value_extract') {
    return `
      <label class="field">
        <span>键值分隔符</span>
        <input type="text" data-key-value-separator value="=" placeholder="例如：= 或 :" />
      </label>
    `;
  }

  if (item.key === 'dev_rsa_keypair_generate') {
    return `
      <label class="field">
        <span>密钥位数</span>
        <select data-rsa-key-size>
          <option value="2048">2048</option>
          <option value="3072">3072</option>
          <option value="4096">4096</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_php_password_hash') {
    return `
      <label class="field">
        <span>成本因子</span>
        <input type="number" min="4" max="15" step="1" data-password-hash-cost value="10" />
      </label>
    `;
  }

  if (['dev_js_format', 'dev_css_format', 'dev_html_format'].includes(item.key)) {
    return `
      <label class="field">
        <span>处理方式</span>
        <select data-format-mode>
          <option value="beautify">美化</option>
          <option value="minify">压缩</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_css_js_clear') {
    return `
      <label class="field">
        <span>清除范围</span>
        <select data-cleanup-mode>
          <option value="clear_css_js">同时清除</option>
          <option value="clear_css">只清除 CSS</option>
          <option value="clear_js">只清除 JS</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_json_missing_find') {
    return `
      <label class="field field-wide">
        <span>对比 JSON</span>
        <textarea data-compare-json-text rows="10" placeholder="请粘贴用于对比的第二份 JSON"></textarea>
      </label>
    `;
  }

  if (item.key === 'dev_json_clear_values') {
    return `
      <label class="field">
        <span>清空方式</span>
        <select data-json-clear-mode>
          <option value="empty_string">空字符串</option>
          <option value="null">null</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_json_slice') {
    return `
      <label class="field">
        <span>每组数量</span>
        <input type="number" min="1" max="1000" step="1" data-json-slice-size value="2" />
      </label>
    `;
  }

  if (item.key === 'dev_url_params_set') {
    return `
      <label class="field field-wide">
        <span>参数列表</span>
        <textarea data-url-set-params rows="6" placeholder="每行一个参数，例如：&#10;utm_source=codex&#10;utm_medium=test"></textarea>
      </label>
    `;
  }

  if (item.key === 'dev_web_meta_generate') {
    return `
      <label class="field">
        <span>页面标题</span>
        <input type="text" data-meta-title placeholder="例如：PP 工具站" />
      </label>
      <label class="field">
        <span>Robots</span>
        <input type="text" data-meta-robots value="index,follow" placeholder="例如：index,follow" />
      </label>
      <label class="field field-wide">
        <span>页面描述</span>
        <textarea data-meta-description rows="4" placeholder="例如：文件处理与文本处理一站完成"></textarea>
      </label>
      <label class="field field-wide">
        <span>关键词</span>
        <input type="text" data-meta-keywords placeholder="例如：PDF,文本,编程" />
      </label>
      <label class="field field-wide">
        <span>Canonical</span>
        <input type="text" data-meta-canonical placeholder="例如：https://example.com/tools" />
      </label>
    `;
  }

  if (item.key === 'dev_text_list_to_js_object') {
    return `
      <label class="field">
        <span>对象模式</span>
        <select data-js-object-mode>
          <option value="same_value">键和值相同</option>
          <option value="index_value">索引做键</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'dev_js_data_import') {
    return `
      <label class="field">
        <span>变量名</span>
        <input type="text" data-js-import-name value="dataSource" placeholder="例如：dataSource" />
      </label>
    `;
  }

  if (item.key === 'dev_html_inline_style_remove') {
    return `
      <label class="field field-wide">
        <span>样式名</span>
        <input type="text" data-inline-style-names placeholder="留空表示移除全部 style；也可填写 color,font-size" />
      </label>
    `;
  }

  if (item.key === 'dev_cookie_import_code') {
    return `
      <label class="field">
        <span>Cookie Domain</span>
        <input type="text" data-cookie-domain placeholder="例如：.example.com" />
      </label>
      <label class="field">
        <span>Cookie Path</span>
        <input type="text" data-cookie-path value="/" placeholder="例如：/" />
      </label>
    `;
  }

  if (item.key === 'dev_frontend_i18n_convert') {
    return '<p class="field-tip">首列为 key，后续每一列为语言列，例如 zh-CN / en-US。</p>';
  }

  if (['dev_ip_generate', 'dev_ip_random_generate', 'dev_random_color_generate'].includes(item.key)) {
    return `
      <label class="field">
        <span>生成数量</span>
        <input type="number" min="1" max="500" step="1" data-generate-count value="20" />
      </label>
    `;
  }

  if (item.key === 'dev_mac_generate') {
    return `
      <label class="field">
        <span>生成数量</span>
        <input type="number" min="1" max="500" step="1" data-generate-count value="20" />
      </label>
      <label class="field">
        <span>分隔符</span>
        <select data-mac-separator>
          <option value=":">冒号 :</option>
          <option value="-">横杠 -</option>
          <option value="">无分隔符</option>
        </select>
      </label>
    `;
  }

  return '';
}

function createDevToolResultMarkup(item) {
  if (item.key === 'dev_html_preview') {
    return `
      <div class="text-tool-result-shell">
        <label class="field field-wide">
          <span>处理结果</span>
          <textarea data-output-text rows="8" readonly placeholder="处理结果会显示在这里"></textarea>
        </label>
        <div class="html-preview-shell">
          <span class="field-label">预览效果</span>
          <iframe class="html-preview-frame" data-html-preview-frame title="HTML 预览"></iframe>
        </div>
        <button class="button button-muted text-tool-copy-button" type="button" data-copy-output="${item.key}">
          复制结果
        </button>
      </div>
    `;
  }

  return `
    <div class="text-tool-result-shell">
      <label class="field field-wide">
        <span>处理结果</span>
        <textarea data-output-text rows="10" readonly placeholder="处理结果会显示在这里"></textarea>
      </label>
      <button class="button button-muted text-tool-copy-button" type="button" data-copy-output="${item.key}">
        复制结果
      </button>
    </div>
  `;
}

function createSelectedFileListMarkup(item) {
  if (!supportsMultipleFiles(item)) {
    return '';
  }

  return `
    <div class="selected-file-list" data-selected-file-list>
      <p class="field-tip">${['merge_pdf', 'media_audio_merge'].includes(item.key) ? '按当前顺序合并，后续可在页面中调整上下顺序。' : '已选择的文件会在这里列出。'}</p>
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
  if (item.categoryKey === 'image_tools') {
    return createImageToolOptionsMarkup(item);
  }

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

  if (item.key === 'qr_generate') {
    return `
      <label class="field field-wide">
        <span>二维码内容</span>
        <textarea data-qr-text rows="8" placeholder="输入网址、文本或收款说明"></textarea>
      </label>
      <label class="field">
        <span>输出尺寸</span>
        <input type="number" min="128" max="1024" step="32" data-qr-size value="320" />
      </label>
    `;
  }

  if (item.key === 'qr_generate_batch') {
    return `
      <label class="field field-wide">
        <span>批量内容</span>
        <textarea data-qr-lines-text rows="10" placeholder="每行一条内容，例如：&#10;订单001&#10;订单002"></textarea>
      </label>
      <label class="field">
        <span>输出尺寸</span>
        <input type="number" min="128" max="1024" step="32" data-qr-size value="256" />
      </label>
      <p class="field-tip">每一行会生成一个二维码，最后统一打包成 ZIP 下载。</p>
    `;
  }

  if (item.key === 'payment_code_merge') {
    return `
      <label class="field">
        <span>合并方式</span>
        <select data-payment-code-layout>
          <option value="vertical">上下合并</option>
          <option value="horizontal">左右合并</option>
        </select>
      </label>
      <label class="field field-wide">
        <span>主标题</span>
        <input type="text" data-payment-code-title value="收款码" placeholder="例如：扫码付款" />
      </label>
      <p class="field-tip">按上传顺序合并，建议先传微信码，再传支付宝码。</p>
    `;
  }

  if (item.key === 'media_audio_clip') {
    return `
      <label class="field">
        <span>开始时间</span>
        <input type="text" data-media-start-time placeholder="例如：00:01.500" />
      </label>
      <label class="field">
        <span>结束时间</span>
        <input type="text" data-media-end-time placeholder="例如：00:08.000" />
      </label>
      <label class="field">
        <span>输出格式</span>
        <select data-media-output-format>
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'media_audio_to_text') {
    return `
      <label class="field">
        <span>识别语言</span>
        <select data-media-language>
          <option value="auto">自动识别</option>
          <option value="zh">中文</option>
          <option value="en">英文</option>
        </select>
      </label>
      <label class="field">
        <span>输出格式</span>
        <select data-media-output-format>
          <option value="txt">TXT 文本</option>
        </select>
      </label>
      <p class="field-tip">适合会议录音、课程音频和口播内容的快速转文字整理。</p>
    `;
  }

  if (item.key === 'media_audio_merge') {
    return `
      <label class="field">
        <span>输出格式</span>
        <select data-media-output-format>
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
        </select>
      </label>
      <p class="field-tip">支持上传多段常见音频格式，合并时会按当前顺序重新编码输出。</p>
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

  if (item.key === 'ocr_text_extract') {
    return `
      <label class="field">
        <span>识别语言</span>
        <select data-ocr-language>
          <option value="chi_sim+eng">中文 + 英文</option>
          <option value="chi_sim">仅中文</option>
          <option value="eng">仅英文</option>
        </select>
      </label>
      <p class="field-tip">支持截图、扫描图和常见图片文字识别，结果会生成 TXT 文件。</p>
    `;
  }

  if (item.key === 'batch_file_rename') {
    return `
      <label class="field field-wide">
        <span>命名模板</span>
        <input type="text" data-rename-template value="资料-{n}-{name}" placeholder="例如：资料-{n}-{name}" />
      </label>
      <label class="field">
        <span>起始序号</span>
        <input type="number" min="1" step="1" data-rename-start-number value="1" />
      </label>
      <label class="field">
        <span>序号位数</span>
        <input type="number" min="1" max="8" step="1" data-rename-number-width value="2" />
      </label>
      <p class="field-tip">支持模板变量 {n} 和 {name}，结果会按新文件名统一打包下载。</p>
    `;
  }

  if (item.key === 'delete_pages_pdf') {
    return `
      <label class="field">
        <span>删除页码</span>
        <input type="text" data-delete-range-text placeholder="例如：2,4,6-8" />
      </label>
      <div class="watermark-option-group">
        <p class="field-tip">也可以直接点击下面的缩略图选择要删除的页。</p>
        <div class="thumbnail-grid" data-delete-thumbnail-grid></div>
      </div>
    `;
  }

  if (item.key === 'reorder_pages_pdf') {
    return `
      <label class="field">
        <span>新的页顺序</span>
        <input type="text" data-order-text placeholder="例如：3,1,2,4" />
      </label>
      <div class="watermark-option-group">
        <p class="field-tip">也可以直接拖拽缩略图，或用上移 / 下移调整页面顺序。</p>
        <div class="thumbnail-grid" data-reorder-thumbnail-grid></div>
      </div>
    `;
  }

  if (item.key === 'protect_unlock_pdf') {
    return `
      <label class="field">
        <span>模式</span>
        <select data-protect-mode>
          <option value="protect">保护 PDF</option>
          <option value="unlock">解锁 PDF</option>
        </select>
      </label>
      <div class="watermark-option-group" data-protect-fields>
        <label class="field">
          <span>打开密码</span>
          <input type="password" data-protect-password />
        </label>
        <label class="field" data-confirm-password-field>
          <span>确认密码</span>
          <input type="password" data-protect-confirm-password />
        </label>
      </div>
      <div class="watermark-option-group hidden" data-unlock-fields>
        <label class="field">
          <span>原密码</span>
          <input type="password" data-unlock-password />
        </label>
      </div>
    `;
  }

  if (item.key === 'watermark_pdf') {
    return `
      <label class="field">
        <span>水印类型</span>
        <select data-watermark-type>
          <option value="text">文字水印</option>
          <option value="image">图片水印</option>
        </select>
      </label>
      <div class="watermark-option-group" data-watermark-text-options>
        <label class="field">
          <span>文字排法</span>
          <select data-text-layout>
            <option value="tile">平铺斜铺</option>
            <option value="center">单个居中</option>
          </select>
        </label>
        <label class="field">
          <span>水印内容</span>
          <input type="text" data-text-content placeholder="例如：仅供内部使用" />
        </label>
        <label class="field">
          <span>字号</span>
          <input type="number" min="12" max="96" step="1" data-watermark-font-size value="26" />
        </label>
        <label class="field">
          <span>透明度</span>
          <input type="number" min="0.02" max="0.95" step="0.01" data-watermark-opacity value="0.18" />
        </label>
        <label class="field">
          <span>旋转角度</span>
          <input type="number" min="-180" max="180" step="1" data-watermark-rotation value="-32" />
        </label>
      </div>
      <div class="watermark-option-group hidden" data-watermark-image-options>
        <label class="field">
          <span>水印图片</span>
          <input type="file" name="watermarkImage" data-watermark-image-input accept=".png,.jpg,.jpeg" />
        </label>
        <label class="field">
          <span>图片位置</span>
          <select data-image-position>
            <option value="center">居中</option>
            <option value="bottom_left">左下</option>
            <option value="bottom_right">右下</option>
          </select>
        </label>
        <label class="field">
          <span>缩放比例</span>
          <input type="number" min="5" max="100" step="1" data-image-scale-percent value="30" />
        </label>
        <label class="field">
          <span>透明度</span>
          <input type="number" min="0.02" max="0.95" step="0.01" data-image-opacity value="0.30" />
        </label>
      </div>
      <p class="field-tip">第一版按整份 PDF 统一加水印。文字支持平铺斜铺和单个居中；图片支持 PNG/JPG 固定位置。</p>
    `;
  }

  if (item.key === 'add_page_numbers_pdf') {
    return `
      <label class="field">
        <span>页码位置</span>
        <select data-page-number-position>
          <option value="footer_center">页脚居中</option>
          <option value="bottom_right">右下角</option>
        </select>
      </label>
      <label class="field">
        <span>起始页码</span>
        <input type="number" min="1" step="1" data-page-number-start value="1" />
      </label>
      <label class="field">
        <span>页码格式</span>
        <select data-page-number-format>
          <option value="plain">1</option>
          <option value="cn_page">第 1 页</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'sign_stamp_pdf' || item.key === 'batch_sign_stamp_pdf') {
    return `
      <label class="field">
        <span>签名方式</span>
        <select data-stamp-source-type>
          <option value="image">上传签名/印章图片</option>
          <option value="draw">手写签名</option>
        </select>
      </label>
      <div class="watermark-option-group" data-stamp-image-options>
        <label class="field">
          <span>签名图片</span>
          <input type="file" name="stampImage" data-stamp-image-input accept=".png,.jpg,.jpeg" />
        </label>
      </div>
      <div class="watermark-option-group hidden" data-stamp-draw-options>
        <label class="field">
          <span>手写签名</span>
          <canvas class="signature-canvas" data-signature-canvas width="520" height="160"></canvas>
        </label>
        <div class="range-actions">
          <button class="button button-muted range-action-button" type="button" data-clear-signature>清空签名</button>
        </div>
      </div>
      <label class="field">
        <span>位置</span>
        <select data-stamp-position>
          <option value="center">居中</option>
          <option value="bottom_left">左下</option>
          <option value="bottom_right">右下</option>
        </select>
      </label>
      <label class="field">
        <span>缩放比例</span>
        <input type="number" min="5" max="100" step="1" data-stamp-scale-percent value="35" />
      </label>
      <label class="field">
        <span>透明度</span>
        <input type="number" min="0.02" max="0.95" step="0.01" data-stamp-opacity value="0.40" />
      </label>
    `;
  }

  if (item.key === 'rotate_pdf') {
    return `
      <label class="field">
        <span>旋转角度</span>
        <select data-rotation-angle>
          <option value="90">90°</option>
          <option value="180">180°</option>
          <option value="270">270°</option>
        </select>
      </label>
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

function createImageToolOptionsMarkup(item) {
  if (item.key === 'qr_generate') {
    return `
      <label class="field field-wide">
        <span>二维码内容</span>
        <textarea data-qr-text rows="8" placeholder="输入网址、文本或收款说明"></textarea>
      </label>
      <label class="field">
        <span>输出尺寸</span>
        <input type="number" min="128" max="1024" step="32" data-qr-size value="320" />
      </label>
    `;
  }

  if (item.key === 'qr_generate_batch') {
    return `
      <label class="field field-wide">
        <span>批量内容</span>
        <textarea data-qr-lines-text rows="10" placeholder="每行一条内容，例如：&#10;订单001&#10;订单002"></textarea>
      </label>
      <label class="field">
        <span>输出尺寸</span>
        <input type="number" min="128" max="1024" step="32" data-qr-size value="256" />
      </label>
      <p class="field-tip">每一行会生成一个二维码，最后统一打包成 ZIP 下载。</p>
    `;
  }

  if (item.key === 'payment_code_merge') {
    return `
      <label class="field">
        <span>合并方式</span>
        <select data-payment-code-layout>
          <option value="vertical">上下合并</option>
          <option value="horizontal">左右合并</option>
        </select>
      </label>
      <label class="field field-wide">
        <span>主标题</span>
        <input type="text" data-payment-code-title value="收款码" placeholder="例如：扫码付款" />
      </label>
      <p class="field-tip">建议按上传顺序放入微信码、支付宝码等需要合并的收款图片。</p>
    `;
  }

  if (item.key === 'image_compress_batch') {
    return `
      <label class="field">
        <span>压缩质量</span>
        <input type="number" min="20" max="95" step="1" data-image-quality value="75" />
      </label>
    `;
  }

  if (item.key === 'image_resize_exact') {
    return `
      <label class="field">
        <span>目标宽度</span>
        <input type="number" min="1" step="1" data-target-width value="800" />
      </label>
      <label class="field">
        <span>目标高度</span>
        <input type="number" min="1" step="1" data-target-height value="600" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_resize_scale') {
    return `
      <label class="field">
        <span>缩放比例</span>
        <input type="number" min="1" max="1000" step="1" data-scale-percent value="100" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_crop_free') {
    return `
      <label class="field">
        <span>X 坐标</span>
        <input type="number" min="0" step="1" data-crop-x value="0" />
      </label>
      <label class="field">
        <span>Y 坐标</span>
        <input type="number" min="0" step="1" data-crop-y value="0" />
      </label>
      <label class="field">
        <span>裁剪宽度</span>
        <input type="number" min="1" step="1" data-crop-width value="300" />
      </label>
      <label class="field">
        <span>裁剪高度</span>
        <input type="number" min="1" step="1" data-crop-height value="300" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (['image_crop_ratio', 'image_crop_ratio_batch'].includes(item.key)) {
    return `
      ${createAspectRatioSelect('1:1')}
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_split_grid') {
    return `
      <label class="field">
        <span>行数</span>
        <input type="number" min="1" max="20" step="1" data-grid-rows value="2" />
      </label>
      <label class="field">
        <span>列数</span>
        <input type="number" min="1" max="20" step="1" data-grid-columns value="2" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_nine_grid') {
    return `
      <p class="field-tip">固定输出 3 x 3 九宫格图片，适合朋友圈和社媒切图。</p>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_concat_long') {
    return `
      <label class="field">
        <span>拼接方向</span>
        <select data-image-direction>
          <option value="vertical">纵向长图</option>
          <option value="horizontal">横向长图</option>
        </select>
      </label>
      <label class="field">
        <span>间距</span>
        <input type="number" min="0" max="200" step="1" data-image-gap value="0" />
      </label>
      <label class="field">
        <span>背景色</span>
        <input type="color" data-background-color value="#ffffff" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_collage') {
    return `
      <label class="field">
        <span>每行列数</span>
        <input type="number" min="1" max="8" step="1" data-collage-columns value="2" />
      </label>
      <label class="field">
        <span>间距</span>
        <input type="number" min="0" max="200" step="1" data-image-gap value="12" />
      </label>
      <label class="field">
        <span>背景色</span>
        <input type="color" data-background-color value="#ffffff" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (['image_fill_background', 'image_dark_mode_background'].includes(item.key)) {
    return `
      <label class="field">
        <span>背景色</span>
        <input type="color" data-background-color value="#ffffff" />
      </label>
      ${createImageOutputFormatSelect(item.key === 'image_dark_mode_background' ? 'png' : 'jpg')}
    `;
  }

  if (item.key === 'image_watermark_tile') {
    return `
      <label class="field">
        <span>水印文字</span>
        <input type="text" data-watermark-text value="仅供内部使用" />
      </label>
      <label class="field">
        <span>字号</span>
        <input type="number" min="12" max="120" step="1" data-watermark-font-size value="24" />
      </label>
      <label class="field">
        <span>透明度</span>
        <input type="number" min="0.05" max="0.9" step="0.01" data-watermark-opacity value="0.22" />
      </label>
      <label class="field">
        <span>旋转角度</span>
        <input type="number" min="-180" max="180" step="1" data-watermark-rotation value="-28" />
      </label>
      <label class="field">
        <span>间距</span>
        <input type="number" min="40" max="400" step="1" data-watermark-gap value="120" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_printmaking') {
    return `
      <label class="field">
        <span>阈值</span>
        <input type="number" min="0" max="255" step="1" data-threshold value="126" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (['image_remove_solid_bg', 'image_smart_bg_remove', 'id_photo_bg_swap'].includes(item.key)) {
    return `
      ${item.key === 'id_photo_bg_swap' ? `
        <label class="field">
          <span>新背景色</span>
          <input type="color" data-background-color value="#438edb" />
        </label>
      ` : ''}
      <label class="field">
        <span>容差</span>
        <input type="number" min="0" max="255" step="1" data-color-tolerance value="${item.key === 'image_smart_bg_remove' ? '40' : '36'}" />
      </label>
      ${createImageOutputFormatSelect(item.key === 'id_photo_bg_swap' ? 'jpg' : 'png')}
    `;
  }

  if (item.key === 'image_add_padding') {
    return `
      <label class="field">
        <span>上边距</span>
        <input type="number" min="0" max="1000" step="1" data-padding-top value="40" />
      </label>
      <label class="field">
        <span>右边距</span>
        <input type="number" min="0" max="1000" step="1" data-padding-right value="40" />
      </label>
      <label class="field">
        <span>下边距</span>
        <input type="number" min="0" max="1000" step="1" data-padding-bottom value="40" />
      </label>
      <label class="field">
        <span>左边距</span>
        <input type="number" min="0" max="1000" step="1" data-padding-left value="40" />
      </label>
      <label class="field">
        <span>留白颜色</span>
        <input type="color" data-background-color value="#ffffff" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_pixelate') {
    return `
      <label class="field">
        <span>像素块大小</span>
        <input type="number" min="2" max="100" step="1" data-block-size value="12" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_increase_size') {
    return `
      <label class="field">
        <span>目标体积（KB）</span>
        <input type="number" min="1" max="10240" step="1" data-target-size-kb value="100" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_heic_convert') {
    return `
      <label class="field">
        <span>导出格式</span>
        <select data-image-output-format>
          <option value="jpg">JPG</option>
          <option value="png">PNG</option>
        </select>
      </label>
      <p class="field-tip">适合把 iPhone 常见 HEIC / HEIF 图片快速转成更通用的 JPG 或 PNG。</p>
    `;
  }

  if (item.key === 'image_clear_content') {
    return `
      <label class="field">
        <span>填充颜色</span>
        <input type="color" data-background-color value="#ffffff" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'image_format_convert') {
    return createImageOutputFormatSelect('jpg');
  }

  if (item.key === 'image_modify_dpi') {
    return `
      <label class="field">
        <span>DPI</span>
        <input type="number" min="72" max="1200" step="1" data-image-dpi value="300" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (item.key === 'gif_merge') {
    return `
      <label class="field">
        <span>帧间隔（毫秒）</span>
        <input type="number" min="50" max="5000" step="10" data-gif-duration-ms value="400" />
      </label>
    `;
  }

  if (item.key === 'image_round_corner') {
    return `
      <label class="field">
        <span>圆角半径</span>
        <input type="number" min="2" max="300" step="1" data-round-corner-radius value="36" />
      </label>
    `;
  }

  if (item.key === 'image_tile_fill') {
    return `
      <label class="field">
        <span>目标宽度</span>
        <input type="number" min="1" step="1" data-target-width value="1200" />
      </label>
      <label class="field">
        <span>目标高度</span>
        <input type="number" min="1" step="1" data-target-height value="1200" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  if (['id_photo_resize', 'exam_id_photo_process', 'id_photo_crop'].includes(item.key)) {
    return `
      <label class="field">
        <span>证件照规格</span>
        <select data-id-photo-preset>
          <option value="one_inch">一寸</option>
          <option value="two_inch">二寸</option>
          <option value="small_one_inch">小一寸</option>
        </select>
      </label>
      ${item.key !== 'id_photo_crop' ? `
        <label class="field">
          <span>目标体积（KB）</span>
          <input type="number" min="20" max="1024" step="1" data-target-size-kb value="${item.key === 'exam_id_photo_process' ? '60' : '120'}" />
        </label>
      ` : ''}
      ${createImageOutputFormatSelect('jpg')}
    `;
  }

  if (item.key === 'anti_ocr_image') {
    return `
      <label class="field">
        <span>扰动强度</span>
        <input type="number" min="1" max="80" step="1" data-noise-level value="18" />
      </label>
      ${createImageOutputFormatSelect('png')}
    `;
  }

  return '';
}

function createImageOutputFormatSelect(defaultValue) {
  return `
    <label class="field">
      <span>输出格式</span>
      <select data-image-output-format>
        <option value="png" ${defaultValue === 'png' ? 'selected' : ''}>PNG</option>
        <option value="jpg" ${defaultValue === 'jpg' ? 'selected' : ''}>JPG</option>
        <option value="webp" ${defaultValue === 'webp' ? 'selected' : ''}>WebP</option>
      </select>
    </label>
  `;
}

function createAspectRatioSelect(defaultValue) {
  return `
    <label class="field">
      <span>裁剪比例</span>
      <select data-aspect-ratio>
        <option value="1:1" ${defaultValue === '1:1' ? 'selected' : ''}>1:1</option>
        <option value="4:3" ${defaultValue === '4:3' ? 'selected' : ''}>4:3</option>
        <option value="16:9" ${defaultValue === '16:9' ? 'selected' : ''}>16:9</option>
        <option value="3:4" ${defaultValue === '3:4' ? 'selected' : ''}>3:4</option>
        <option value="9:16" ${defaultValue === '9:16' ? 'selected' : ''}>9:16</option>
      </select>
    </label>
  `;
}

function supportsMultipleFiles(item) {
  return Boolean(item?.allowMultipleFiles) || item?.key === 'images_to_pdf' || item?.key === 'merge_pdf' || item?.key === 'media_audio_merge';
}

function createLocalMediaToolPrimaryInputMarkup(item) {
  if (item.key === 'media_audio_player') {
    return `
      <label class="field field-wide">
        <span>选择音频文件</span>
        <input type="file" data-media-file-input accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus" required />
      </label>
    `;
  }

  if (item.key === 'media_video_speed_preview') {
    return `
      <label class="field field-wide">
        <span>选择视频文件</span>
        <input type="file" data-media-file-input accept="video/*,.mp4,.webm,.mov,.m4v,.avi" required />
      </label>
    `;
  }

  return '';
}

function createLocalMediaToolOptionsMarkup(item) {
  if (item.key === 'media_video_speed_preview') {
    return `
      <label class="field">
        <span>播放速度</span>
        <select data-media-playback-rate>
          <option value="1">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2.0x</option>
          <option value="3">3.0x</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'media_tone_generator') {
    return `
      <label class="field">
        <span>频率（Hz）</span>
        <input type="number" min="20" max="20000" step="1" data-media-frequency value="440" />
      </label>
      <label class="field">
        <span>时长（秒）</span>
        <input type="number" min="0.1" max="120" step="0.1" data-media-duration value="3" />
      </label>
      <label class="field">
        <span>音量</span>
        <input type="number" min="0.01" max="1" step="0.01" data-media-volume value="0.5" />
      </label>
    `;
  }

  if (item.key === 'media_white_noise_generator') {
    return `
      <label class="field">
        <span>时长（秒）</span>
        <input type="number" min="0.1" max="120" step="0.1" data-media-duration value="10" />
      </label>
      <label class="field">
        <span>音量</span>
        <input type="number" min="0.01" max="1" step="0.01" data-media-volume value="0.35" />
      </label>
    `;
  }

  return '';
}

function createLocalMediaToolResultMarkup(item) {
  if (item.key === 'media_video_speed_preview') {
    return `
      <div class="media-tool-result-shell">
        <p class="field-tip" data-media-status>加载后可直接在页面内调整速度播放。</p>
        <video class="media-preview-video hidden" data-media-video-preview controls playsinline></video>
      </div>
    `;
  }

  if (item.key === 'media_audio_player') {
    return `
      <div class="media-tool-result-shell">
        <p class="field-tip" data-media-status>加载后会显示波形并可直接试听。</p>
        <canvas class="media-waveform-canvas" data-media-waveform width="720" height="160"></canvas>
        <audio class="media-preview-audio hidden" data-media-audio-preview controls></audio>
      </div>
    `;
  }

  return `
    <div class="media-tool-result-shell">
      <p class="field-tip" data-media-status>生成完成后可直接试听或下载。</p>
      <audio class="media-preview-audio hidden" data-media-audio-preview controls></audio>
      <a class="button button-muted hidden" data-media-download-link download>下载音频</a>
    </div>
  `;
}

function createLocalTextToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  return `
    <article class="tool-detail-card">
      ${showHeader ? `
        <div class="tool-detail-head">
          <button class="button button-muted tool-back-button" type="button" data-back-to-overview>返回列表</button>
          <h3>${item.label}</h3>
          <p>${item.helperText || ''}</p>
        </div>
      ` : ''}
      <form class="tool-form tool-form-text" data-conversion-key="${item.key}" data-tool-kind="local_text">
        <label class="field field-wide">
          <span>原始文本</span>
          <textarea data-source-text rows="10" placeholder="请粘贴要处理的文本"></textarea>
        </label>
        ${createLocalTextToolOptionsMarkup(item)}
        <button class="button" type="submit">开始处理</button>
      </form>
      <div class="tool-results" data-results="${item.key}">
        ${createLocalTextToolResultMarkup(item)}
      </div>
    </article>
  `;
}

function createLocalTextToolOptionsMarkup(item) {
  if (item.key === 'text_srt_to_text') {
    return `
      <label class="field field-wide">
        <span>字幕文件</span>
        <input type="file" data-local-text-file-input accept=".srt" />
      </label>
      <p class="field-tip">支持直接上传 .srt 文件，也可以把字幕内容粘贴到上面的文本框。</p>
    `;
  }

  if (item.key === 'text_text_to_srt') {
    return `
      <label class="field">
        <span>每条字幕时长（秒）</span>
        <input type="number" min="0.2" max="30" step="0.1" data-subtitle-duration-seconds value="2.5" />
      </label>
      <label class="field">
        <span>起始时间</span>
        <input type="text" data-subtitle-start-time value="00:00:00,000" placeholder="例如：00:00:05,000" />
      </label>
    `;
  }

  if (item.key === 'text_replace_batch') {
    return `
      <label class="field">
        <span>查找内容</span>
        <input type="text" data-find-text placeholder="例如：hello" />
      </label>
      <label class="field">
        <span>替换为</span>
        <input type="text" data-replace-text placeholder="例如：hi" />
      </label>
    `;
  }

  if (item.key === 'text_case_convert') {
    return `
      <label class="field">
        <span>转换方式</span>
        <select data-case-mode>
          <option value="upper">全部大写</option>
          <option value="lower">全部小写</option>
          <option value="title">首字母大写</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'text_to_list' || item.key === 'list_to_text') {
    return `
      <label class="field">
        <span>分隔符</span>
        <input type="text" data-separator placeholder="例如：," value="${item.key === 'list_to_text' ? ', ' : ','}" />
      </label>
    `;
  }

  if (item.key === 'list_sort') {
    return `
      <label class="field">
        <span>排序方式</span>
        <select data-sort-mode>
          <option value="asc">升序</option>
          <option value="desc">降序</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'list_add_prefix_suffix') {
    return `
      <label class="field">
        <span>前缀</span>
        <input type="text" data-prefix-text placeholder="例如：[" />
      </label>
      <label class="field">
        <span>后缀</span>
        <input type="text" data-suffix-text placeholder="例如：]" />
      </label>
    `;
  }

  if (item.key === 'list_cut_left' || item.key === 'list_cut_right') {
    return `
      <label class="field">
        <span>字符数量</span>
        <input type="number" min="1" step="1" data-cut-length value="3" />
      </label>
    `;
  }

  if (item.key === 'text_regex_extract') {
    return `
      <label class="field">
        <span>正则表达式</span>
        <input type="text" data-regex-pattern placeholder="例如：[A-Z]-\\d+" />
      </label>
    `;
  }

  if (item.key === 'text_unicode_convert') {
    return `
      <label class="field">
        <span>转换方式</span>
        <select data-unicode-mode>
          <option value="encode">编码为 Unicode</option>
          <option value="decode">解码为文本</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'text_symbol_convert') {
    return `
      <label class="field">
        <span>转换方向</span>
        <select data-symbol-mode>
          <option value="en_to_zh">英文符号转中文符号</option>
          <option value="zh_to_en">中文符号转英文符号</option>
        </select>
      </label>
    `;
  }

  if (item.key === 'text_banned_words_check') {
    return `
      <label class="field field-wide">
        <span>违禁词词库</span>
        <textarea data-banned-words rows="6" placeholder="每行一个违禁词"></textarea>
      </label>
    `;
  }

  if (item.key === 'text_uuid_generate') {
    return `
      <label class="field">
        <span>生成数量</span>
        <input type="number" min="1" max="100" step="1" data-uuid-count value="10" />
      </label>
    `;
  }

  return '';
}

function createLocalTextToolResultMarkup(item) {
  return `
    <div class="text-tool-result-shell">
      <div class="text-tool-result-summary hidden" data-text-tool-summary></div>
      <label class="field field-wide">
        <span>处理结果</span>
        <textarea data-output-text rows="10" readonly placeholder="处理结果会显示在这里"></textarea>
      </label>
      <button class="button button-muted text-tool-copy-button" type="button" data-copy-output="${item.key}">
        复制结果
      </button>
      <a class="button button-muted hidden" data-local-text-download download="${item.key === 'text_text_to_srt' ? 'generated-subtitles.srt' : 'subtitle-text.txt'}">
        导出文件
      </a>
    </div>
  `;
}

function createToolSummary(item) {
  const text = String(item.helperText || '').trim();
  if (!text) {
    return '打开后即可上传文件并开始处理。';
  }

  return text.replace(/，建议单个文件不超过.*$/, '').replace(/，复杂分页按实际导出结果为准。$/, '。');
}

function createToolMetaMarkup(item, cardMeta) {
  const metaItems = [];
  const acceptsText = formatAccepts(item.accepts);
  if (acceptsText) {
    metaItems.push(`<span class="tool-meta-pill">${acceptsText}</span>`);
  }

  if (item.maxTotalFileSizeMb) {
    metaItems.push(`<span class="tool-meta-pill">多文件</span>`);
    metaItems.push(`<span class="tool-meta-pill">总计 ${item.maxTotalFileSizeMb}MB</span>`);
  } else if (item.maxFileSizeMb) {
    metaItems.push(`<span class="tool-meta-pill">${item.maxFileSizeMb}MB</span>`);
  }

  if (metaItems.length === 0) {
    metaItems.push(`<span class="tool-meta-pill">${cardMeta.badge}</span>`);
  }

  return metaItems.join('');
}

function formatAccepts(accepts) {
  const items = String(accepts || '')
    .split(',')
    .map((item) => item.trim().replace(/^\./, '').toUpperCase())
    .filter(Boolean);
  if (items.length === 0) {
    return '';
  }

  return items.slice(0, 2).join(' / ');
}
