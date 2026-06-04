import { createUuToolCardMarkup } from './toolCardMeta.mjs';

export function createToolOverviewMarkup(conversions) {
  return conversions
    .map(
      (item) => {
        return createUuToolCardMarkup(item, createToolSummary(item));
      }
    )
    .join('');
}

export function createToolDetailMarkup(item, options = {}) {
  const { showHeader = true } = options;
  if (item.kind === 'local_text') {
    return createLocalTextToolDetailMarkup(item, options);
  }
  if (['local_dev_tool', 'backend_dev_tool', 'network_dev_tool', 'server_dev_tool'].includes(item.kind)) {
    return createDevToolDetailMarkup(item, options);
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

function createDevToolDetailMarkup(item, options = {}) {
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

  if (item.key === 'sign_stamp_pdf') {
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

function supportsMultipleFiles(conversionKey) {
  return conversionKey === 'images_to_pdf' || conversionKey === 'merge_pdf';
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
