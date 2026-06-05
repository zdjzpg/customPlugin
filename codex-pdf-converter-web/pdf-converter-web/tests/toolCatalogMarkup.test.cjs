const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('createToolOverviewMarkup renders compact method cards without upload controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolOverviewMarkup } = await import(moduleUrl);

  const html = createToolOverviewMarkup([
    {
      key: 'pdf_extract_pages',
      label: 'PDF 提取页面',
      helperText: '输入页码范围后提取为一个新的 PDF。'
    }
  ]);

  assert.match(html, /PDF 提取页面/);
  assert.match(html, /输入页码范围后提取为一个新的 PDF。/);
  assert.match(html, /data-open-detail="pdf_extract_pages"/);
  assert.match(html, /class="grid-col-sm6 grid-col-md4 grid-col-lg3"/);
  assert.match(html, /class="tool-item style5"/);
  assert.match(html, /tool-item__badge">提取</);
  assert.match(html, /fa fa-files-o/);
  assert.match(html, /role="button"/);
  assert.match(html, /tabindex="0"/);
  assert.doesNotMatch(html, /type="file"/);
  assert.doesNotMatch(html, /开始转换/);
  assert.doesNotMatch(html, /查看详情/);
});

test('createPreviewToolOverviewMarkup renders locked preview cards without detail entry hooks', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createPreviewToolOverviewMarkup } = await import(moduleUrl);

  const html = createPreviewToolOverviewMarkup([
    {
      key: 'pdf_extract_pages',
      label: 'PDF 提取页面',
      helperText: '输入页码范围后提取为一个新的 PDF。'
    }
  ]);

  assert.match(html, /PDF 提取页面/);
  assert.match(html, /输入页码范围后提取为一个新的 PDF。/);
  assert.match(html, /data-preview-tool="pdf_extract_pages"/);
  assert.match(html, /data-preview-locked/);
  assert.match(html, /aria-disabled="true"/);
  assert.doesNotMatch(html, /data-open-detail=/);
});

test('createToolDetailMarkup renders the selected method form with upload controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'pdf_extract_pages',
    label: 'PDF 提取页面',
    helperText: '输入页码范围后提取为一个新的 PDF，例如 1,3,5-8。',
    accepts: '.pdf',
    maxFileSizeMb: 20
  });

  assert.match(html, /返回列表/);
  assert.match(html, /type="file"/);
  assert.match(html, /开始转换/);
  assert.match(html, /提取页码/);
});

test('createToolDetailMarkup renders a local text tool with textareas instead of file upload', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'text_unique',
    kind: 'local_text',
    label: '文本去重',
    helperText: '删除重复文本行，保留首次出现的内容。'
  });

  assert.match(html, /原始文本/);
  assert.match(html, /处理结果/);
  assert.match(html, /开始处理/);
  assert.doesNotMatch(html, /type="file"/);
});

test('createToolDetailMarkup renders subtitle text tools with srt-specific inputs and download control', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const srtToTextHtml = createToolDetailMarkup({
    key: 'text_srt_to_text',
    kind: 'local_text',
    label: '字幕文件转文本',
    helperText: '上传 SRT 字幕文件后提取纯文本。'
  });
  const textToSrtHtml = createToolDetailMarkup({
    key: 'text_text_to_srt',
    kind: 'local_text',
    label: '文本转字幕',
    helperText: '按每行一句生成 SRT 字幕文件。'
  });

  assert.match(srtToTextHtml, /字幕文件/);
  assert.match(srtToTextHtml, /\.srt/);
  assert.match(srtToTextHtml, /导出文件/);
  assert.match(textToSrtHtml, /每条字幕时长/);
  assert.match(textToSrtHtml, /起始时间/);
  assert.match(textToSrtHtml, /generated-subtitles/);
});

test('createToolDetailMarkup renders a local image tool with canvas preview and export controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_add_text',
    kind: 'local_image_tool',
    label: '图片加文字',
    helperText: '本地加载图片后添加主标题、副标题和角标。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /tool-form-image/);
  assert.match(html, /选择图片/);
  assert.match(html, /主标题/);
  assert.match(html, /副标题/);
  assert.match(html, /角标/);
  assert.match(html, /版式/);
  assert.match(html, /data-local-image-preview/);
  assert.match(html, /导出图片/);
});

