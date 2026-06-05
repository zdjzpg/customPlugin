const imageConversionCatalog = [
  {
    key: 'image_compress_batch',
    label: '图片批量压缩',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    maxTotalFileSizeMb: 60,
    allowMultipleFiles: true,
    helperText: '支持 JPG、PNG、WebP 多图批量压缩后打包下载。'
  },
  {
    key: 'image_resize_exact',
    label: '图片宽高修改',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '按指定宽度和高度输出新图片，可强制拉伸。'
  },
  {
    key: 'image_resize_scale',
    label: '图片尺寸修改',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '按百分比放大或缩小图片尺寸。'
  },
  {
    key: 'image_crop_free',
    label: '图片裁剪',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '按左上角坐标和宽高自由裁剪图片。'
  },
  {
    key: 'image_crop_ratio',
    label: '图片固定比例裁剪',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '按常用比例从中心裁出图片。'
  },
  {
    key: 'image_crop_ratio_batch',
    label: '图片固定比例批量裁剪',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    maxTotalFileSizeMb: 60,
    allowMultipleFiles: true,
    helperText: '多图按同一比例批量裁剪并打包下载。'
  },
  {
    key: 'image_split_grid',
    label: '图片平均切割',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '按行列平均切成多张小图并打包下载。'
  },
  {
    key: 'image_nine_grid',
    label: '九宫格切图',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '把一张图片快速切成 3x3 九宫格小图并打包下载。'
  },
  {
    key: 'image_concat_long',
    label: '图片拼长图',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    maxTotalFileSizeMb: 60,
    allowMultipleFiles: true,
    helperText: '多张图片按横向或纵向拼成长图。'
  },
  {
    key: 'image_collage',
    label: '多图合并拼图',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    maxTotalFileSizeMb: 60,
    allowMultipleFiles: true,
    helperText: '多图按网格排版合并为一张拼图。'
  },
  {
    key: 'image_fill_background',
    label: 'PNG 加背景',
    categoryKey: 'image_tools',
    accepts: '.png,.webp',
    maxFileSizeMb: 15,
    helperText: '给透明图片补纯色背景，适合导出 JPG 或白底图。'
  },
  {
    key: 'image_dark_mode_background',
    label: '暗黑模式适配',
    categoryKey: 'image_tools',
    accepts: '.png,.webp',
    maxFileSizeMb: 15,
    helperText: '给透明背景图片补白底，减少深色模式下发灰问题。'
  },
  {
    key: 'image_watermark_tile',
    label: '图片水印平铺',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '支持整张图片平铺文字水印。'
  },
  {
    key: 'image_grayscale',
    label: '图片去色',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '一键把彩色图片转成黑白灰度图。'
  },
  {
    key: 'image_invert',
    label: '图片反相',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '生成负片风格的颜色反相图像。'
  },
  {
    key: 'image_printmaking',
    label: '黑白版画',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '把图片压成纯黑白两色的版画效果。'
  },
  {
    key: 'image_emboss',
    label: '浮雕画制作',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '生成带浮雕纹理的图像效果。'
  },
  {
    key: 'image_remove_solid_bg',
    label: '单色抠图',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg',
    maxFileSizeMb: 15,
    helperText: '按角落底色和容差快速去掉单色背景。'
  },
  {
    key: 'image_smart_bg_remove',
    label: '智能抠图 / 去背景',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '自动识别边缘背景并输出透明 PNG，适合常见主体去背景。'
  },
  {
    key: 'favicon_generate',
    label: 'favicon 制作',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 10,
    helperText: '把图片快速转换成 ICO 网站图标。'
  },
  {
    key: 'app_icon_generate',
    label: '多尺寸图标生成',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 10,
    helperText: '一键导出常用 App 图标和 favicon 尺寸包。'
  },
  {
    key: 'chrome_icon_generate',
    label: 'chrome 插件图标生成',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 10,
    helperText: '批量导出 Chrome 插件常用 icon 尺寸。'
  },
  {
    key: 'image_add_padding',
    label: '图片留白',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '给图片四周增加透明或纯色留白边距。'
  },
  {
    key: 'image_pixelate',
    label: '图片像素化马赛克',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '按块大小把图片处理成像素化效果。'
  },
  {
    key: 'image_increase_size',
    label: '增加图像体积',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '在不改尺寸的前提下，把图片文件体积补到指定大小。'
  },
  {
    key: 'image_clear_content',
    label: '图像内容清除',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '清空图像内容，输出同尺寸纯色或透明图。'
  },
  {
    key: 'image_heic_convert',
    label: 'HEIC 转 JPG / PNG',
    categoryKey: 'image_tools',
    accepts: '.heic,.heif',
    maxFileSizeMb: 20,
    helperText: '上传 iPhone 常见 HEIC / HEIF 图片后转成 JPG 或 PNG 下载。'
  },
  {
    key: 'image_format_convert',
    label: '图片格式转换',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    maxTotalFileSizeMb: 60,
    allowMultipleFiles: true,
    helperText: '支持 PNG、JPG、WebP 互转，批量时自动打包下载。'
  },
  {
    key: 'excel_extract_images',
    label: 'excel 图片提取',
    categoryKey: 'image_tools',
    accepts: '.xlsx,.xlsm',
    maxFileSizeMb: 30,
    helperText: '从 Excel 文件中提取内嵌图片并打包下载。'
  },
  {
    key: 'ppt_extract_images',
    label: 'PPT 图片提取',
    categoryKey: 'image_tools',
    accepts: '.pptx',
    maxFileSizeMb: 30,
    helperText: '从 PPT 文件中提取内嵌图片并打包下载。'
  },
  {
    key: 'image_modify_dpi',
    label: '图片 300dpi 修改',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '不改像素尺寸，仅修改导出图片的 DPI 元数据。'
  },
  {
    key: 'gif_split',
    label: 'GIF 拆分',
    categoryKey: 'image_tools',
    accepts: '.gif',
    maxFileSizeMb: 20,
    helperText: '把 GIF 动图逐帧拆成 PNG 并打包下载。'
  },
  {
    key: 'gif_merge',
    label: 'GIF 合成',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    maxTotalFileSizeMb: 60,
    allowMultipleFiles: true,
    helperText: '多张静态图片按顺序合成为 GIF 动图。'
  },
  {
    key: 'png_alpha_invert',
    label: 'png 反向抠图',
    categoryKey: 'image_tools',
    accepts: '.png',
    maxFileSizeMb: 15,
    helperText: '反转 PNG 的透明与非透明区域。'
  },
  {
    key: 'image_round_corner',
    label: '圆角图片制作',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '把图片处理成圆角或圆形样式。'
  },
  {
    key: 'image_tile_fill',
    label: '图片平铺填充',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '把小图重复平铺成指定尺寸的大图。'
  },
  {
    key: 'id_photo_resize',
    label: '证件照改大小',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg',
    maxFileSizeMb: 10,
    helperText: '按常用证件照尺寸输出，并可控制目标文件大小。'
  },
  {
    key: 'exam_id_photo_process',
    label: '报名证件照处理',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg',
    maxFileSizeMb: 10,
    helperText: '按报名证件照常见规格裁切并压缩图片。'
  },
  {
    key: 'id_photo_crop',
    label: '证件照剪切',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg',
    maxFileSizeMb: 10,
    helperText: '按一寸、二寸等常用比例快速裁切。'
  },
  {
    key: 'id_photo_bg_swap',
    label: '证件照换底色',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg',
    maxFileSizeMb: 10,
    helperText: '把证件照底色替换成红、白、蓝等常用背景。'
  },
  {
    key: 'anti_ocr_image',
    label: '防识别图像转换',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '给图片增加轻度扰动，降低一键 OCR 提取概率。'
  },
  {
    key: 'payment_code_merge',
    label: '收款码合并',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    maxTotalFileSizeMb: 30,
    allowMultipleFiles: true,
    helperText: '把微信、支付宝等收款码合并成一张图，方便统一发给买家。'
  },
  {
    key: 'qr_generate',
    label: '二维码生成',
    categoryKey: 'image_tools',
    requiresUpload: false,
    helperText: '输入内容后直接生成二维码图片。'
  },
  {
    key: 'qr_generate_batch',
    label: '批量二维码',
    categoryKey: 'image_tools',
    requiresUpload: false,
    helperText: '每行一条内容，批量生成二维码并打包下载。'
  },
  {
    key: 'qr_decode',
    label: '二维码解码',
    categoryKey: 'image_tools',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 15,
    helperText: '上传二维码图片后解析出原始文本内容。'
  }
];

module.exports = {
  imageConversionCatalog
};
