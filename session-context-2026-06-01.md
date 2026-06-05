# Session Context - 2026-06-01

## User Profile

- Current role: frontend developer, about 5 years experience
- Recently started using AI to help with .NET backend work
- Current salary: 15000 RMB/month
- Work mode: remote/home office
- Education: bachelor's degree, Jimei University, graduated in 2021
- Current self-assessment: closer to a core developer than a pure execution role

## Career Goals Discussed

- Primary career goal: salary growth over the next 6 months
- Priority choice: salary first, not remote-first
- Preferred city: Xiamen
- Salary target: 25k+ RMB/month
- Available time outside work: 15+ hours/week

## Career Positioning Agreed

- Do not keep positioning as "pure frontend"
- Better positioning:
  - full-stack business engineer
  - backend-capable frontend engineer
  - AI-enabled business application engineer
- Strongest current experience area:
  - complex mid/back-office systems
  - ticketing/sales/reporting style business systems

## Side Business Discussion

The user asked to explore side-income options not limited to programmer freelancing.

### Directions discussed

- AI office-efficiency coaching / workflow setup
- template or digital-product sales
- Xianyu small tools
- non-programmer-tag side business options

### User preference

- Not tied to scenic-spot/tourism domain
- Interested in Xianyu-sellable small tools

## Product Direction Chosen

The user chose to start from a small tool idea:

- category: PDF/Word/image processing
- later narrowed to a web product instead of a desktop installer
- server is already available

### Product shape currently chosen

- lightweight web app
- access controlled by redemption code / card code
- not public free usage
- purchase flow:
  1. user buys on Xianyu
  2. seller sends redemption code
  3. user opens webpage and enters code
  4. user uploads file
  5. server converts file
  6. user downloads result

### First planned feature set

- Word to PDF
- PDF to images
- images to PDF

### Recommended implementation direction already discussed

- Node.js monolith
- frontend + backend + file processing in one app
- likely stack:
  - Vue frontend
  - Node.js/Express backend
  - LibreOffice headless for Word to PDF
  - PDF/image conversion libraries or local tools

## Workspace / Technical Context

An isolated git worktree was created to avoid mixing with existing uncommitted changes in the main repository.

- Original repo: `D:\aa-workplace\EnglishQuestion`
- New worktree: `D:\aa-workplace\customPlugin\codex-pdf-converter-web`
- Branch created: `codex/pdf-converter-web`

## Important Environment Notes

- System default Node.js version is `v14.15.3`
- Existing repo tests depend on `node --test`, so baseline verification failed under Node 14
- Bundled runtime is available and usable:
  - Node: `C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
  - Version verified: `v24.14.0`

This means the new tool should be developed and tested with the bundled Node 24 runtime instead of the system default Node 14 runtime.

## Current Status

The independent project has now been built inside:

- `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web`

### Current product status

The first sellable version is already implemented and deployed.

Supported flows:

- Word to PDF
- PDF to images
- images to PDF

Current product rules:

- buyers log in with redemption codes
- admin has a separate backend
- usage-based and duration-based codes are both supported
- admin can create codes
- admin can enable / disable codes
- conversion records are stored

### Current implementation shape

- Node.js monolith
- Express backend
- simple static frontend pages
- SQLite metadata storage
- `LibreOffice` for server-side Word to PDF
- `pdf2image + poppler` for PDF to images
- `reportlab + Pillow` for images to PDF

### Important implementation decisions already made

- upload pipeline was changed from `base64 JSON` to `multipart/form-data`
  - reason: large files were causing request bloat and unstable behavior
- PDF to images no longer exposes page-by-page downloads to buyers
  - current behavior: generate images, then provide a single ZIP download
- buyer-facing pages were cleaned up to avoid showing:
  - backend/internal wording
  - feature status labels
  - session-expiry / operational metadata
- result cards were redesigned so generated files are visually obvious

### Key pitfalls already discovered and resolved

1. **Node version mismatch**
- local system `node` was too old
- development and testing were done with bundled Node 24
- production server also had to be upgraded to Node 24

2. **Environment variables not loaded automatically**
- server initially fell back to hardcoded Windows default paths on Linux
- project now auto-loads `.env` at startup

3. **Large upload issues**
- `413 Payload Too Large` occurred with the old JSON/base64 pipeline
- fixed by moving to `multipart/form-data`
- frontend now also does pre-upload size checks

4. **PDF to images memory issue on low-memory server**
- `pdf2image` originally loaded too much into memory
- server is low-spec (`2C2G` class machine, ~1.6GiB memory visible in runtime check)
- conversion was changed to a lower-memory, file-based flow

5. **Word to PDF Chinese rendering issue**
- local conversion was fine, server output showed Chinese as squares / garbled glyphs
- root cause: server missing Chinese fonts
- fixed by installing:
  - `fonts-noto-cjk`
  - `fonts-wqy-zenhei`
  - `fonts-wqy-microhei`

6. **Multipart filename encoding issue**
- Chinese filenames were initially mangled during upload parsing
- fixed by decoding multipart filenames before conversion logic

### Local deployment / run notes

- local bundled Node runtime:
  - `C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- local project entry:
  - `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\index.cjs`