test('createToolDetailMarkup renders image_add_border_frame controls for border style and shadow', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_add_border_frame',
    kind: 'local_image_tool',
    label: '图片加边框 / 描边',
    helperText: '给图片加边框、内边距、阴影和圆角。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /边框样式/);
  assert.match(html, /渐变边框/);
  assert.match(html, /阴影强度/);
  assert.match(html, /边框宽度/);
});

test('createToolDetailMarkup renders image_platform_cover_template controls for preset and fit mode', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_platform_cover_template',
    kind: 'local_image_tool',
    label: '平台封面尺寸模板',
    helperText: '按平台预设尺寸导出封面图。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /目标模板/);
  assert.match(html, /闲鱼主图/);
  assert.match(html, /小红书封面/);
  assert.match(html, /铺满裁切/);
  assert.match(html, /模糊铺底/);
  assert.match(html, /批量导出 ZIP/);
  assert.match(html, /data-image-batch-template-option/);
});

test('createToolDetailMarkup renders image_annotate_canvas controls and action buttons', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_annotate_canvas',
    kind: 'local_image_tool',
    label: '图片标注 / 箭头框选',
    helperText: '点击图片快速添加箭头、框选和序号。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /标注类型/);
  assert.match(html, /箭头/);
  assert.match(html, /矩形框/);
  assert.match(html, /序号点/);
  assert.match(html, /局部马赛克/);
  assert.match(html, /data-local-image-undo/);
  assert.match(html, /data-local-image-clear/);
});

test('createToolDetailMarkup renders image_flip_mirror controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_flip_mirror',
    kind: 'local_image_tool',
    label: '图片翻转 / 镜像',
    helperText: '快速做水平镜像、垂直翻转或双向翻转图片。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /翻转方向/);
  assert.match(html, /水平镜像/);
  assert.match(html, /垂直翻转/);
});

test('createToolDetailMarkup renders image_metadata_view_clear controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_metadata_view_clear',
    kind: 'local_image_tool',
    label: '图片元数据查看 / 清除',
    helperText: '查看图片基本信息，并可重新导出清理元数据后的图片。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /处理模式/);
  assert.match(html, /仅查看/);
  assert.match(html, /清除元数据并导出/);
  assert.match(html, /data-local-image-metadata-output/);
});

test('createToolDetailMarkup renders image_blur_redact controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_blur_redact',
    kind: 'local_image_tool',
    label: '图片局部模糊 / 打码',
    helperText: '点击图片快速添加模糊或马赛克区域。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /处理方式/);
  assert.match(html, /模糊/);
  assert.match(html, /马赛克/);
  assert.match(html, /区域宽度/);
  assert.match(html, /data-local-image-undo/);
});

test('createToolDetailMarkup renders image_rotate_adjust controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_rotate_adjust',
    kind: 'local_image_tool',
    label: '图片旋转校正',
    helperText: '按角度快速旋转图片，适合拍照纠正。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /旋转角度/);
  assert.match(html, /90°/);
  assert.match(html, /180°/);
  assert.match(html, /270°/);
});

test('createToolDetailMarkup renders image_object_erase_light controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_object_erase_light',
    kind: 'local_image_tool',
    label: '对象移除 / 涂抹消除',
    helperText: '轻量版局部涂抹消除，不依赖重模型。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /笔刷大小/);
  assert.match(html, /取样偏移/);
  assert.match(html, /轻量版/);
  assert.match(html, /data-local-image-clear/);
});

test('createToolDetailMarkup renders social cover local image tool with ratio and background mode controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_social_cover_pad',
    kind: 'local_image_tool',
    label: '图片加边框 / 社媒封面留白',
    helperText: '自动补留白并导出社媒封面图。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /目标比例/);
  assert.match(html, /背景模式/);
  assert.match(html, /纯色背景/);
  assert.match(html, /模糊原图背景/);
  assert.match(html, /背景颜色/);
});

test('createToolDetailMarkup renders image_privacy_redact controls for redaction mode and size', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_privacy_redact',
    kind: 'local_image_tool',
    label: '图片隐私打码',
    helperText: '点击图片快速给敏感区域打码。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /打码方式/);
  assert.match(html, /局部马赛克/);
  assert.match(html, /模糊打码/);
  assert.match(html, /纯色遮挡/);
  assert.match(html, /打码区域大小/);
  assert.match(html, /data-local-image-undo/);
  assert.match(html, /data-local-image-clear/);
});

