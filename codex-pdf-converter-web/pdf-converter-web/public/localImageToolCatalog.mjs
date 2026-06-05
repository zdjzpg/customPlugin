export const localImageToolCatalog = [
  {
    key: 'image_add_text',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片加文字',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '本地加载图片后添加主标题、副标题和角标，实时预览并导出 JPG / PNG。'
  },
  {
    key: 'image_add_border_frame',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片加边框 / 描边',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '给图片补边框、圆角、阴影和安全边距，适合主图和封面图。'
  },
  {
    key: 'image_platform_cover_template',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '平台封面尺寸模板',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '按闲鱼、小红书、公众号和 PPT 等常用模板快速导出封面图。'
  },
  {
    key: 'image_annotate_canvas',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片标注 / 箭头框选',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '本地加载图片后点击画布添加箭头、框选、序号和局部马赛克。'
  },
  {
    key: 'image_social_cover_pad',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片加边框 / 社媒封面留白',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '本地生成纯色或模糊背景留白图，适合社媒封面和内容配图。'
  },
  {
    key: 'image_privacy_redact',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片隐私打码',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '本地点击图片快速给敏感区域打码，适合聊天截图和订单页。'
  },
  {
    key: 'image_blur_background_fill',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片模糊背景填充',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '按目标比例生成模糊背景画布，适合横竖图适配和社媒配图。'
  },
  {
    key: 'image_flip_mirror',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片翻转 / 镜像',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '快速做水平镜像、垂直翻转或双向翻转，适合商品图和头像调整。'
  },
  {
    key: 'image_metadata_view_clear',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片元数据查看 / 清除',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '查看图片基本信息，并可重新导出以清理大部分附带元数据。'
  },
  {
    key: 'image_blur_redact',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片局部模糊 / 打码',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '点击图片快速添加模糊或马赛克区域，适合订单截图和聊天记录。'
  },
  {
    key: 'image_rotate_adjust',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '图片旋转校正',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '按角度快速旋转图片，支持 90°、180°、270° 和轻微校正。'
  },
  {
    key: 'image_object_erase_light',
    kind: 'local_image_tool',
    categoryKey: 'image_tools',
    label: '对象移除 / 涂抹消除',
    accepts: '.png,.jpg,.jpeg,.webp',
    maxFileSizeMb: 20,
    helperText: '轻量版局部涂抹消除，适合先快速遮掉小杂物或干扰元素。'
  }
];

export function getLocalImageToolByKey(toolKey) {
  return localImageToolCatalog.find((item) => item.key === toolKey) || null;
}