### Online deployment status

The new tool now coexists with the old project instead of replacing it.

Old project:

- directory: `/home/admin/EnglishQuestion`
- PM2 process: `english-question`

New tool:

- directory: `/home/admin/pdf-converter-web`
- PM2 process: `pdf-converter-web`
- port: `3015`
- public URL: `https://pdf.seedling.top/`
- Nginx config: `/etc/nginx/conf.d/pdf-converter-web.conf`

Certificate path currently used:

- `/home/admin/certs/pdf.seedling.top/pdf.seedling.top.key`
- `/home/admin/certs/pdf.seedling.top/pdf.seedling.top_bundle.pem`

### Updated recommended next step

The base product is already online, so the next step is no longer scaffolding.

Recommended next feature:

1. Add `PDF 提取页面 / 拆分 PDF`
2. Keep scope narrow and aligned with current users
3. Reuse the existing upload / conversion / download pipeline
4. Keep buyer-facing copy simple and user-task-oriented

### Release / workflow reminder

For this project, future sessions should first read:

- `D:\aa-workplace\customPlugin\codex-pdf-converter-web\agent.md`

That file now contains:

- coexistence deployment rules with the old project
- PM2 / Nginx / certificate conventions
- frontend buyer-copy constraints
- known operational pitfalls

## 2026-06-01 Latest Progress Update

### New buyer-facing features completed

The previously recommended next feature has now been implemented.

New supported flows:

- PDF extract pages
- split PDF

Behavior details:

- `PDF extract pages`
  - accepts page text like `1,3,5-8`
  - preserves user input order
  - outputs one new PDF
- `split PDF`
  - accepts one output range per line, for example:
    - `1-3`
    - `4-6`
    - `7,9-10`
  - outputs multiple PDFs packaged into one ZIP

### Frontend interaction change

The buyer dashboard was simplified again to reduce clutter.

Current buyer flow:

1. login with redemption code
2. see only method cards on the homepage
3. each card shows:
   - method name
   - short introduction
   - `查看详情`
4. click into the chosen method detail page
5. only on the detail page:
   - upload file
   - fill page ranges if needed
   - start conversion
   - download result

Current layout rules:

- homepage method cards are desktop `3 columns`
- medium width falls back to `2 columns`
- mobile falls back to `1 column`
- overall left/right page padding was reduced from the earlier version

### Backend / runtime additions

New code paths were added for:

- `pdf_extract_pages`
- `split_pdf`

Implementation notes:

- server parses page selections before conversion
- Python side uses `pypdf`
- existing multipart upload / progress / download pipeline is reused

### New local verification completed

The new flows were verified both by automated tests and by real browser interaction.

Automated verification:

- full test suite passed with bundled Node 24
- count at completion time: `49/49`

Browser verification performed locally:

- buyer login
- homepage overview card layout
- click from overview into detail page
- `PDF extract pages` upload + convert + download
- `split PDF` upload + convert + ZIP download
- downloaded outputs were inspected and page order/content matched expectations

Important local note discovered during testing:

- local port `3015` had once been occupied by an old Node process
- this caused the browser to hit an outdated version of the app
- if local UI seems inconsistent with current code, first check whether `3015` is already occupied

### Current local buyer test credential note

- `DEMO-USES-5` may already be exhausted in local SQLite data
- prefer using `DEMO-DAYS-7` for local buyer testing unless codes are reset

### Server update note for this round

This round is not just frontend.

It requires:

- frontend file upload
- backend upload / conversion logic
- Python runtime dependency update

Current server-side extra dependency required by the new features:

- `pypdf`

Recommended server command after upload:

```bash
cd /home/admin/pdf-converter-web
sudo python3 -m pip install pypdf
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
```

Post-update verification should additionally confirm:

- `/api/conversions/catalog` contains:
  - `pdf_extract_pages`
  - `split_pdf`
- homepage shows overview cards instead of direct upload forms
- desktop homepage shows three cards per row
- both new PDF flows work end-to-end online

## 2026-06-03 Latest Progress Update

### More buyer-facing PDF tools completed

The product now also supports:

- PDF to Word
- delete PDF pages
- reorder PDF pages
- protect/unlock PDF
- PDF merge
- PDF compress
- PDF watermark
- PDF page numbers
- PDF sign / stamp
- PDF rotate pages

Behavior details:

- `PDF to Word`
  - `no_ocr` mode for text PDFs
  - `ocr` mode for scanned/image PDFs
  - OCR language options:
    - `chi_sim+eng`
    - `chi_sim`
    - `eng`
- `PDF merge`
  - upload multiple PDFs
  - reorder before merge
  - outputs one merged PDF
- `delete PDF pages`
  - supports page-range input
  - supports thumbnail selection
  - outputs one new PDF
- `reorder PDF pages`
  - supports page-order input
  - supports thumbnail reorder
  - supports up/down controls
  - outputs one new PDF
- `protect/unlock PDF`
  - one tool with two modes:
    - protect
    - unlock
  - protect uses:
    - password
    - confirm password
  - unlock uses:
    - original password
- `PDF compress`
  - `标准压缩`
  - `强力压缩`
  - result shows size comparison
- `PDF watermark`
  - text watermark
  - image watermark
  - whole-document unified config
- `PDF page numbers`
  - whole-document unified numbering
  - footer center / bottom-right
  - start page number
  - `1` / `第 1 页`
- `PDF sign / stamp`
  - uploaded image
  - drawn signature
  - center / bottom-left / bottom-right
- `PDF rotate pages`
  - whole-document rotation
  - `90° / 180° / 270°`

### Buyer UI update

Buyer UI is no longer only a responsive resize of one layout.

Current device-specific behavior:

- desktop:
  - current overview + detail style remains
- mobile:
  - dedicated single-column large-card toolbox
  - full-screen detail page feel
  - dedicated `返回工具列表`
  - no large homepage hero inside detail page

### Current public-facing copy direction

Current preferred buyer-facing title direction:

- `PDF 处理工具丨转 Word / 合并 / 拆分 / 压缩 / 加水印`

Current preferred subtitle direction:

- `常用文件处理一站完成，网页打开即用`

Current first-screen copy should be maintained in sync with actual buyer-facing features.

Latest Xianyu-facing copy candidate:

- title:
  - `PDF / Office 文件处理工具丨转 Word / 合并 / 压缩 / 加水印 / 页码 / 签章`
- subtitle:
  - `常用文件处理一站完成，网页打开即用`
- first-screen copy:
  - `这是一个专门做 PDF / Word / Excel / PPT 文件处理的在线工具。`
  - `不需要安装复杂软件，打开网页即可使用，适合日常办公、资料整理、教学文件处理。`

At the current stage, public copy should mention:

- `PDF 转 Word`
- `Word 转 PDF`
- `Excel 转 PDF`
- `PPT 转 PDF`
- `PDF 合并`
- `PDF 拆分`
- `PDF 提取页面`
- `PDF 删除页面`
- `PDF 调整页面顺序`
- `PDF 压缩`
- `PDF 加水印`
- `PDF 加页码`
- `PDF 签名/盖章`
- `PDF 旋转页面`
- `PDF 转图片`
- `图片转 PDF`
- `PDF 保护 / 解锁`

### 2026-06-04 Latest Xianyu Copy Update

Current latest recommended Xianyu-facing copy is now:

- title:
  - `PDF / Office 文件处理工具丨转 Word / 转 PPT / 合并 / 压缩 / 加水印 / 页码 / 签章`
- subtitle:
  - `常用文件处理一站完成，网页打开即用`
- first-screen copy:
  - `这是一个专门做 PDF / Word / Excel / PPT 文件处理的在线工具。`
  - `不需要安装复杂软件，打开网页即可使用，适合日常办公、资料整理、教学文件处理。`

Current recommended selling-point copy:

- `支持 PDF 转 Word、PDF 转 PPT、Word 转 PDF、Excel 转 PDF、PPT 转 PDF。`
- `也支持 PDF 合并、拆分、提取页面、删除页面、调整顺序、压缩、加水印、加页码、签名盖章、旋转页面、保护/解锁。`
- `常见文件处理集中在一个网页里完成，省去安装和找软件的麻烦。`