test('createToolDetailMarkup renders image_blur_background_fill controls for ratio and output mode', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_blur_background_fill',
    kind: 'local_image_tool',
    label: '图片模糊背景填充',
    helperText: '按目标比例自动生成模糊背景画布。',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20
  });

  assert.match(html, /目标比例/);
  assert.match(html, /模糊强度/);
  assert.match(html, /导出格式/);
});

test('createToolDetailMarkup renders qr_generate without file upload and with content input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'qr_generate',
    label: '二维码生成',
    helperText: '输入文本后生成二维码图片。',
    categoryKey: 'image_tools',
    requiresUpload: false
  });

  assert.match(html, /二维码内容/);
  assert.match(html, /输出尺寸/);
  assert.doesNotMatch(html, /type="file"/);
});

test('createToolDetailMarkup renders a local dev tool with text input and dev-tool result area', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_base64_codec',
    kind: 'local_dev_tool',
    label: 'Base64 加解密',
    helperText: '对文本进行 Base64 编码与解码处理。'
  });

  assert.match(html, /原始文本/);
  assert.match(html, /处理结果/);
  assert.match(html, /Base64/);
  assert.match(html, /data-tool-kind="local_dev_tool"/);
  assert.doesNotMatch(html, /type="file"/);
});

test('createToolDetailMarkup renders a remote dev tool with target-url input and execute button', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_sitemap_extract',
    kind: 'backend_dev_tool',
    label: 'sitemap 链接提取',
    helperText: '读取 Sitemap XML 并提取全部 URL 链接。'
  });

  assert.match(html, /目标地址/);
  assert.match(html, /data-target-url/);
  assert.match(html, /开始处理/);
  assert.match(html, /data-tool-kind="backend_dev_tool"/);
  assert.doesNotMatch(html, /type="file"/);
});

test('createToolDetailMarkup renders html entity dev tool mode choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_html_entity_codec',
    kind: 'local_dev_tool',
    label: 'HTML 实体编解码',
    helperText: '把文本与 HTML 实体进行互转。'
  });

  assert.match(html, /编码为 HTML 实体/);
  assert.match(html, /解码为原始文本/);
});

test('createToolDetailMarkup renders list-to-json dev tool field-name input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_list_to_json',
    kind: 'local_dev_tool',
    label: '列表转 JSON',
    helperText: '把逐行列表转成 JSON 数组。'
  });

  assert.match(html, /字段名/);
  assert.match(html, /data-json-field-name/);
});

test('createToolDetailMarkup renders json-path input for json extraction tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_json_field_extract',
    kind: 'local_dev_tool',
    label: 'JSON 字段提取',
    helperText: '按字段路径提取 JSON 中的目标值。'
  });

  assert.match(html, /字段路径/);
  assert.match(html, /data-json-path/);
});

test('createToolDetailMarkup renders timestamp convert mode choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_timestamp_convert',
    kind: 'local_dev_tool',
    label: '时间戳转换',
    helperText: '支持时间戳与日期文本互转。'
  });

  assert.match(html, /转换方式/);
  assert.match(html, /时间戳转可读时间/);
  assert.match(html, /日期转时间戳/);
  assert.match(html, /data-timestamp-mode/);
});

test('createToolDetailMarkup renders arbitrary radix inputs', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_radix_convert',
    kind: 'local_dev_tool',
    label: '任意进制转换',
    helperText: '支持 2 到 36 进制互转。'
  });

  assert.match(html, /原进制/);
  assert.match(html, /目标进制/);
  assert.match(html, /data-from-base/);
  assert.match(html, /data-to-base/);
});

test('createToolDetailMarkup renders code-base input for text and base conversion tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_text_to_base_n',
    kind: 'local_dev_tool',
    label: '文本转进制',
    helperText: '把文本字符转成指定进制编码。'
  });

  assert.match(html, /编码进制/);
  assert.match(html, /data-code-base/);
});

test('createToolDetailMarkup renders hash algorithm options for string hashing tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_string_hash',
    kind: 'local_dev_tool',
    label: '字符串哈希/散列',
    helperText: '按指定算法计算哈希值。'
  });

  assert.match(html, /哈希算法/);
  assert.match(html, /SHA-256/);
  assert.match(html, /MD5/);
  assert.match(html, /data-hash-algorithm/);
});

