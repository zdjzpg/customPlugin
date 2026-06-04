const toolCardMeta = {
  word_to_pdf: { badge: 'Word', iconClass: 'fa fa-file-word-o', styleClass: 'style13' },
  excel_to_pdf: { badge: 'Excel', iconClass: 'fa fa-file-excel-o', styleClass: 'style6' },
  ppt_to_pdf: { badge: 'PPT', iconClass: 'fa fa-file-powerpoint-o', styleClass: 'style15' },
  pdf_to_pptx: { badge: 'PPT', iconClass: 'fa fa-file-powerpoint-o', styleClass: 'style5' },
  pdf_to_word: { badge: 'Word', iconClass: 'fa fa-file-word-o', styleClass: 'style3' },
  delete_pages_pdf: { badge: '页面', iconClass: 'fa fa-trash-o', styleClass: 'style14' },
  reorder_pages_pdf: { badge: '排序', iconClass: 'fa fa-sort-amount-asc', styleClass: 'style9' },
  protect_unlock_pdf: { badge: '安全', iconClass: 'fa fa-lock', styleClass: 'style8' },
  watermark_pdf: { badge: '水印', iconClass: 'fa fa-tint', styleClass: 'style10' },
  add_page_numbers_pdf: { badge: '页码', iconClass: 'fa fa-list-ol', styleClass: 'style12' },
  sign_stamp_pdf: { badge: '签章', iconClass: 'fa fa-pencil-square-o', styleClass: 'style5' },
  rotate_pdf: { badge: '旋转', iconClass: 'fa fa-repeat', styleClass: 'style2' },
  pdf_to_images: { badge: '图片', iconClass: 'fa fa-file-image-o', styleClass: 'style7' },
  images_to_pdf: { badge: 'PDF', iconClass: 'fa fa-picture-o', styleClass: 'style3' },
  merge_pdf: { badge: '合并', iconClass: 'fa fa-files-o', styleClass: 'style9' },
  compress_pdf: { badge: '压缩', iconClass: 'fa fa-compress', styleClass: 'style3' },
  pdf_extract_pages: { badge: '提取', iconClass: 'fa fa-files-o', styleClass: 'style5' },
  split_pdf: { badge: '拆分', iconClass: 'fa fa-scissors', styleClass: 'style4' },

  text_unique: { badge: '文本', iconClass: 'fa fa-filter', styleClass: 'style14' },
  text_remove_blank_lines: { badge: '去除空行', iconClass: 'fa fa-align-justify', styleClass: 'style4' },
  text_remove_spaces: { badge: '空格', iconClass: 'fa fa-eraser', styleClass: 'style12' },
  text_replace_batch: { badge: '批量替换', iconClass: 'fa fa-refresh', styleClass: 'style13' },
  text_char_count: { badge: '文本', iconClass: 'fa fa-calculator', styleClass: 'style12' },
  text_case_convert: { badge: '英文', iconClass: 'fa fa-text-height', styleClass: 'style7' },
  text_extract_urls: { badge: '链接提取', iconClass: 'fa fa-link', styleClass: 'style10' },
  text_extract_emails: { badge: '邮箱提取', iconClass: 'fa fa-envelope-o', styleClass: 'style15' },
  text_extract_phones: { badge: '手机号提取', iconClass: 'fa fa-phone', styleClass: 'style8' },
  text_extract_domains: { badge: '域名提取', iconClass: 'fa fa-globe', styleClass: 'style6' },
  text_extract_ips: { badge: 'IP提取', iconClass: 'fa fa-server', styleClass: 'style3' },
  text_extract_numbers: { badge: '数字提取', iconClass: 'fa fa-sort-numeric-asc', styleClass: 'style6' },
  text_to_list: { badge: '文本', iconClass: 'fa fa-list', styleClass: 'style3' },
  list_to_text: { badge: '列表转文本', iconClass: 'fa fa-file-text-o', styleClass: 'style13' },
  list_sort: { badge: '文本排序', iconClass: 'fa fa-sort-alpha-asc', styleClass: 'style4' },
  list_shuffle: { badge: '列表打乱', iconClass: 'fa fa-random', styleClass: 'style11' },
  list_duplicate_count: { badge: '列表统计', iconClass: 'fa fa-list-alt', styleClass: 'style4' },
  list_add_prefix_suffix: { badge: '文本', iconClass: 'fa fa-plus-square-o', styleClass: 'style7' },
  list_cut_left: { badge: '截取', iconClass: 'fa fa-scissors', styleClass: 'style8' },
  list_cut_right: { badge: '截取', iconClass: 'fa fa-scissors', styleClass: 'style2' },
  text_regex_extract: { badge: '文本', iconClass: 'fa fa-code', styleClass: 'style13' },
  text_unicode_convert: { badge: 'unicode', iconClass: 'fa fa-language', styleClass: 'style4' },
  text_money_upper: { badge: '数值', iconClass: 'fa fa-cny', styleClass: 'style14' },
  text_symbol_convert: { badge: '中文', iconClass: 'fa fa-exchange', styleClass: 'style8' },
  text_banned_words_check: { badge: '违禁词检测', iconClass: 'fa fa-ban', styleClass: 'style3' },
  text_uuid_generate: { badge: 'uuid生成', iconClass: 'fa fa-key', styleClass: 'style7' },

  dev_base64_codec: { badge: 'base64', iconClass: 'fa fa-exchange', styleClass: 'style2' },
  dev_unicode_encode: { badge: 'unicode', iconClass: 'fa fa-language', styleClass: 'style4' },
  dev_unicode_decode: { badge: 'unicode', iconClass: 'fa fa-undo', styleClass: 'style1' },
  dev_halfwidth_to_fullwidth: { badge: '半角', iconClass: 'fa fa-expand', styleClass: 'style11' },
  dev_fullwidth_to_halfwidth: { badge: '半角', iconClass: 'fa fa-compress', styleClass: 'style9' },
  dev_decimal_unicode_encode: { badge: '编码', iconClass: 'fa fa-sort-numeric-asc', styleClass: 'style5' },
  dev_url_codec: { badge: 'url', iconClass: 'fa fa-code', styleClass: 'style4' },
  dev_basic_auth_credential: { badge: 'http', iconClass: 'fa fa-key', styleClass: 'style14' },
  dev_md5_hash: { badge: 'MD5加密', iconClass: 'fa fa-lock', styleClass: 'style11' },
  dev_md5_batch: { badge: 'md5', iconClass: 'fa fa-lock', styleClass: 'style8' },
  dev_string_hash: { badge: '字符串', iconClass: 'fa fa-lock', styleClass: 'style7' },
  dev_timestamp_convert: { badge: '时间戳', iconClass: 'fa fa-clock-o', styleClass: 'style12' },
  dev_crontab_parse: { badge: 'crontab解析', iconClass: 'fa fa-list-alt', styleClass: 'style14' },
  dev_radix_convert: { badge: '进制', iconClass: 'fa fa-random', styleClass: 'style11' },
  dev_text_to_base_n: { badge: '文本转进制', iconClass: 'fa fa-calculator', styleClass: 'style3' },
  dev_base_n_to_text: { badge: '进制转文本', iconClass: 'fa fa-file-text-o', styleClass: 'style12' },
  dev_html_to_js_string: { badge: 'html', iconClass: 'fa fa-code', styleClass: 'style6' },
  dev_strip_html_tags: { badge: 'html', iconClass: 'fa fa-eraser', styleClass: 'style3' },
  dev_newline_to_br: { badge: '回车转BR', iconClass: 'fa fa-paragraph', styleClass: 'style10' },
  dev_svg_to_datauri: { badge: 'svg转换', iconClass: 'fa fa-file-code-o', styleClass: 'style11' },
  dev_html_preview: { badge: 'HTML预览', iconClass: 'fa fa-html5', styleClass: 'style14' },
  dev_urls_to_sitemap: { badge: 'url', iconClass: 'fa fa-sitemap', styleClass: 'style9' },
  dev_robots_generate: { badge: 'Robots生成', iconClass: 'fa fa-android', styleClass: 'style12' },
  dev_html_entity_codec: { badge: 'html', iconClass: 'fa fa-paragraph', styleClass: 'style15' },
  dev_http_headers_to_json: { badge: 'http', iconClass: 'fa fa-exchange', styleClass: 'style3' },
  dev_cookie_to_json: { badge: 'Cookie转换', iconClass: 'fa fa-exchange', styleClass: 'style9' },
  dev_json_format: { badge: 'JSON格式化', iconClass: 'fa fa-indent', styleClass: 'style6' },
  dev_list_to_json: { badge: '列表转JSON', iconClass: 'fa fa-code', styleClass: 'style1' },
  dev_json_to_list: { badge: 'json转列表', iconClass: 'fa fa-list-ul', styleClass: 'style15' },
  dev_json_field_extract: { badge: 'JSON提取', iconClass: 'fa fa-code', styleClass: 'style9' },
  dev_json_string_to_number: { badge: 'json', iconClass: 'fa fa-sort-numeric-asc', styleClass: 'style8' },
  dev_json_number_to_string: { badge: 'json', iconClass: 'fa fa-quote-left', styleClass: 'style2' },
  dev_json_to_csv: { badge: 'JSON转CSV', iconClass: 'fa fa-table', styleClass: 'style2' },
  dev_json_to_php: { badge: 'json转php', iconClass: 'fa fa-exchange', styleClass: 'style15' },
  dev_js_object_to_json: { badge: 'JS对象转JSON', iconClass: 'fa fa-exchange', styleClass: 'style10' },
  dev_json_to_js_object: { badge: 'JSON转JS对象', iconClass: 'fa fa-exchange', styleClass: 'style12' },
  dev_json_merge: { badge: 'JSON合并', iconClass: 'fa fa-compress', styleClass: 'style13' },
  dev_json_key_value_extract: { badge: 'JSON提取', iconClass: 'fa fa-list-alt', styleClass: 'style3' },
  dev_excel_to_json: { badge: 'excel', iconClass: 'fa fa-file-text-o', styleClass: 'style10' },
  dev_excel_to_array: { badge: 'excel', iconClass: 'fa fa-file-excel-o', styleClass: 'style4' },
  dev_excel_to_html: { badge: 'excel', iconClass: 'fa fa-table', styleClass: 'style15' },
  dev_json_to_array: { badge: 'json转数组', iconClass: 'fa fa-code', styleClass: 'style5' },
  dev_json_array_to_excel: { badge: 'json转excel', iconClass: 'fa fa-file-excel-o', styleClass: 'style14' },
  dev_json_object_to_excel: { badge: 'json转excel', iconClass: 'fa fa-file-excel-o', styleClass: 'style7' },
  dev_excel_to_kv_json: { badge: 'Excel转JSON', iconClass: 'fa fa-table', styleClass: 'style15' },
  dev_kv_json_to_excel: { badge: 'JSON转Excel', iconClass: 'fa fa-file-excel-o', styleClass: 'style2' },
  dev_json_flatten: { badge: 'JSON扁平化', iconClass: 'fa fa-compress', styleClass: 'style2' },
  dev_json_expand: { badge: 'JSON还原', iconClass: 'fa fa-expand', styleClass: 'style15' },
  dev_json_missing_find: { badge: 'JSON对比', iconClass: 'fa fa-search', styleClass: 'style10' },
  dev_json_clear_values: { badge: 'json', iconClass: 'fa fa-eraser', styleClass: 'style3' },
  dev_json_slice: { badge: 'json', iconClass: 'fa fa-scissors', styleClass: 'style14' },
  dev_rsa_keypair_generate: { badge: 'RSA密钥', iconClass: 'fa fa-key', styleClass: 'style8' },
  dev_uuid_generate: { badge: 'uuid生成', iconClass: 'fa fa-key', styleClass: 'style7' },
  dev_browser_ua_info: { badge: '浏览器', iconClass: 'fa fa-desktop', styleClass: 'style6' },
  dev_screen_info: { badge: '屏幕检测', iconClass: 'fa fa-desktop', styleClass: 'style4' },
  dev_browser_fingerprint_check: { badge: '指纹检测', iconClass: 'fa fa-chrome', styleClass: 'style7' },
  dev_multi_source_ip_check: { badge: 'IP检测', iconClass: 'fa fa-globe', styleClass: 'style1' },
  dev_nslookup_query: { badge: 'Nslookup', iconClass: 'fa fa-globe', styleClass: 'style7' },
  dev_ip_to_hostname: { badge: 'IP反查', iconClass: 'fa fa-server', styleClass: 'style7' },
  dev_ssl_chain_download: { badge: 'ssl', iconClass: 'fa fa-link', styleClass: 'style14' },
  dev_dead_link_check: { badge: '死链检测', iconClass: 'fa fa-chain-broken', styleClass: 'style10' },
  dev_batch_request: { badge: '批量', iconClass: 'fa fa-paper-plane', styleClass: 'style14' },
  dev_api_batch_request: { badge: 'http', iconClass: 'fa fa-exchange', styleClass: 'style8' },
  dev_icp_query: { badge: '备案', iconClass: 'fa fa-id-card', styleClass: 'style9' },
  dev_icp_batch_query: { badge: '备案', iconClass: 'fa fa-list-alt', styleClass: 'style4' },
  dev_sitemap_extract: { badge: 'sitemap', iconClass: 'fa fa-sitemap', styleClass: 'style6' },
  dev_html_link_extract: { badge: '链接提取', iconClass: 'fa fa-magnet', styleClass: 'style3' },
  dev_meta_info_check: { badge: 'meta', iconClass: 'fa fa-info-circle', styleClass: 'style15' },
  dev_tdk_check: { badge: 'seo', iconClass: 'fa fa-file-code-o', styleClass: 'style9' },
  dev_keyword_density_check: { badge: '密度', iconClass: 'fa fa-percent', styleClass: 'style8' },
  dev_spider_preview: { badge: 'html', iconClass: 'fa fa-bug', styleClass: 'style2' },
  dev_ssl_check: { badge: 'ssl', iconClass: 'fa fa-lock', styleClass: 'style5' },
  dev_ssl_expiry_check: { badge: 'SSL查询', iconClass: 'fa fa-lock', styleClass: 'style2' },
  dev_gzip_check: { badge: 'gzip', iconClass: 'fa fa-compress', styleClass: 'style3' },
  dev_brotli_check: { badge: 'gzip', iconClass: 'fa fa-compress', styleClass: 'style12' },
  dev_redirect_analysis: { badge: 'http', iconClass: 'fa fa-location-arrow', styleClass: 'style13' },
  dev_whois_lookup: { badge: '网站', iconClass: 'fa fa-address-card', styleClass: 'style10' },
  dev_cdn_check: { badge: 'cdn', iconClass: 'fa fa-cloud', styleClass: 'style7' },
  dev_ssl_cert_parse: { badge: 'ssl证书', iconClass: 'fa fa-lock', styleClass: 'style8' },
  dev_php_password_hash: { badge: 'php', iconClass: 'fa fa-lock', styleClass: 'style1' },
  dev_js_format: { badge: 'JS格式化', iconClass: 'fa fa-code', styleClass: 'style5' },
  dev_css_format: { badge: 'CSS格式化', iconClass: 'fa fa-css3', styleClass: 'style14' },
  dev_html_format: { badge: 'HTML格式化', iconClass: 'fa fa-html5', styleClass: 'style7' },
  dev_css_js_clear: { badge: '代码清洗', iconClass: 'fa fa-eraser', styleClass: 'style11' }
  ,
  dev_add_http_protocol: { badge: 'URL补全', iconClass: 'fa fa-link', styleClass: 'style6' },
  dev_url_params_remove: { badge: 'url', iconClass: 'fa fa-filter', styleClass: 'style4' },
  dev_url_params_set: { badge: 'url', iconClass: 'fa fa-sliders', styleClass: 'style2' },
  dev_web_meta_generate: { badge: '标签', iconClass: 'fa fa-tags', styleClass: 'style13' },
  dev_ipv6_check: { badge: 'ip', iconClass: 'fa fa-globe', styleClass: 'style6' },
  dev_short_url_restore: { badge: '短链接', iconClass: 'fa fa-link', styleClass: 'style5' },
  dev_domain_to_ip_batch: { badge: 'ip', iconClass: 'fa fa-globe', styleClass: 'style4' },
  dev_whois_batch: { badge: 'whois', iconClass: 'fa fa-users', styleClass: 'style3' },
  dev_ddl_to_php_array: { badge: 'ddl转换', iconClass: 'fa fa-database', styleClass: 'style1' },
  dev_field_list_to_php_array: { badge: '列表转数组', iconClass: 'fa fa-code', styleClass: 'style8' },
  dev_text_list_to_js_object: { badge: 'js', iconClass: 'fa fa-code', styleClass: 'style11' },
  dev_css_to_js: { badge: 'html', iconClass: 'fa fa-code', styleClass: 'style9' },
  dev_html_to_json: { badge: 'HTML转JSON', iconClass: 'fa fa-exchange', styleClass: 'style12' },
  dev_js_data_import: { badge: 'JS变量', iconClass: 'fa fa-database', styleClass: 'style10' },
  dev_js_obfuscate: { badge: 'js混淆', iconClass: 'fa fa-code', styleClass: 'style11' },
  dev_php_obfuscate: { badge: '代码', iconClass: 'fa fa-file-code-o', styleClass: 'style7' },
  dev_yui_js_minify: { badge: 'YUI', iconClass: 'fa fa-compress', styleClass: 'style5' },
  dev_yui_css_minify: { badge: 'YUI', iconClass: 'fa fa-compress', styleClass: 'style14' },
  dev_html_inline_style_remove: { badge: 'html', iconClass: 'fa fa-css3', styleClass: 'style9' },
  dev_cookie_import_code: { badge: 'Cookie导入', iconClass: 'fa fa-sign-in', styleClass: 'style4' },
  dev_frontend_i18n_convert: { badge: 'i18n工具', iconClass: 'fa fa-language', styleClass: 'style1' }
};

export function getToolCardMeta(toolKey) {
  return toolCardMeta[toolKey] || { badge: '工具', iconClass: 'fa fa-wrench', styleClass: 'style6' };
}

export function createUuToolCardMarkup(item, summaryText) {
  const meta = getToolCardMeta(item.key);

  return `
    <div class="grid-col-sm6 grid-col-md4 grid-col-lg3">
      <article
        class="tool-item ${meta.styleClass}"
        data-open-detail="${item.key}"
        role="button"
        tabindex="0"
      >
        <div class="tool-item__icon" aria-hidden="true"><i class="${meta.iconClass}"></i></div>
        <div class="tool-item__badge">${escapeHtml(meta.badge)}</div>
        <div class="tool-item__title">${escapeHtml(item.label)}</div>
        <p class="tool-item__desc">${escapeHtml(summaryText)}</p>
      </article>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