Current recommended short detail-page description:

- `适合日常办公和资料整理。`
- `文本类 PDF 可转成可继续修改的 Word / PPT；复杂排版文件会有少量偏差，扫描件可继续配合 OCR 处理。`

Current recommended short Xianyu listing body:

- `在线 PDF / Office 文件处理工具，网页打开即用。`
- `支持 PDF 转 Word、PDF 转 PPT、Word/Excel/PPT 转 PDF。`
- `支持 PDF 合并、拆分、提取页面、删除页面、调整顺序、压缩、加水印、加页码、签名/盖章、旋转页面、保护/解锁。`
- `适合办公文档、教学资料、日常文件整理。`

### Additional runtime notes

Current newer runtime pieces already used by later features include:

- `pdf2docx`
- `ocrmypdf`
- `ghostscript`
- `tesseract-ocr`
- `tesseract-ocr-chi-sim`
- `tesseract-ocr-eng`

### Current local verification status

By now, the local browser self-tests have covered:

- delete PDF pages
- reorder PDF pages
- protect/unlock PDF
- PDF extract pages
- split PDF
- PDF merge
- PDF compress
- PDF to Word
- PDF watermark
- PDF page numbers
- PDF sign / stamp
- PDF rotate pages
- mobile buyer UI

### Current admin stats rule

The admin statistics panel now exists inside the current admin backend.

Current rule:

- one count is recorded only when buyer clicks `开始转换`
- opening detail pages does not count
- stats are grouped by day
- stats show Chinese feature names in admin UI
- filters support:
  - today
  - yesterday
  - last 7 days
  - last 30 days
  - custom date range

## 2026-06-03 PDF to PPTX Follow-up

### New buyer-facing feature completed

The product now also supports:

- PDF to PPTX

Behavior details:

- `PDF to PPTX`
  - pure open-source implementation
  - `1 page PDF = 1 PPT slide`
  - text PDFs:
    - extract text blocks into editable text boxes when possible
    - extract page images when possible
  - scanned PDFs:
    - if `ocrmypdf` is configured, run OCR first and then generate PPTX
    - if OCR is unavailable or a page cannot be reconstructed cleanly, the page can fall back to a full-page screenshot inside the slide
  - current product promise:
    - editable content is preferred
    - complex layout fidelity is not guaranteed

### Implementation direction chosen

The previously considered commercial-library route was rejected.

Current implementation uses:

- `PyMuPDF`
- `python-pptx`
- existing `ocrmypdf` pipeline when available

### Current public-facing copy note

Current buyer-facing helper text for this tool is aligned to the actual capability boundary:

- `适合把常见 PDF 内容快速整理成可修改 PPT，复杂排版可能会有偏差。`

Do not market this feature as high-fidelity layout restoration at the current stage.

### Additional runtime notes

Current newer runtime pieces now also include:

- `pymupdf`
- `python-pptx`

### Current local verification status

Additional local verification was completed after implementation:

- full Node test suite passed
  - count at completion time: `103/103`
- real browser self-test was run locally against a temporary local port `3025`

Real browser self-test results:

- buyer login worked
- `PDF 转 PPT` detail page opened correctly
- text PDF:
  - upload + convert + download passed end-to-end
  - downloaded PPTX was inspected
  - slide count and extracted text matched expectations
- scanned PDF:
  - upload + convert + download passed end-to-end
  - downloaded PPTX contained a slide image fallback

Important local limitation discovered during this round:

- the local environment did not have:
  - `OCRMYPDF_BIN`
  - reachable `ocrmypdf` command
- because of that, the real browser self-test did **not** verify scanned-PDF editable text reconstruction
- the scanned-PDF browser result verified the current fallback path, not real OCR output quality

### Server update note for this round

This round is also a mixed change.

It requires:

- backend conversion logic
- Python runtime dependency update
- buyer tool catalog exposure
- admin label mapping update

Current server-side extra dependencies required by the new feature:

- `pymupdf`
- `python-pptx`

Recommended server command after upload:

```bash
cd /home/admin/pdf-converter-web
sudo python3 -m pip install pymupdf python-pptx
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
```

Post-update verification should additionally confirm:

- `/api/conversions/catalog` contains:
  - `pdf_to_pptx`
- buyer homepage shows the `PDF 转 PPT` tool card
- text-PDF to PPTX works end-to-end online
- if OCR is configured online, scanned-PDF to PPTX should additionally be checked with a real scan sample