test('createToolDetailMarkup renders robots fields for robots generation', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_robots_generate',
    kind: 'local_dev_tool',
    label: 'Robots 生成',
    helperText: '快速生成 robots.txt 内容。'
  });

  assert.match(html, /User-agent/);
  assert.match(html, /Allow/);
  assert.match(html, /Disallow/);
  assert.match(html, /Sitemap/);
  assert.match(html, /data-robots-user-agent/);
  assert.match(html, /data-robots-disallow/);
});

test('createToolDetailMarkup renders crontab helper input for cron parsing', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_crontab_parse',
    kind: 'local_dev_tool',
    label: 'Crontab 解析',
    helperText: '解析 Crontab 表达式并预测未来执行时间。'
  });

  assert.match(html, /起始时间/);
  assert.match(html, /data-cron-start-time/);
});

test('createToolDetailMarkup renders username and password inputs for basic auth calculation', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_basic_auth_credential',
    kind: 'local_dev_tool',
    label: 'Basic Auth 凭证计算',
    helperText: '根据用户名和密码生成 Basic Auth 请求头。'
  });

  assert.match(html, /用户名/);
  assert.match(html, /密码/);
  assert.match(html, /data-basic-auth-username/);
  assert.match(html, /data-basic-auth-password/);
});

test('createToolDetailMarkup renders an iframe preview shell for html preview', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_html_preview',
    kind: 'local_dev_tool',
    label: 'HTML 预览',
    helperText: '实时预览输入的 HTML 内容。'
  });

  assert.match(html, /data-html-preview-frame/);
  assert.match(html, /iframe/);
});

test('createToolDetailMarkup renders certificate textarea for ssl certificate parsing', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_ssl_cert_parse',
    kind: 'backend_dev_tool',
    label: 'SSL 证书解析',
    helperText: '解析 PEM 或 DER 证书文本。'
  });

  assert.match(html, /证书内容/);
  assert.match(html, /data-certificate-text/);
  assert.doesNotMatch(html, /目标地址/);
});

test('createToolDetailMarkup renders json-to-php options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_json_to_php',
    kind: 'local_dev_tool',
    label: 'JSON 转 PHP',
    helperText: '把 JSON 转成 PHP 数组语法。'
  });

  assert.match(html, /短数组/);
  assert.match(html, /传统 array/);
  assert.match(html, /data-php-array-style/);
});

test('createToolDetailMarkup renders json-to-js-object export-name input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_json_to_js_object',
    kind: 'local_dev_tool',
    label: 'JSON 转 JS 对象',
    helperText: '把 JSON 转成 JS 对象常量。'
  });

  assert.match(html, /变量名/);
  assert.match(html, /data-js-export-name/);
});

test('createToolDetailMarkup renders json-merge mode options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_json_merge',
    kind: 'local_dev_tool',
    label: 'JSON 合并',
    helperText: '按空行分隔多个 JSON 后进行合并。'
  });

  assert.match(html, /对象合并/);
  assert.match(html, /数组拼接/);
  assert.match(html, /data-json-merge-mode/);
});

test('createToolDetailMarkup renders rsa generation options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_rsa_keypair_generate',
    kind: 'local_dev_tool',
    label: 'RSA 密钥对生成',
    helperText: '生成 PEM 格式的公钥和私钥。'
  });

  assert.match(html, /密钥位数/);
  assert.match(html, /2048/);
  assert.match(html, /4096/);
  assert.match(html, /data-rsa-key-size/);
});

test('createToolDetailMarkup renders server-backed password-hash tool with source textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_php_password_hash',
    kind: 'server_dev_tool',
    label: 'PHP password_hash',
    helperText: '生成兼容 PHP password_hash 的 bcrypt 哈希。'
  });

  assert.match(html, /原始文本/);
  assert.match(html, /成本因子/);
  assert.match(html, /data-password-hash-cost/);
  assert.doesNotMatch(html, /目标地址/);
});

test('createToolDetailMarkup renders formatter mode choices for js css and html tools', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_js_format',
    kind: 'server_dev_tool',
    label: 'JS 美化压缩',
    helperText: '支持美化和压缩 JavaScript。'
  });

  assert.match(html, /美化/);
  assert.match(html, /压缩/);
  assert.match(html, /data-format-mode/);
});

test('createToolDetailMarkup renders cleanup mode choices for css/js clear', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_css_js_clear',
    kind: 'server_dev_tool',
    label: 'CSS/JS 清除',
    helperText: '清除 HTML 里的样式和脚本痕迹。'
  });

  assert.match(html, /同时清除/);
  assert.match(html, /只清除 CSS/);
  assert.match(html, /只清除 JS/);
  assert.match(html, /data-cleanup-mode/);
});

