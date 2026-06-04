export const devToolCatalog = [
  {
    key: 'dev_base64_codec',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Base64 加解密',
    helperText: '对文本进行 Base64 编码与解码处理。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_unicode_encode',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '中文转 Unicode',
    helperText: '把文本批量转换成 Unicode 转义序列。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_unicode_decode',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Unicode 还原',
    helperText: '把 Unicode 转义序列还原成原始文本。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_halfwidth_to_fullwidth',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '半角转全角',
    helperText: '把半角字符批量转换为全角字符。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_fullwidth_to_halfwidth',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '全角转半角',
    helperText: '把全角字符批量转换为半角字符。',
    badgeTone: 'green'
  },
  {
    key: 'dev_decimal_unicode_encode',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '文本转十进制 Unicode',
    helperText: '把文本逐字符转换为十进制 Unicode 编码。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_url_codec',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'URL 编解码',
    helperText: '对 URL 文本进行编码或解码处理。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_basic_auth_credential',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Basic Auth 凭证计算',
    helperText: '根据用户名和密码生成 Basic Auth 请求头。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_md5_hash',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'md5 加密',
    helperText: '对文本进行 md5 哈希计算。',
    badgeTone: 'red'
  },
  {
    key: 'dev_md5_batch',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'md5 批量加密',
    helperText: '按行对文本列表批量进行 md5 哈希计算。',
    badgeTone: 'red'
  },
  {
    key: 'dev_string_hash',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '字符串哈希/散列',
    helperText: '按指定算法计算字符串哈希值。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_timestamp_convert',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '时间戳转换',
    helperText: '支持时间戳与日期文本互转。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_crontab_parse',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Crontab 解析',
    helperText: '解析 Crontab 表达式并预测未来执行时间。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_radix_convert',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '任意进制转换',
    helperText: '支持 2 到 36 进制互转。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_text_to_base_n',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '文本转进制',
    helperText: '把文本字符转成指定进制编码。',
    badgeTone: 'green'
  },
  {
    key: 'dev_base_n_to_text',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '进制转文本',
    helperText: '把指定进制编码还原为原始文本。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_html_to_js_string',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'HTML 转 JS 字符串',
    helperText: '把 HTML 片段转换成可直接放进 JS 的字符串。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_strip_html_tags',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'HTML 标签去除',
    helperText: '去除 HTML 标签并保留纯文本内容。',
    badgeTone: 'green'
  },
  {
    key: 'dev_newline_to_br',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '回车转 BR 标签',
    helperText: '把文本中的换行符转换成 HTML 的 BR 标签。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_svg_to_datauri',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'SVG 转 DataURI',
    helperText: '把 SVG 标记转换为可直接嵌入的 Data URI。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_html_preview',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'HTML 预览',
    helperText: '实时预览输入的 HTML 内容。',
    badgeTone: 'green'
  },
  {
    key: 'dev_urls_to_sitemap',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'URL 转 sitemap',
    helperText: '把逐行 URL 列表转换为标准 Sitemap XML。',
    badgeTone: 'green'
  },
  {
    key: 'dev_robots_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Robots 生成',
    helperText: '快速生成 robots.txt 内容。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_html_entity_codec',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'HTML 实体编解码',
    helperText: '把文本与 HTML 实体进行互转。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_http_headers_to_json',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'HTTP 头转 JSON',
    helperText: '把原始请求头文本转换成格式化 JSON。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_cookie_to_json',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Cookie 转 JSON',
    helperText: '把 Cookie 字符串转换成格式化 JSON。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_json_format',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 格式化',
    helperText: '对 JSON 文本进行格式化、美化和校验。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_list_to_json',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '列表转 JSON',
    helperText: '把逐行列表转换成 JSON 数组。',
    badgeTone: 'green'
  },
  {
    key: 'dev_json_to_list',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 转列表',
    helperText: '把 JSON 数组内容提取成逐行文本列表。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_json_field_extract',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 字段提取',
    helperText: '按字段路径提取 JSON 中的目标值。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_json_string_to_number',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 字符串值转数值',
    helperText: '把 JSON 中像数字的字符串值批量转换成数值。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_json_number_to_string',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 数值转字符串',
    helperText: '把 JSON 中的数值批量转换成字符串。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_json_to_csv',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 转 CSV',
    helperText: '把 JSON 数组快速转换成 CSV 表格文本。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_json_to_php',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 转 PHP',
    helperText: '把 JSON 数据转换成 PHP 数组语法。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_js_object_to_json',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JS 对象转 JSON',
    helperText: '把 JS 对象字面量转换成格式化 JSON。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_json_to_js_object',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 转 JS 对象',
    helperText: '把 JSON 转成可直接使用的 JS 对象常量。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_json_merge',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 合并',
    helperText: '按空行分隔多个 JSON 后合并成一个结果。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_json_key_value_extract',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON 键值对提取',
    helperText: '把 JSON 展平为逐行键值对，方便核对和导出。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_excel_to_json',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'excel转json',
    helperText: '粘贴 Excel 表格内容后转成 JSON 数组。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_excel_to_array',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'excel转数组',
    helperText: '把粘贴的 Excel 表格内容转换成二维数组。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_excel_to_html',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'excel转html',
    helperText: '把表格文本转换成 HTML table 代码。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_json_to_array',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'json转数组',
    helperText: '把 JSON 转成 JavaScript 对象或数组字面量。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_json_array_to_excel',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON数组转Excel',
    helperText: '把 JSON 数组转成可直接粘贴到 Excel 的制表符文本。',
    badgeTone: 'green'
  },
  {
    key: 'dev_json_object_to_excel',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JSON对象转Excel',
    helperText: '把 JSON 对象转成双列表格文本，便于粘贴到 Excel。',
    badgeTone: 'green'
  },
  {
    key: 'dev_excel_to_kv_json',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'excel转键值对对象json',
    helperText: '把两列表格文本转换成键值对 JSON 对象。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_kv_json_to_excel',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '键值对对象json转excel',
    helperText: '把 JSON 对象转成 key/value 两列表格文本。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_json_flatten',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'json多级转一级',
    helperText: '把多层 JSON 展平成点路径键。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_json_expand',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '在线json一级转多级还原工具',
    helperText: '把点路径键的 JSON 还原成多层结构。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_json_missing_find',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'json缺失项查找',
    helperText: '对比两个 JSON，找出第二份里缺失的字段路径。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_json_clear_values',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'json键值清空',
    helperText: '保留 JSON 结构，只清空值内容。',
    badgeTone: 'red'
  },
  {
    key: 'dev_json_slice',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'json切割',
    helperText: '按固定数量切分 JSON 数组，输出多段结果。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_rsa_keypair_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'RSA 密钥对生成',
    helperText: '生成 PEM 格式的 RSA 公钥和私钥。',
    badgeTone: 'red'
  },
  {
    key: 'dev_uuid_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'UUID 生成器',
    helperText: '按数量批量生成唯一标识符。',
    badgeTone: 'green'
  },
  {
    key: 'dev_browser_ua_info',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '浏览器 UA 查询',
    helperText: '读取当前浏览器的 User-Agent、平台和语言信息。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_screen_info',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '设备屏幕参数检测',
    helperText: '读取当前设备的屏幕分辨率、可用区域和像素比。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_browser_fingerprint_check',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '浏览器指纹检测',
    helperText: '读取当前浏览器和设备的常见指纹信息。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_multi_source_ip_check',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '多节点 IP 检测',
    helperText: '通过多个公网回显源检测当前设备出口 IP，便于快速对比结果。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_nslookup_query',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Nslookup 查询',
    helperText: '查询域名常见 DNS 记录，包括 A、CNAME、MX、NS、TXT。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_ip_to_hostname',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: 'IP 地址获取主机名',
    helperText: '根据 IPv4 或 IPv6 地址反向查询 PTR 主机名。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_ssl_chain_download',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: 'SSL 证书链下载',
    helperText: '读取目标站点完整证书链并输出 PEM 文本。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_dead_link_check',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: '死链检测',
    helperText: '批量检测 URL 列表的可访问状态和跳转结果。',
    badgeTone: 'red'
  },
  {
    key: 'dev_batch_request',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: '批量请求',
    helperText: '对同一个 URL 连续发起多次请求，适合触发回调或稳定性检查。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_api_batch_request',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'API 批量请求',
    helperText: '对多个 API 复用同一组查询参数并汇总结果。',
    badgeTone: 'green'
  },
  {
    key: 'dev_icp_query',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ICP备案查询',
    helperText: '根据域名查询备案号、主办单位和主体性质。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_icp_batch_query',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ICP备案批量查询',
    helperText: '按行批量查询多个域名的备案信息。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_sitemap_extract',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: 'sitemap 链接提取',
    helperText: '读取 Sitemap XML 并提取全部 URL 链接。',
    badgeTone: 'slate'
  },
  {
    key: 'dev_html_link_extract',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页链接提取',
    helperText: '读取网页源码并批量提取 href 链接。',
    badgeTone: 'green'
  },
  {
    key: 'dev_meta_info_check',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页 meta 信息检测',
    helperText: '读取网页标题、描述、关键词、Canonical 和 Robots 信息。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_tdk_check',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页 TDK 信息检测',
    helperText: '检测网页的 Title、Keywords、Description 信息。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_keyword_density_check',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页关键词密度检测',
    helperText: '检测页面中指定关键词的出现次数和密度。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_spider_preview',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页蜘蛛模拟抓取',
    helperText: '抓取页面标题、Heading 结构与正文预览，模拟蜘蛛视角。',
    badgeTone: 'green'
  },
  {
    key: 'dev_ssl_check',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: '网站 SSL 证书检测',
    helperText: '检测目标网站证书主题、签发者与有效期信息。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_ssl_expiry_check',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: 'SSL 证书过期查询',
    helperText: '查询网站 SSL 证书到期时间和剩余天数。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_gzip_check',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页 gzip 压缩检测',
    helperText: '检测目标网页是否启用 gzip 压缩及返回头信息。',
    badgeTone: 'green'
  },
  {
    key: 'dev_brotli_check',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页 brotli 压缩检测',
    helperText: '检测目标网页是否启用 brotli 压缩及返回头信息。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_redirect_analysis',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: 'URL 重定向分析',
    helperText: '按顺序分析一个 URL 的跳转链路。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_whois_lookup',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: '域名 whois 查询',
    helperText: '查询域名注册商、创建时间、到期时间和 Name Server 信息。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_cdn_check',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: '网站 CDN 检测',
    helperText: '根据域名解析结果和 CNAME 链判断是否疑似接入 CDN。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_ssl_cert_parse',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: 'SSL 证书解析',
    helperText: '解析 PEM 或 DER 证书文本。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_php_password_hash',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'PHP password_hash',
    helperText: '生成兼容 PHP password_hash 的 bcrypt 哈希。',
    badgeTone: 'red'
  },
  {
    key: 'dev_js_format',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JS 美化压缩',
    helperText: '支持 JavaScript 代码美化和压缩。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_css_format',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'CSS 美化压缩',
    helperText: '支持 CSS 代码美化和压缩。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_html_format',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'HTML 美化压缩',
    helperText: '支持 HTML 代码美化和压缩。',
    badgeTone: 'green'
  },
  {
    key: 'dev_css_js_clear',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'CSS/JS 清除',
    helperText: '清除 HTML 里的样式和脚本痕迹。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_add_http_protocol',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '批量添加http协议',
    helperText: '为缺少协议的链接批量补全 http:// 前缀。',
    badgeTone: 'green'
  },
  {
    key: 'dev_url_params_remove',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '链接url参数批量移除',
    helperText: '批量移除 URL 列表中的查询参数。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_url_params_set',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'get参数批量设置',
    helperText: '批量为 URL 添加或覆盖指定参数。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_web_meta_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '网页meta标签生成',
    helperText: '根据标题、描述、关键词生成网页 meta 标签。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_ipv6_check',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ipv6地址检测',
    helperText: '检测当前网络是否可直接访问 IPv6。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_short_url_restore',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: '短链接还原',
    helperText: '解析短链接跳转后的最终目标地址。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_domain_to_ip_batch',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: '域名批量反查ip',
    helperText: '批量查询域名对应的 IPv4 / IPv6 地址。',
    badgeTone: 'green'
  },
  {
    key: 'dev_whois_batch',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'whois批量查询',
    helperText: '批量查询多个域名的 whois 核心字段。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_ddl_to_php_array',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'DDL转PHP数组',
    helperText: '将SQL建表语句(DDL)转换为PHP数组代码。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_field_list_to_php_array',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '字段列表转php数组',
    helperText: '免费在线将文本列表转换为PHP数组代码。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_text_list_to_js_object',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '文本列表转js对象',
    helperText: '将文本列表转换成js对象变量的代码',
    badgeTone: 'blue'
  },
  {
    key: 'dev_css_to_js',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'css转js',
    helperText: '将css样式转换成js动态插入页面中',
    badgeTone: 'orange'
  },
  {
    key: 'dev_html_to_json',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'HTML转JSON',
    helperText: '免费在线将HTML代码转换为JSON字符串。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_js_data_import',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JS数据导入',
    helperText: '免费在线将文本或文件导入为JS变量。',
    badgeTone: 'green'
  },
  {
    key: 'dev_js_obfuscate',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'JS混淆加密',
    helperText: '免费在线加密混淆并保护您的JS代码。',
    badgeTone: 'red'
  },
  {
    key: 'dev_php_obfuscate',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'php代码混淆加密',
    helperText: '混淆加密php代码',
    badgeTone: 'red'
  },
  {
    key: 'dev_yui_js_minify',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'YUI JS代码压缩',
    helperText: '在线压缩JS代码，减小文件体积并提升加载效率',
    badgeTone: 'orange'
  },
  {
    key: 'dev_yui_css_minify',
    kind: 'server_dev_tool',
    categoryKey: 'dev_tools',
    label: 'YUI CSS代码压缩',
    helperText: '在线压缩CSS代码，减小文件体积并提升加载效率',
    badgeTone: 'blue'
  },
  {
    key: 'dev_html_inline_style_remove',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'html代码行内样式删除',
    helperText: '删除html代码中的指定行内样式',
    badgeTone: 'green'
  },
  {
    key: 'dev_cookie_import_code',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Cookie导入',
    helperText: '免费在线生成Cookie导入代码或书签。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_frontend_i18n_convert',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '前端多语言i18n处理',
    helperText: '免费在线处理前端i18n多语言配置与Excel转换。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_qq_block_check',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '域名qq拦截检测',
    helperText: '批量检测域名是否被qq拦截/被墙。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_wechat_block_check',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '域名微信拦截检测',
    helperText: '批量检测域名是否被微信拦截/被墙。',
    badgeTone: 'green'
  },
  {
    key: 'dev_cdn_node_ip_check',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'cdn节点ip地址检测',
    helperText: '通过全球多节点检测 CDN 的响应 IP 地址。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_seo_backlink_publish',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'SEO外链发布',
    helperText: '免费在线批量发布SEO外链任务，提升网站抓取机会。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_ip_random_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ip地址随机生成',
    helperText: '随机批量生成指定地区的ip地址。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_ip_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ip地址生成',
    helperText: '免费在线随机生成指定数量的IPv4地址。',
    badgeTone: 'green'
  },
  {
    key: 'dev_ip_range_restore',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ip地址段还原解析',
    helperText: '将ip地址段还原解析成ip地址列表。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_ip_to_number',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ip地址转数字',
    helperText: '免费在线将IPv4地址转换为十进制数字。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_mac_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'mac地址生成',
    helperText: '免费在线随机生成MAC物理地址。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_ipv4_to_ipv6',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ipv4转ipv6',
    helperText: '免费在线将IPv4地址转换为IPv6地址格式。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_sha1_hash',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'sha1加密',
    helperText: '免费在线生成文本SHA1哈希值。',
    badgeTone: 'red'
  },
  {
    key: 'dev_sha224_hash',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'sha224加密',
    helperText: '免费在线生成文本SHA224哈希值。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_sha256_hash',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'sha256加密',
    helperText: '免费在线生成文本SHA256哈希值。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_sha384_hash',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'sha384加密',
    helperText: '免费在线生成文本SHA384哈希值。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_sha512_hash',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'sha512加密',
    helperText: '免费在线生成文本SHA512哈希值。',
    badgeTone: 'green'
  },
  {
    key: 'dev_ascii_batch_encode',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '字符串批量转ascii编码',
    helperText: '批量将字符串拆分后转成ascii编码。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_image_to_base64',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '图片转base64',
    helperText: '免费在线图片转Base64工具，支持图片与Base64编码一键互转，即时预览。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_base64_to_image',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '图像base64转图像',
    helperText: '免费在线图片转Base64工具，支持图片与Base64编码一键互转，即时预览。',
    badgeTone: 'green'
  },
  {
    key: 'dev_random_color_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '随机颜色生成',
    helperText: '免费在线批量生成随机十六进制颜色代码。',
    badgeTone: 'orange'
  },
  {
    key: 'dev_rich_text_editor',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '富文本编辑器',
    helperText: '免费在线HTML富文本编辑器，基于百度UEditor。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_ckeditor4',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ckeditor4富文本编辑器',
    helperText: '免费在线CKEditor4富文本编辑器，经典的Web富文本编辑工具。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_ckeditor5',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'ckeditor5富文本编辑器',
    helperText: '免费在线CKEditor5富文本编辑器，体验新一代Web编辑器功能。',
    badgeTone: 'cyan'
  },
  {
    key: 'dev_tinymce',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'tinymce富文本编辑器',
    helperText: '免费在线TinyMCE富文本编辑器，功能强大的轻量级Web编辑器。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_win_desktop_client_generator',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'win桌面客户端生成器',
    helperText: '使用一个域名或url生成windows桌面客户端软件。',
    badgeTone: 'purple'
  },
  {
    key: 'dev_bt_firewall_ip_import',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '宝塔防火墙ip批量导入',
    helperText: '一键生成宝塔ip批量导入规则json。',
    badgeTone: 'yellow'
  },
  {
    key: 'dev_fontawesome_to_image',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'FontAwesome转图片',
    helperText: '免费在线将FontAwesome图标转换为图片。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_google_translate_tag_clean',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: '谷歌翻译标签处理',
    helperText: '免费在线处理谷歌网页翻译后自动添加的font标签。',
    badgeTone: 'green'
  },
  {
    key: 'dev_dlib_face_landmarks',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'dlib人脸关键点读取',
    helperText: '免费在线读取人脸照片中68个关键标志点的位置。',
    badgeTone: 'purple'
  }
];

export function getDevToolByKey(toolKey) {
  return devToolCatalog.find((item) => item.key === toolKey) || null;
}