## 2026-06-04 Text Tools And Homepage Productization Update

### New buyer-facing category and feature line completed

The product now also supports:

- 文本工具

Current completed text-tool batches are now:

1. 高频文本处理
- 文本去重
- 删除空行
- 删除所有空格
- 批量替换
- 字符数统计
- 英文大小写转换

2. 提取与筛选
- 链接提取
- 邮箱提取
- 手机号提取
- 域名提取
- IP 提取
- 数字提取

3. 列表与表格辅助
- 文本转列表
- 列表转文本
- 列表排序
- 列表随机打乱
- 列表重复统计
- 列表前后缀添加
- 列表截取左边字符
- 列表截取右边字符

4. 高级与长尾
- 正则提取
- Unicode 编解码
- 金额大写转换
- 中英文符号转换
- 通用违禁词检测
- UUID 生成

### Buyer homepage productization completed

The following bullets describe the state of the product at that round, before the later `编程工具` line and later buyer list cleanup were completed.

The buyer homepage is no longer only a single file-tool listing.

At that stage, the buyer homepage included:

- homepage category cards:
  - `PPT 工具`
  - `文本工具`
- full-site search across both categories
- grouped text-tool presentation inside `文本工具`

At that stage, the text-tool grouped sections were:

- `高频文本处理`
- `提取与筛选`
- `列表与表格辅助`
- `高级与长尾`

Current buyer-facing brand in the product UI is now:

- `PP 工具站`

Current homepage short description direction is now:

- `文件处理与文本处理一站完成`

### Local verification status at that round

Additional local verification was completed after the text-tool line and homepage organization were added:

- full Node test suite passed
  - count at completion time: `144/144`

Real browser self-tests additionally covered:

- homepage category cards for:
  - `PPT 工具`
  - `文本工具`
- full-site search across both categories
- `文本去重`
  - input / output
  - detail-page refresh persistence
- `链接提取`
  - input / output
- `列表排序`
  - input / output
- `正则提取`
  - input / output

### Server update note for this round

This round is mainly buyer-side frontend productization plus local text-tool runtime.

It requires:

- buyer UI update
- new local text-tool modules
- category exposure update
- search behavior update

Current update classification for this round:

- mostly `frontend only`

Recommended server command after upload:

```bash
cd /home/admin/pdf-converter-web
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
```

Post-update verification should additionally confirm:

- buyer homepage shows:
  - `PPT 工具`
  - `文本工具`
- buyer search can find text tools across categories
- `文本工具` category shows grouped sections
- at least these text tools work online:
  - `文本去重`
  - `链接提取`
  - `列表排序`
  - `正则提取`

## 2026-06-04 编程工具与列表样式更新

### 新买家端类目已完成

产品现在已经新增第三个一级类目：

- `编程工具`

当前 buyer 首页类目现状：

- `PPT 工具`
- `文本工具`
- `编程工具`

当前搜索现状：

- 全站搜索同时覆盖以上三个类目

### 当前已完成的编程工具批次

当前已完成并接入 buyer 端的编程工具，覆盖本地前端工具、轻后端抓取工具、网络检测工具。

#### 本地前端工具

- Base64 加解密
- 中文转 Unicode
- Unicode 还原
- 半角转全角
- 全角转半角
- 文本转十进制 Unicode
- URL 编解码
- Basic Auth 凭证计算
- md5 加密
- md5 批量加密
- 字符串哈希/散列
- 时间戳转换
- Crontab 解析
- 任意进制转换
- 文本转进制
- 进制转文本
- HTML 转 JS 字符串
- HTML 标签去除
- 回车转 BR 标签
- SVG 转 DataURI
- HTML 实体编解码
- HTTP 头转 JSON
- Cookie 转 JSON
- JSON 格式化
- 列表转 JSON
- JSON 转列表
- JSON 字段提取
- JSON 字符串值转数值
- JSON 数值转字符串
- UUID 生成器
- 浏览器 UA 查询
- 设备屏幕参数检测
- URL 转 sitemap
- Robots 生成
- HTML 预览

#### 轻后端抓取工具

- sitemap 链接提取
- 网页链接提取
- 网页 meta 信息检测
- 网页 TDK 信息检测
- 网页关键词密度检测
- 网页蜘蛛模拟抓取
- SSL 证书解析

#### 网络检测工具

- 网站 SSL 证书检测
- SSL 证书过期查询
- 网页 gzip 压缩检测
- 网页 brotli 压缩检测
- URL 重定向分析
- 域名 whois 查询
- 网站 CDN 检测