test('createToolDetailMarkup renders no-input browser fingerprint tool controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_browser_fingerprint_check',
    kind: 'local_dev_tool',
    label: '浏览器指纹检测',
    helperText: '检测当前浏览器和设备的指纹信息。'
  });

  assert.match(html, /点击开始处理后读取当前浏览器环境信息/);
  assert.doesNotMatch(html, /data-source-text/);
});

test('createToolDetailMarkup renders no-input multi-source ip tool controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_multi_source_ip_check',
    kind: 'local_dev_tool',
    label: '多源 IP 检测',
    helperText: '通过多个公网回显源检测当前设备出口 IP。'
  });

  assert.match(html, /多个公网回显源/);
  assert.doesNotMatch(html, /data-source-text/);
});

test('createToolDetailMarkup renders nslookup target field and dns helper text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_nslookup_query',
    kind: 'backend_dev_tool',
    label: 'Nslookup 查询',
    helperText: '查询域名常见 DNS 记录。'
  });

  assert.match(html, /目标地址/);
  assert.match(html, /data-target-url/);
});

test('createToolDetailMarkup renders batch-request options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_batch_request',
    kind: 'server_dev_tool',
    label: '批量请求',
    helperText: '对同一个 URL 连续发起多次请求。'
  });

  assert.match(html, /目标地址/);
  assert.match(html, /请求次数/);
  assert.match(html, /请求间隔/);
  assert.match(html, /data-request-count/);
  assert.match(html, /data-request-interval-ms/);
});

test('createToolDetailMarkup renders api-batch-request options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_api_batch_request',
    kind: 'server_dev_tool',
    label: 'API 批量请求',
    helperText: '对多个 API 复用同一组参数。'
  });

  assert.match(html, /API 列表/);
  assert.match(html, /公共参数/);
  assert.match(html, /data-api-query-params/);
});

test('createToolDetailMarkup renders dead-link check as url-list input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_dead_link_check',
    kind: 'server_dev_tool',
    label: '死链检测',
    helperText: '批量检测 URL 列表的可访问状态。'
  });

  assert.match(html, /URL 列表/);
  assert.match(html, /data-source-text/);
});

test('createToolDetailMarkup renders icp single-query target field', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_icp_query',
    kind: 'server_dev_tool',
    label: 'ICP备案查询',
    helperText: '根据域名查询备案号、主办单位和主体性质。'
  });

  assert.match(html, /目标地址/);
  assert.match(html, /data-target-url/);
});

test('createToolDetailMarkup renders icp batch-query textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_icp_batch_query',
    kind: 'server_dev_tool',
    label: 'ICP备案批量查询',
    helperText: '按行批量查询多个域名的备案信息。'
  });

  assert.match(html, /域名列表/);
  assert.match(html, /data-source-text/);
});

test('createToolDetailMarkup renders icp reverse-query textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_icp_reverse_query',
    kind: 'server_dev_tool',
    label: 'ICP备案反查',
    helperText: '根据备案主体名称反查已备案域名。'
  });

  assert.match(html, /备案主体/);
  assert.match(html, /data-source-text/);
});

test('createToolDetailMarkup renders json-missing-find compare textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_json_missing_find',
    kind: 'local_dev_tool',
    label: 'json缺失项查找',
    helperText: '对比两个 JSON 并找出右侧缺失的字段。'
  });

  assert.match(html, /对比 JSON/);
  assert.match(html, /data-compare-json-text/);
});

test('createToolDetailMarkup renders json-clear-values mode choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_json_clear_values',
    kind: 'local_dev_tool',
    label: 'json键值清空',
    helperText: '保留结构，仅清空值。'
  });

  assert.match(html, /清空方式/);
  assert.match(html, /空字符串/);
  assert.match(html, /null/);
  assert.match(html, /data-json-clear-mode/);
});

test('createToolDetailMarkup renders json-slice size input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_json_slice',
    kind: 'local_dev_tool',
    label: 'json切割',
    helperText: '按固定数量切分 JSON 数组。'
  });

  assert.match(html, /每组数量/);
  assert.match(html, /data-json-slice-size/);
});

test('createToolDetailMarkup renders url-set-params extra textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_url_params_set',
    kind: 'local_dev_tool',
    label: 'get参数批量设置',
    helperText: '批量为 URL 添加或覆盖指定参数。'
  });

  assert.match(html, /参数列表/);
  assert.match(html, /data-url-set-params/);
});

