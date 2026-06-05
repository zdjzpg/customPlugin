# 图像工具程序设计与待办

## 本轮目标

- 新增买家端一级类目 `图像工具`
- 列表页规则与 `编程工具` 一致，直接平铺工具卡
- 图像工具复用现有 `/api/conversions/catalog` 和 `/api/conversions/run` 管线
- 不额外暴露“未开放”占位卡

## 本轮已接入买家端的图像工具

- 图片批量压缩
- 图片宽高修改
- 图片尺寸修改
- 图片裁剪
- 图片固定比例裁剪
- 图片固定比例批量裁剪
- 图片平均切割
- 图片拼长图
- 多图合并拼图
- PNG 加背景
- 暗黑模式适配
- 图片水印平铺
- 图片去色
- 图片反相
- 黑白版画
- 浮雕画制作
- 单色抠图
- favicon 制作
- 多尺寸图标生成
- chrome 插件图标生成
- 图片留白
- 图片像素化马赛克
- 增加图像体积
- 图像内容清除
- 图片格式转换
- excel 图片提取
- PPT 图片提取
- 图片 300dpi 修改
- GIF 拆分
- GIF 合成
- png 反向抠图
- 圆角图片制作
- 图片平铺填充
- 证件照改大小
- 报名证件照处理
- 证件照剪切
- 证件照换底色
- 防识别图像转换

## 当前明确不进买家端 UI 的图像页条目

这些条目本轮不展示在买家端；等后续补齐依赖或稳定实现后再单独接入。

### 外部抓取 / 站点依赖型

- 网站图标读取下载
- 图片下载
- 图像链接批量下载
- 图片列表显示
- QQ 头像获取
- QQ 头像墙
- 公众号二维码获取
- 百度百科图片去水印
- 网页截屏 pdf 转换
- 微信公众号文章 pdf 制作

### 额外渲染 / 编码栈依赖型

- 二维码生成
- 批量二维码
- 二维码解码
- 二维码提取
- WiFi 二维码生成
- 二维码去 Logo
- 二维码修复
- 条形码生成
- svg 路径预览
- svg 图片预览
- svg 转 jpg
- svg 转 png
- svg 转 webp
- svg 转 base64
- heic 图片预览

### 需要单独交互设计或专门算法的长尾项

- 颜色预览
- 图片具体坐标颜色拾取
- 图片坐标
- 图片拾色器
- 图片编辑器
- GIF 编辑
- 日历生成
- 短视频封面分割
- 推文海报生成
- 彩色文字图片
- 文字 LOGO 生成
- 邮箱地址图片
- 心形拼图
- png 图片查看
- 纯色图片生成

## 当前实现边界

- 图像工具优先覆盖 `Pillow + Office zip 提取 + 现有下载链路` 能稳定支撑的能力
- 输出仍走现有 conversion 下载卡片，不单做图像专用结果页
- 当前未新增新的第三方二维码 / SVG 渲染依赖
- 当前未接入外站抓取类图像工具

## 当前上线更新说明

### 当前更新分类

- `mixed change`

原因：

- buyer 前端新增了 `图像工具` 一级类目与详情表单
- backend catalog 新增了 `image_tools` 条目
- Python conversion 脚本新增了图像处理命令

### 当前线上依赖变化

本轮默认前提：

- 线上环境已经具备当前项目原本就在使用的 `Pillow`

当前这轮图像工具接入没有新增：

- 新的 Node.js 依赖
- 新的 Python 第三方包
- 新的系统级 apt 依赖

这意味着：

- 一般不需要为这轮单独执行新的 `pip install`
- 如果线上之前连 `Pillow` 都没有，则应先补齐当前项目既有 Python 依赖

### 推荐服务器更新命令

如果只是把本轮代码上传到现有 `/home/admin/pdf-converter-web`，当前推荐命令是：

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
curl http://127.0.0.1:3015/api/conversions/catalog
```

说明：

- 因为本轮没有新增 Node 依赖，严格来说通常可以跳过 `npm install`
- 但如果服务器代码包不确定是否与 `package-lock.json` 完全同步，仍可按标准流程执行一次

### 上线后至少要核对的内容

- `/api/conversions/catalog` 中出现 `categoryKey = image_tools` 的图像工具条目
- buyer 首页左侧类目出现 `图像工具`
- buyer 搜索可以搜到：
  - `图片宽高修改`
  - `图片格式转换`
  - `GIF 合成`
  - `favicon 制作`
- 至少以下真实链路在线可用：
  - `图片宽高修改`
  - `图片格式转换`
  - `GIF 合成`
  - `图片批量压缩`
  - `favicon 制作`

### 如果线上回归失败，优先排查

1. 3015 是否仍是旧进程，实际运行代码不是当前版本
2. `/api/conversions/catalog` 是否还没出现 `image_tools`
3. 服务器 Python 环境里是否缺当前项目既有的 `Pillow`
4. 上传后的 `scripts/run_conversion.py` 是否确实是本轮新版本
5. 前端静态资源是否仍被旧缓存命中

## 下一轮建议顺序

1. 二维码 / 条形码整批接入
2. SVG 预览与 SVG 转位图整批接入
3. 站点抓取类图像工具单独做服务端超时、限流和错误文案