### 当前 buyer 列表页规则已变更

当前列表页规则不再沿用之前的文本工具分组方式。

当前规则：

- `文本工具` 不再显示：
  - `高频文本处理`
  - `提取与筛选`
  - `列表与表格辅助`
  - `高级与长尾`
- `文本工具` 与 `编程工具` 一样直接平铺工具卡
- 正文区域不再重复渲染首页类目卡
- 左侧菜单顶部的 `工具分类` 文案已移除

### 当前工具卡视觉与交互规则

当前 buyer 工具卡已更新为更接近 `uutool` 的风格：

- 每张卡有浅色渐变背景
- 不同卡片按 tone 使用不同淡彩色板
- 标题与 badge 现在在同一行：
  - 标题靠左
  - badge 靠右
- 卡片高度已压缩并统一
- 标题限制为两行
- 描述限制为两行
- 卡片底部重复的小标签已删除
- `查看详情` 按钮已删除
- 当前规则改为：
  - 整张卡片可点击进入详情页
  - 键盘 `Enter` / 空格也可打开详情页

### 当前类目图标规则

当前 buyer 端一级类目图标已不再使用首字母占位。

当前规则：

- `PPT 工具`
- `文本工具`
- `编程工具`

都已经改成 SVG 图标显示。

### 当前自动化与真实页面验证状态

本轮新增编程工具与 buyer UI 调整后，自动化与真实页面自测都已继续补齐。

当前全量自动化状态：

- Node 全量测试通过
- latest count at completion time:
  - `221/221`

当前真实页面自测已覆盖：

- 编程工具首页卡片进入详情
- Base64 加解密
- 网站 SSL 证书检测
- JSON 字段提取
- 文本去重
- 移动端类目进入与文本工具回归
- md5 加密
- URL 转 sitemap
- Robots 生成
- 浏览器 UA 查询
- 设备屏幕参数检测
- SSL 证书过期查询
- Basic Auth 凭证计算
- HTML 预览
- SSL 证书解析
- 域名 whois 查询
- 网站 CDN 检测
- 网页 meta 信息检测
- 网页关键词密度检测
- 当前工具卡整卡点击效果
- 当前卡片高度与 title/badge 排版效果

### 当前未完成范围

当前 `https://uutool.cn/type/code/` 还没有做到完全搬完。

仍未完成或未确认完成的方向包括：

- `ICP备案查询`
- `ICP备案批量查询`
- `ICP备案反查`
- `Nslookup 查询`
- `SSL 证书链下载`
- `批量请求`
- `API 批量请求`
- `死链检测`
- `多节点 IP 检测`
- `IP 地址获取主机名`
- `浏览器指纹检测`
- `PHP password_hash`
- `JSON 转 CSV`
- `JSON 转 PHP`
- `JS 对象转 JSON`
- `JSON 转 JS 对象`
- `JSON 合并`
- `JSON 键值对提取`
- `RSA 密钥对生成`
- `JS 美化压缩`
- `CSS 美化压缩`
- `HTML 美化压缩`
- `CSS/JS 清除`
- 其它依赖更重数据源或更重运行时的长尾工具

### 当前推荐下一步

如果继续搬运 `uutool` 编程页，当前最自然的下一步是：

1. 做 `ICP备案查询 / 批量查询 / 备案反查`
2. 做 `Nslookup / IP反查主机名 / 死链检测`
3. 做 `JSON/CSV/PHP/JS 对象互转` 与 `RSA / 代码美化压缩`

## 2026-06-04 图像工具类目与浏览器回归更新

### 新买家端类目已完成

产品现在已经新增第四个一级类目：

- `图像工具`

当前 buyer 首页类目现状：

- `PPT 工具`
- `文本工具`
- `编程工具`
- `图像工具`

当前搜索现状：

- 全站搜索同时覆盖以上四个类目

### 当前已完成并接入 buyer 端的图像工具

当前已完成并接入 buyer 端的图像工具包括：

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

### 当前 buyer 端图像工具接入规则

当前规则：

- 图像工具复用现有 `/api/conversions/catalog`
- 图像工具复用现有 `/api/conversions/run`
- 图像工具通过 `categoryKey = image_tools` 接入买家端
- 类目内工具卡直接平铺，不做二级分组

### 当前未进 buyer 端 UI 的图像页条目