test('createToolDetailMarkup renders meta-generator fields without a source textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_web_meta_generate',
    kind: 'local_dev_tool',
    label: '网页meta标签生成',
    helperText: '根据标题、描述、关键词生成 meta 标签。'
  });

  assert.match(html, /页面标题/);
  assert.match(html, /data-meta-title/);
  assert.match(html, /data-meta-description/);
  assert.match(html, /data-meta-keywords/);
});

test('createToolDetailMarkup renders no-input ipv6 support check tool', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_ipv6_check',
    kind: 'local_dev_tool',
    label: 'ipv6地址检测',
    helperText: '检测当前网络是否可直接访问 IPv6。'
  });

  assert.match(html, /点击开始处理后检测当前网络是否支持 IPv6/);
  assert.doesNotMatch(html, /data-source-text/);
});

test('createToolDetailMarkup renders domain-to-ip batch textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_domain_to_ip_batch',
    kind: 'server_dev_tool',
    label: '域名批量反查ip',
    helperText: '批量查询域名对应的 IP 地址。'
  });

  assert.match(html, /域名列表/);
  assert.match(html, /data-source-text/);
});

test('createToolDetailMarkup renders whois-batch textarea', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_whois_batch',
    kind: 'server_dev_tool',
    label: 'whois批量查询',
    helperText: '批量查询多个域名的 whois 核心字段。'
  });

  assert.match(html, /域名列表/);
  assert.match(html, /data-source-text/);
});

test('createToolDetailMarkup renders text-list-to-js-object mode choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_text_list_to_js_object',
    kind: 'local_dev_tool',
    label: '文本列表转js对象',
    helperText: '将文本列表转换成js对象变量的代码'
  });

  assert.match(html, /对象模式/);
  assert.match(html, /data-js-object-mode/);
});

test('createToolDetailMarkup renders js-data-import export-name input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_js_data_import',
    kind: 'local_dev_tool',
    label: 'JS数据导入',
    helperText: '免费在线将文本或文件导入为JS变量。'
  });

  assert.match(html, /变量名/);
  assert.match(html, /data-js-import-name/);
});

test('createToolDetailMarkup renders cookie-import options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_cookie_import_code',
    kind: 'local_dev_tool',
    label: 'Cookie导入',
    helperText: '免费在线生成Cookie导入代码或书签。'
  });

  assert.match(html, /Cookie Domain/);
  assert.match(html, /data-cookie-domain/);
  assert.match(html, /data-cookie-path/);
});

test('createToolDetailMarkup renders html-inline-style-remove option', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_html_inline_style_remove',
    kind: 'local_dev_tool',
    label: 'html代码行内样式删除',
    helperText: '删除html代码中的指定行内样式'
  });

  assert.match(html, /样式名/);
  assert.match(html, /data-inline-style-names/);
});

test('createToolDetailMarkup renders frontend-i18n helper text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_frontend_i18n_convert',
    kind: 'local_dev_tool',
    label: '前端多语言i18n处理',
    helperText: '免费在线处理前端i18n多语言配置与Excel转换。'
  });

  assert.match(html, /首列为 key/);
  assert.match(html, /语言列/);
});

test('createToolDetailMarkup renders generate-count controls for ip and color generators', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const ipHtml = createToolDetailMarkup({
    key: 'dev_ip_generate',
    kind: 'local_dev_tool',
    label: 'ip地址生成',
    helperText: '免费在线随机生成指定数量的IPv4地址。'
  });
  const colorHtml = createToolDetailMarkup({
    key: 'dev_random_color_generate',
    kind: 'local_dev_tool',
    label: '随机颜色生成',
    helperText: '免费在线批量生成随机十六进制颜色代码。'
  });

  assert.match(ipHtml, /生成数量/);
  assert.match(ipHtml, /data-generate-count/);
  assert.match(colorHtml, /data-generate-count/);
});

test('createToolDetailMarkup renders mac separator options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_mac_generate',
    kind: 'local_dev_tool',
    label: 'mac地址生成',
    helperText: '免费在线随机生成MAC物理地址。'
  });

  assert.match(html, /分隔符/);
  assert.match(html, /data-mac-separator/);
});

test('createToolDetailMarkup renders external uu iframe tools directly', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_ckeditor5',
    kind: 'local_dev_tool',
    label: 'ckeditor5富文本编辑器',
    helperText: '免费在线CKEditor5富文本编辑器，体验新一代Web编辑器功能。'
  });

  assert.match(html, /https:\/\/uutool\.cn\/ckeditor5\//);
  assert.match(html, /data-remote-tool-frame/);
  assert.doesNotMatch(html, /开始处理/);
});

test('createToolDetailMarkup renders keyword input for page keyword density analysis', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'dev_keyword_density_check',
    kind: 'backend_dev_tool',
    label: '网页关键词密度检测',
    helperText: '检测页面中指定关键词的出现次数和密度。'
  });

  assert.match(html, /关键词/);
  assert.match(html, /data-keyword-text/);
  assert.match(html, /目标地址/);
});

test('createToolDetailMarkup renders an extraction text tool with input and output areas', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'text_extract_urls',
    kind: 'local_text',
    label: '链接提取',
    helperText: '从文本中批量提取网址链接。'
  });

  assert.match(html, /原始文本/);
  assert.match(html, /处理结果/);
  assert.match(html, /开始处理/);
  assert.doesNotMatch(html, /type="file"/);
});

test('createToolDetailMarkup renders a list-helper text tool with custom option inputs', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'list_add_prefix_suffix',
    kind: 'local_text',
    label: '列表前后缀添加',
    helperText: '给每一行文本统一添加前缀和后缀。'
  });

  assert.match(html, /前缀/);
  assert.match(html, /后缀/);
  assert.match(html, /开始处理/);
});

test('createToolDetailMarkup renders a regex extraction tool with pattern input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'text_regex_extract',
    kind: 'local_text',
    label: '正则提取',
    helperText: '使用正则表达式从文本中批量提取匹配内容。'
  });

  assert.match(html, /正则表达式/);
  assert.match(html, /开始处理/);
});

test('createToolDetailMarkup renders a banned-word check tool with word list input', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'text_banned_words_check',
    kind: 'local_text',
    label: '通用违禁词检测',
    helperText: '检测文本中是否包含指定违禁词。'
  });

  assert.match(html, /违禁词词库/);
  assert.match(html, /处理结果/);
});

test('createToolDetailMarkup renders merge_pdf as a multi-file PDF upload form', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'merge_pdf',
    label: 'PDF 合并',
    helperText: '可一次上传多个 PDF，按当前顺序合并为一个 PDF。',
    accepts: '.pdf',
    maxFileSizeMb: 20,
    maxTotalFileSizeMb: 60
  });

  assert.match(html, /PDF 合并/);
  assert.match(html, /multiple/);
  assert.match(html, /开始转换/);
});

test('createToolDetailMarkup renders compress_pdf with compression-level choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'compress_pdf',
    label: 'PDF 压缩',
    helperText: '可选标准压缩或强力压缩，并显示压缩前后体积对比。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /标准压缩/);
  assert.match(html, /强力压缩/);
  assert.match(html, /压缩强度/);
});

test('createToolDetailMarkup renders pdf_to_word with OCR mode choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'pdf_to_word',
    label: 'PDF 转 Word',
    helperText: '支持文本型 PDF 直接转 Word，也支持 OCR 识别扫描件后导出 Word。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /转换方式/);
  assert.match(html, /文本型 PDF/);
  assert.match(html, /扫描件 OCR/);
  assert.match(html, /识别语言/);
  assert.match(html, /中文 \+ 英文/);
});

test('createToolDetailMarkup renders watermark_pdf with text and image watermark controls', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'watermark_pdf',
    label: 'PDF 加水印',
    helperText: '支持整份 PDF 添加文字水印或图片水印。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /文字水印/);
  assert.match(html, /图片水印/);
  assert.match(html, /平铺斜铺/);
  assert.match(html, /单个居中/);
  assert.match(html, /居中/);
  assert.match(html, /左下/);
  assert.match(html, /右下/);
  assert.match(html, /watermarkImage/);
});

test('createToolDetailMarkup renders add_page_numbers_pdf options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'add_page_numbers_pdf',
    label: 'PDF 加页码',
    helperText: '支持整份 PDF 统一添加页码。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /页脚居中/);
  assert.match(html, /右下角/);
  assert.match(html, /起始页码/);
  assert.match(html, /第 1 页/);
});