这类工具本轮没有显示在买家端，只记录在设计 / 待办文档中：

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
- 二维码生成 / 批量二维码 / 解码 / 提取
- 条形码生成
- svg 预览与 svg 转 png/jpg/webp/base64
- heic 图片预览
- 其它需要外站抓取、额外渲染依赖或独立交互设计的长尾图像工具

当前登记文档：

- `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\docs\superpowers\specs\2026-06-04-image-tools-program-design.md`

### 当前首页文案更新

当前 homepage hero copy 已同步调整为：

- `文件、图像与文本处理一站完成`

### 当前自动化与真实页面验证状态

图像工具接入后，自动化与真实页面自测都已继续补齐。

当前全量自动化状态：

- Node 全量测试通过
- latest count at completion time:
  - `338/338`

当前真实页面自测已覆盖：

- buyer 登录
- 首页 `图像工具` 一级类目显示
- 进入 `图像工具` 列表
- 搜索命中 `图片宽高修改`
- `图片宽高修改`
  - 上传 PNG
  - 转成 `320 x 180`
  - 下载结果校验
- `图片格式转换`
  - PNG 转 JPG
  - 下载结果校验
- `GIF 合成`
  - 两张 PNG 合成 GIF
  - 下载结果校验为 `2 帧`
- `图片批量压缩`
  - 两张图片压缩
  - 下载 ZIP
  - ZIP 内容校验
- `favicon 制作`
  - 透明 PNG 转 ICO
  - 下载结果校验

### 当前本地浏览器测试证据目录

当前浏览器回归临时目录在：

- `D:\temp\codex-image-tools-browser-20260604`

其中包含：

- `downloads`
- `screenshots`

### Server update note for this round

This round is a mixed change.

It requires:

- buyer frontend category / detail UI update
- backend catalog exposure update
- Python conversion command update

Current update classification for this round:

- `mixed change`

Current server-side dependency note for this round:

- no new Node dependency was added in this round
- no new Python third-party package was added in this round
- default assumption:
  - server already has the existing project dependency `Pillow`

Recommended server command after upload:

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
curl http://127.0.0.1:3015/api/conversions/catalog
```

Post-update verification should additionally confirm:

- buyer left nav shows:
  - `图像工具`
- `/api/conversions/catalog` contains multiple entries with:
  - `categoryKey = image_tools`
- buyer search can find:
  - `图片宽高修改`
  - `图片格式转换`
  - `GIF 合成`
  - `favicon 制作`
- at least these image tools work online:
  - `图片宽高修改`
  - `图片格式转换`
  - `GIF 合成`
  - `图片批量压缩`
  - `favicon 制作`

## 2026-06-04 音视频工具类目与浏览器回归更新

### 新买家端类目已完成

产品现在已经新增第五个一级类目：

- `音视频工具`

当前 buyer 首页类目现状：

- `PPT 工具`
- `文本工具`
- `编程工具`
- `图像工具`
- `音视频工具`

当前搜索现状：

- 全站搜索同时覆盖以上五个类目

### 当前已完成并接入 buyer 端的音视频工具

当前已完成并接入 buyer 端的音视频工具包括：

- 文字转语音
- 音频剪切
- 音频合并
- 音频试听播放
- 视频加速播放
- 特定频率音频生成
- 白噪音生成器

### 当前 buyer 端音视频工具接入规则

当前规则：

- 音视频工具不复用 `/api/conversions/catalog`
- 当前接入分成两类：
  - 本地浏览器工具
  - `/api/media-tools/run` 后端工具
- 当前后端工具包括：
  - `文字转语音`
  - `音频剪切`
  - `音频合并`
- 当前本地浏览器工具包括：
  - `音频试听播放`
  - `视频加速播放`
  - `特定频率音频生成`
  - `白噪音生成器`
- 音视频工具通过独立类目 `media_tools` 接入买家端
- 类目内工具卡直接平铺，不做二级分组
- 每个 `media_*` 工具键都必须显式配置：
  - UU 风格图标
  - UU 风格淡彩卡片背景
- 不允许让音视频卡片落回默认：
  - `fa-wrench`
  - `style6`

### 当前音视频工具首版能力边界

- `文字转语音`
  - 当前首版仅支持：
    - `中文普通话`
    - `英文`
  - 当前输出格式：
    - `mp3`
    - `wav`
- `音频剪切`
  - 当前支持上传单个音频文件
  - 按开始时间 / 结束时间截取
  - 当前输出格式：
    - `mp3`
    - `wav`
- `音频合并`
  - 当前支持多文件上传
  - 按当前页面顺序合并
  - 当前输出格式：
    - `mp3`
    - `wav`
- `音频试听播放`
  - 当前为本地浏览器加载
  - 生成简易波形并直接试听
- `视频加速播放`
  - 当前为本地浏览器加载
  - 支持直接设置播放速度预览
- `特定频率音频生成`
  - 当前为本地浏览器生成 WAV
- `白噪音生成器`
  - 当前为本地浏览器生成 WAV

### 当前自动化与真实页面验证状态

音视频工具接入后，自动化与真实页面自测都已继续补齐。

当前全量自动化状态：

- Node 全量测试通过
- latest count at completion time:
  - `338/338`

当前真实页面自测已覆盖：

- buyer 登录
- 首页 `音视频工具` 一级类目显示
- 进入 `音视频工具` 列表
- `文字转语音`
  - 提交成功
  - 结果卡出现
  - 下载 `text-to-speech.mp3`
- `音频剪切`
  - 上传 `tone-a.mp3`
  - 按 `00:01.000` 到 `00:03.500` 截取
  - 结果卡出现
- `音频合并`
  - 两段音频上传并按顺序合并
  - 结果卡出现
- `音频试听播放`
  - 本地加载 `preview.wav`
  - 波形显示
  - 音频可直接试听
- `视频加速播放`
  - 本地加载 `preview.mp4`
  - `2x` 播放速度生效
- `特定频率音频生成`
  - 生成本地 WAV
  - 试听与下载按钮出现
- `白噪音生成器`
  - 生成本地 WAV
  - 试听与下载按钮出现

### 当前本地浏览器测试证据目录

当前浏览器回归临时目录在：

- `D:\temp\media-tools-browser-test-20260604`

其中包含：

- `downloads`
- `screenshots`

关键截图包括：

- `media_category.png`
- `text_to_speech.png`
- `audio_clip.png`
- `audio_merge.png`
- `tts-check-3015.png`

### Server update note for this round

This round is a mixed change.

It requires:

- buyer frontend category / detail UI update
- backend media route update
- Python runtime dependency update
- system dependency update

Current update classification for this round:

- `mixed change`

Current server-side dependency note for this round:

- no new Node dependency was added in this round
- new Python third-party package required:
  - `edge-tts`
- new system dependency required:
  - `ffmpeg`

Recommended server command after upload:

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
sudo apt update
sudo apt install -y ffmpeg
sudo python3 -m pip install edge-tts
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
```