test('createToolDetailMarkup renders sign_stamp_pdf options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'sign_stamp_pdf',
    label: 'PDF 签名 / 盖章',
    helperText: '支持上传签名图片或手写签名后整份统一盖章。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /上传签名\/印章图片/);
  assert.match(html, /手写签名/);
  assert.match(html, /左下/);
  assert.match(html, /右下/);
  assert.match(html, /签名图片/);
});

test('createToolDetailMarkup renders batch_sign_stamp_pdf as a multi-file stamp form', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'batch_sign_stamp_pdf',
    label: '批量 PDF 盖章',
    helperText: '可一次上传多个 PDF，按同一套盖章配置逐个处理后打包下载。',
    accepts: '.pdf',
    maxFileSizeMb: 50,
    maxTotalFileSizeMb: 300,
    allowMultipleFiles: true
  });

  assert.match(html, /上传签名\/印章图片/);
  assert.match(html, /手写签名/);
  assert.match(html, /签名图片/);
  assert.match(html, /multiple/);
  assert.match(html, /已选择的文件会在这里列出|按当前顺序/);
});

test('createToolDetailMarkup renders rotate_pdf options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'rotate_pdf',
    label: 'PDF 旋转页面',
    helperText: '支持整份 PDF 统一旋转 90°、180°、270°。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /90°/);
  assert.match(html, /180°/);
  assert.match(html, /270°/);
});

test('createToolDetailMarkup renders excel_to_pdf as a simple single-file upload form', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'excel_to_pdf',
    label: 'Excel 转 PDF',
    helperText: '支持 Excel 表格转 PDF，复杂分页按实际导出结果为准。',
    accepts: '.xlsx,.xls',
    maxFileSizeMb: 20
  });

  assert.match(html, /\.xlsx/);
  assert.match(html, /\.xls/);
  assert.match(html, /开始转换/);
});

test('createToolDetailMarkup renders ppt_to_pdf as a simple single-file upload form', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'ppt_to_pdf',
    label: 'PPT 转 PDF',
    helperText: '支持 PPT 演示文稿转 PDF，动画和切换效果不保留。',
    accepts: '.ppt,.pptx',
    maxFileSizeMb: 30
  });

  assert.match(html, /\.ppt/);
  assert.match(html, /\.pptx/);
  assert.match(html, /开始转换/);
});

test('createToolDetailMarkup renders pdf_to_pptx as a simple single-file upload form', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'pdf_to_pptx',
    label: 'PDF 转 PPT',
    helperText: '适合把常见 PDF 内容快速整理成可修改 PPT，复杂排版可能会有偏差。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /\.pdf/);
  assert.match(html, /复杂排版可能会有偏差/);
  assert.match(html, /开始转换/);
});

test('createToolDetailMarkup renders image_heic_convert as a HEIC upload form with JPG and PNG choices', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'image_heic_convert',
    label: 'HEIC 转 JPG / PNG',
    helperText: '上传 iPhone 常见 HEIC 图片后转成 JPG 或 PNG 下载。',
    accepts: '.heic,.heif',
    maxFileSizeMb: 20
  });

  assert.match(html, /\.heic/);
  assert.match(html, /\.heif/);
  assert.match(html, /JPG/);
  assert.match(html, /PNG/);
});

test('createToolDetailMarkup renders delete_pages_pdf options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'delete_pages_pdf',
    label: '删除 PDF 页面',
    helperText: '支持页码输入和缩略图选择删除页面。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /删除页码/);
  assert.match(html, /缩略图/);
});

test('createToolDetailMarkup renders reorder_pages_pdf options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'reorder_pages_pdf',
    label: '调整 PDF 页面顺序',
    helperText: '支持页码输入和缩略图拖拽调整页面顺序。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /新的页顺序/);
  assert.match(html, /缩略图/);
  assert.match(html, /上移/);
  assert.match(html, /下移/);
});

test('createToolDetailMarkup renders protect_unlock_pdf options', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'toolCatalogMarkup.mjs')
  ).href;
  const { createToolDetailMarkup } = await import(moduleUrl);

  const html = createToolDetailMarkup({
    key: 'protect_unlock_pdf',
    label: '保护 PDF / 解锁 PDF',
    helperText: '支持设置打开密码，或输入已有密码后解锁 PDF。',
    accepts: '.pdf',
    maxFileSizeMb: 30
  });

  assert.match(html, /保护 PDF/);
  assert.match(html, /解锁 PDF/);
  assert.match(html, /确认密码/);
  assert.match(html, /原密码/);
});