If the server also needs the broader newer PDF runtime set, the combined command can still be:

```bash
cd /home/admin/pdf-converter-web
sudo apt update
sudo apt install -y ffmpeg ghostscript tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-eng
sudo python3 -m pip install pypdf pdf2docx pymupdf python-pptx ocrmypdf edge-tts
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
```

Post-update verification should additionally confirm:

- buyer left nav shows:
  - `音视频工具`
- buyer can enter `音视频工具` list
- buyer search can find:
  - `文字转语音`
  - `音频剪切`
  - `音频合并`
- `文字转语音` works online
- `音频剪切` works online
- `音频合并` works online
- local browser tools still render correctly online:
  - `音频试听播放`
  - `视频加速播放`
  - `特定频率音频生成`
  - `白噪音生成器`
- media cards do not fall back to:
  - default wrench icon
  - default gray card palette

### Combined server update note for this release

- `编程工具`
- `图像工具`
- `音视频工具`

Recommended combined server command:

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
sudo apt update
sudo apt install -y ffmpeg
sudo python3 -m pip install edge-tts
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
curl http://127.0.0.1:3015/api/conversions/catalog
```

Dependency note:

- `编程工具`：本轮不需要额外依赖
- `图像工具`：本轮不新增依赖，默认服务器已有 `Pillow`
- `音视频工具`：需要 `edge-tts` 和 `ffmpeg`

If the server also lacks the newer PDF runtime set, use:

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
sudo apt update
sudo apt install -y ffmpeg ghostscript tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-eng
sudo python3 -m pip install pypdf pdf2docx pymupdf python-pptx ocrmypdf edge-tts
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
curl http://127.0.0.1:3015/api/conversions/catalog
```

Minimum online checks:

- 左侧类目有 `编程工具 / 图像工具 / 音视频工具`
- 搜索能找到 `Base64 加解密 / 图片宽高修改 / 文字转语音`
- 线上抽测通过：
  - `网站 SSL 证书检测`
  - `图片格式转换`
  - `GIF 合成`
  - `文字转语音`
  - `音频剪切`
  - `音频合并`
