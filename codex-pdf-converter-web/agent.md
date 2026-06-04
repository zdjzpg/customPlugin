# PDF Converter Web Agent Context

## Core Rule

If you are a later session or a new handoff, default to this rule first:

> Only handle the one current problem the user explicitly asked for. Do not switch early to the next todo before the current issue is closed.

An issue counts as closed only when one of these is true:

- code is finished
- relevant verification has been run
- the current symptom is gone

or:

- it is clearly explained why work cannot continue yet
- the user confirmed the pause or switch

## Product Identity

This repository is **not** the old `EnglishQuestion` project.

This is the independent sellable web tool:

- project name: `pdf-converter-web`
- local repo root:
  - `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web`
- online directory:
  - `/home/admin/pdf-converter-web`
- PM2 process:
  - `pdf-converter-web`
- port:
  - `3015`
- public URL:
  - `https://pdf.seedling.top/`

Strong constraints:

- do not deploy this tool into `/home/admin/EnglishQuestion`
- do not reuse PM2 process `english-question`
- do not treat this repo like the kids English system

## Current Feature Set

Current buyer-facing features:

- Word to PDF
- Excel to PDF
- PPT to PDF
- PDF to PPTX
- PDF to Word
- 文本工具
- Delete PDF pages
- Reorder PDF pages
- Protect/Unlock PDF
- PDF to images
- images to PDF
- PDF merge
- PDF compress
- PDF watermark
- PDF page numbers
- PDF sign / stamp
- PDF rotate pages
- PDF extract pages
- split PDF
- 编程工具

Current behavior:

- buyer logs in with redemption code
- admin has separate login and code management
- upload pipeline uses `multipart/form-data`
- conversion records are stored in SQLite
- feature usage stats are stored in SQLite

Detailed rules for the current PDF toolset:

### Excel to PDF

- supports:
  - `.xlsx`
  - `.xls`
- uses LibreOffice headless
- outputs one PDF
- complex pagination / print-area behavior follows actual LibreOffice output

### PPT to PDF

- supports:
  - `.pptx`
  - `.ppt`
- uses LibreOffice headless
- outputs one PDF
- animation / transition effects are not preserved

### PDF to Word

- supports two modes:
  - `no_ocr`
  - `ocr`
- `no_ocr` is for text PDFs
- `ocr` is for scanned/image PDFs
- OCR mode supports language choices:
  - `chi_sim+eng`
  - `chi_sim`
  - `eng`
- output is one `.docx`

### PDF to PPTX

- accepts one PDF
- outputs one `.pptx`
- fixed rule:
  - `1 page PDF = 1 PPT slide`
- current product target:
  - editable content preferred over layout fidelity
- text PDFs:
  - try to extract text blocks into editable text boxes
  - try to extract images into separate picture elements
- scanned PDFs:
  - if `ocrmypdf` is configured, run OCR first
  - if OCR is unavailable or a page cannot be reconstructed well, the page may fall back to a full-page screenshot on that slide
- current limitation:
  - complex layout fidelity is not guaranteed
  - tables / multi-column / vector-heavy pages may drift

### 文本工具

- current text tools are local browser tools
- they do not require file upload or backend conversion
- current buyer list page no longer shows subgroup section headers
- current presentation is flat tool cards directly inside `文本工具`

Current completed text-tool items include:

- 文本去重
- 删除空行
- 删除所有空格
- 批量替换
- 字符数统计
- 英文大小写转换
- 链接提取
- 邮箱提取
- 手机号提取
- 域名提取
- IP 提取
- 数字提取
- 文本转列表
- 列表转文本
- 列表排序
- 列表随机打乱
- 列表重复统计
- 列表前后缀添加
- 列表截取左边字符
- 列表截取右边字符
- 正则提取
- Unicode 编解码
- 金额大写转换
- 中英文符号转换
- 通用违禁词检测
- UUID 生成

### 编程工具

- current `编程工具` tools are now a mixed line:
  - local browser tools
  - backend fetch/parse tools
  - backend network-check tools
- buyer-facing presentation rule:
  - do not subgroup inside `编程工具`
  - show flat tool cards directly

Current completed local dev-tool items include:

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

Current completed backend parse dev-tool items include:

- sitemap 链接提取
- 网页链接提取
- 网页 meta 信息检测
- 网页 TDK 信息检测
- 网页关键词密度检测
- 网页蜘蛛模拟抓取
- SSL 证书解析

Current completed network-check dev-tool items include:

- 网站 SSL 证书检测
- SSL 证书过期查询
- 网页 gzip 压缩检测
- 网页 brotli 压缩检测
- URL 重定向分析
- 域名 whois 查询
- 网站 CDN 检测

### Delete PDF pages

- accepts one PDF
- supports:
  - page-range text input
  - thumbnail page selection
- outputs one new PDF with selected pages removed

### Reorder PDF pages

- accepts one PDF
- supports:
  - page-order text input
  - thumbnail reorder interactions
  - up/down controls
- outputs one new reordered PDF

### Protect / Unlock PDF

- one tool with two modes:
  - `protect`
  - `unlock`
- protect mode:
  - open password
  - confirm password
- unlock mode:
  - existing password input
- outputs one new PDF

### PDF merge

- accepts multiple PDFs
- merges them in the current user-visible order
- buyer can move files up/down before starting
- outputs one merged PDF

### PDF compress

- supports:
  - `标准压缩`
  - `强力压缩`
- outputs one compressed PDF
- result UI shows:
  - original size
  - compressed size
  - reduced size

### PDF watermark

- current scope is whole-document unified watermark config
- supports:
  - text watermark
  - image watermark
- text watermark supports:
  - tiled diagonal layout
  - single centered layout
- image watermark supports:
  - `PNG`
  - `JPG`
  - fixed positions:
    - center
    - bottom-left
    - bottom-right
- current adjustable fields:
  - text content
  - font size
  - opacity
  - rotation
  - image scale

### PDF page numbers

- whole-document unified page numbering
- positions:
  - footer center
  - bottom-right
- supports:
  - start page number
  - plain format like `1`
  - Chinese format like `第 1 页`

### PDF sign / stamp

- whole-document unified sign/stamp placement
- supports:
  - uploaded sign/stamp image
  - drawn signature in browser
- fixed positions:
  - center
  - bottom-left
  - bottom-right
- adjustable:
  - scale
  - opacity

### PDF rotate pages

- whole-document unified rotation
- angles:
  - `90°`
  - `180°`
  - `270°`

### PDF extract pages

- accepts page text like:
  - `1,3,5-8`
- preserves user input order
- outputs one PDF

### split PDF

- accepts one output range per line, for example:
  - `1-3`
  - `4-6`
  - `7,9-10`
- outputs multiple PDFs packaged into one ZIP

## Current Buyer UI Rules

Buyer-facing copy must stay user-task-oriented.

Do not expose on buyer pages:

- LibreOffice
- poppler
- Python runtime
- server dependency names
- admin/backend wording
- development status wording
- placeholder wording
- session expiry metadata
- internal module names
- any “please install dependency first” style copy

Current homepage interaction is:

1. buyer logs in with code
2. homepage shows only method cards
3. each card shows:
   - method name
   - short intro
   - top-right badge
4. user clicks the whole card into the method detail page
5. only on detail page:
  - upload file
  - fill parameters
  - start conversion
  - download result

Current latest buyer list-page simplification rules:

- the left-side nav is the primary category switcher
- do not repeat another category-card block inside the main list area
- do not repeat another subgroup heading block inside `文本工具`

Current detail-page interaction rules:

- once a tool detail page is opened:
  - the big homepage hero section is hidden
  - the dashboard title/copy block above the list is hidden
  - only the current tool detail panel remains visible
- detail page must show a clear:
  - `返回列表`
  button
- some page-level tools now expose thumbnail interactions directly inside the detail page:
  - delete pages
  - reorder pages

Current layout rules:

- homepage overview cards:
  - desktop: 3 columns
  - medium width: 2 columns
  - mobile: 1 column
- page side padding was intentionally reduced from the earlier version
- tool cards now use light multi-tone gradients instead of one flat background
- tool-card title and badge now stay on one line:
  - title on the left
  - badge on the right
- tool-card descriptions are intentionally clamped for more even card heights
- tool cards no longer show a separate `查看详情` button
- the whole card opens the detail page

### Current device-specific UI rule

- desktop and mobile no longer use exactly the same buyer UI
- desktop keeps the current tool-desk style
- mobile uses a separate buyer UI:
  - single-column large-card toolbox
  - full-screen detail flow
  - dedicated `返回工具列表`
  - no desktop-style hero/tool summary inside the mobile detail page

### Current buyer-facing copy direction

The current preferred marketing tone is:

- not cheap/noisy
- not "tool list spam"
- more like a polished, practical PDF product
- should feel professional enough that buyers want to click in

Current preferred headline direction:

- title style:
  - `PDF 处理工具丨转 Word / 合并 / 拆分 / 压缩 / 加水印`
- subtitle style:
  - `常用文件处理一站完成，网页打开即用`

Current latest Xianyu-facing title candidate:

- `PDF / Office 文件处理工具丨转 Word / 合并 / 压缩 / 加水印 / 页码 / 签章`

Current latest Xianyu-facing subtitle candidate:

- `常用文件处理一站完成，网页打开即用`

Current latest Xianyu-facing first-screen copy direction:

- `这是一个专门做 PDF / Word / Excel / PPT 文件处理的在线工具。`
- `不需要安装复杂软件，打开网页即可使用，适合日常办公、资料整理、教学文件处理。`

Current latest Xianyu-facing supported-feature list should mention:

- `PDF 转 PPT`
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
- `PDF 签名 / 盖章`
- `PDF 旋转页面`
- `PDF 转图片`
- `图片转 PDF`
- `PDF 保护 / 解锁`

### Latest Xianyu Copy Update

Current latest recommended Xianyu-facing title is:

- `PDF / Office 文件处理工具丨转 Word / 转 PPT / 合并 / 压缩 / 加水印 / 页码 / 签章`

Current latest recommended Xianyu-facing subtitle is:

- `常用文件处理一站完成，网页打开即用`

Current latest recommended Xianyu-facing first-screen copy is:

- `这是一个专门做 PDF / Word / Excel / PPT 文件处理的在线工具。`
- `不需要安装复杂软件，打开网页即可使用，适合日常办公、资料整理、教学文件处理。`

Current latest recommended Xianyu-facing selling-point copy is:

- `支持 PDF 转 Word、PDF 转 PPT、Word 转 PDF、Excel 转 PDF、PPT 转 PDF。`
- `也支持 PDF 合并、拆分、提取页面、删除页面、调整顺序、压缩、加水印、加页码、签名盖章、旋转页面、保护/解锁。`
- `常见文件处理集中在一个网页里完成，省去安装和找软件的麻烦。`

Current latest recommended Xianyu-facing short detail copy is:

- `适合日常办公和资料整理。`
- `文本类 PDF 可转成可继续修改的 Word / PPT；复杂排版文件会有少量偏差，扫描件可继续配合 OCR 处理。`

Current latest recommended short Xianyu listing body is:

- `在线 PDF / Office 文件处理工具，网页打开即用。`
- `支持 PDF 转 Word、PDF 转 PPT、Word/Excel/PPT 转 PDF。`
- `支持 PDF 合并、拆分、提取页面、删除页面、调整顺序、压缩、加水印、加页码、签名/盖章、旋转页面、保护/解锁。`
- `适合办公文档、教学资料、日常文件整理。`

Current actual homepage short-copy direction in the product UI is now:

- hero title:
  - `PP 工具站`
- hero copy:
  - `文件处理与文本处理一站完成`

Maintenance rule:

- do not expand the homepage hero into a giant all-features sentence again unless the user explicitly asks for it
- keep the hero short, let the tool cards carry the feature detail

Current preferred first-screen description style:

- should describe this as:
  - an online tool focused on file processing and text tools
- should emphasize:
  - no complicated installation
  - open webpage and use directly
  - suitable for office work, document整理, teaching-material handling

Current supported-feature copy list should stay synchronized with actual product features.

At the time of writing, that public-facing feature list is expected to mention:

- `Excel 转 PDF`
- `PDF 转 PPT`
- `PPT 转 PDF`
- `PDF 转 Word`
- `Word 转 PDF`
- `文本去重`
- `链接提取`
- `列表排序`
- `正则提取`
- `PDF 合并`
- `PDF 拆分`
- `PDF 提取页面`
- `PDF 压缩`
- `PDF 加水印`
- `PDF 加页码`
- `PDF 签名/盖章`
- `PDF 旋转页面`
- `PDF 转图片`
- `图片转 PDF`

Important maintenance rule:

- whenever a new buyer-facing feature is added, check whether the homepage title, subtitle, and first-screen feature list should also be updated
- do not let the public marketing copy lag behind the actual toolset
- do not fall back to low-end "cheap utility" wording unless the user explicitly asks for that tone

## Current Buyer Homepage Structure

Current buyer homepage is no longer only a single file-tool listing.

It now includes:

- homepage category cards:
  - `PPT 工具`
  - `文本工具`
  - `编程工具`
- full-site search across all three categories
- flat text-tool presentation under `文本工具`
- flat dev-tool presentation under `编程工具`

## Technical Shape

Current implementation shape:

- Node.js monolith
- Express backend
- static frontend pages
- SQLite metadata
- Python helper script for file conversion

Important runtime pieces:

- Word to PDF:
  - LibreOffice when available
  - `.docx` fallback path when LibreOffice is unavailable
- Excel to PDF:
  - LibreOffice headless
- PPT to PDF:
  - LibreOffice headless
- PDF to Word:
  - `pdf2docx`
  - `ocrmypdf`
  - `tesseract-ocr`
- PDF to PPTX:
  - `PyMuPDF`
  - `python-pptx`
  - `ocrmypdf` when OCR fallback is available
- PDF to images:
  - `pdf2image`
  - poppler
- delete / reorder / protect-unlock PDF:
  - `pypdf`
- images to PDF:
  - `reportlab`
  - `Pillow`
- PDF compress:
  - `Ghostscript`
- PDF watermark:
  - `pypdf`
  - `Pillow`
  - `reportlab`
- PDF page numbers:
  - `pypdf`
  - `reportlab`
- PDF sign / stamp:
  - `pypdf`
  - `Pillow`
  - `reportlab`
- PDF rotate pages:
  - `pypdf`
- PDF extract pages / split PDF:
  - `pypdf`

Important implementation files:

- server entry:
  - `server/index.cjs`
- app wiring:
  - `server/bootstrap.cjs`
  - `server/app.cjs`
- conversion service:
  - `server/services/conversionService.cjs`
- page-range parsing:
  - `server/services/pageSelectionParser.cjs`
- buyer detail markup:
  - `public/toolCatalogMarkup.mjs`
- buyer file-order helper:
  - `public/fileSelectionOrder.mjs`
- Python conversion entry:
  - `scripts/run_conversion.py`
- buyer frontend:
  - `public/index.html`
  - `public/app.js`
  - `public/styles.css`
- admin usage stats markup:
  - `public/adminUsageStatsMarkup.mjs`

## Local Development Rules

### Node version

Do not rely on system Node 14.

Use bundled Node 24:

- `C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

### Local run

Start locally with:

```powershell
cd D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server/index.cjs
```

Pages:

- buyer:
  - `http://127.0.0.1:3015/`
- admin:
  - `http://127.0.0.1:3015/admin`

### Local verification rules

Do not treat “no error” as done.

For upload / conversion / download features, local verification should cover:

- more realistic file sizes, not only tiny fixtures
- multipart upload behavior
- large payload edge cases
- non-JSON error handling

At least one real browser flow should be run for meaningful UI changes.

### Known local issue

Port `3015` may already be occupied by an old Node process.

If the local UI seems inconsistent with the current code:

1. check whether port `3015` is already in use
2. confirm which process owns it
3. stop the stale process
4. start the current app again

### Local buyer test credential note

- `DEMO-USES-5` may already be exhausted in local SQLite data
- prefer `DEMO-DAYS-7` for local buyer testing unless codes are reset

## Deployment Rules

### Fixed coexistence rules

Old project:

- directory:
  - `/home/admin/EnglishQuestion`
- PM2:
  - `english-question`

This new tool:

- directory:
  - `/home/admin/pdf-converter-web`
- PM2:
  - `pdf-converter-web`
- nginx config:
  - `/etc/nginx/conf.d/pdf-converter-web.conf`
- cert directory:
  - `/home/admin/certs/pdf.seedling.top/`

Do not mix them.

### Current update classification

When users ask “how to upload/update/publish”, first classify the change as:

- frontend only
- backend only
- dependency/runtime change
- mixed change

For this repository, frontend-only usually means:

- `public/*`

Backend-only usually means:

- `server/*`
- `scripts/run_conversion.py`

Dependency/runtime change usually means:

- `package.json`
- `package-lock.json`
- Python package additions like `pypdf`
- Python package additions like `pdf2docx`
- Python package additions like `ocrmypdf`
- system dependency updates

### Standard update flow for this tool

After uploading updated code to `/home/admin/pdf-converter-web`, default to:

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
```

Only skip `npm install` when you are sure Node dependencies did not change.

### Current extra runtime requirement

Current extra runtime pieces now include:

- `pypdf`
- `pdf2docx`
- `pymupdf`
- `python-pptx`
- `ocrmypdf`
- `ghostscript`
- `tesseract-ocr`
- `tesseract-ocr-chi-sim`
- `tesseract-ocr-eng`

If the server is missing the newer PDF dependencies, the likely install commands are:

```bash
cd /home/admin/pdf-converter-web
sudo apt update
sudo apt install -y ghostscript tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-eng
sudo python3 -m pip install pypdf pdf2docx pymupdf python-pptx ocrmypdf
```

### System dependency install

The main server setup entry remains:

```bash
cd /home/admin/pdf-converter-web
chmod +x deploy/ubuntu-22.04/install-system-deps.sh
./deploy/ubuntu-22.04/install-system-deps.sh
```

Important notes:

- if `python3-pdf2image` package install is problematic, use the previously confirmed manual fallback
- if Word to PDF Chinese text becomes squares, first suspect missing Chinese fonts

### Nginx and certificates

Use:

- nginx config:
  - `/etc/nginx/conf.d/pdf-converter-web.conf`
- cert files:
  - `/home/admin/certs/pdf.seedling.top/pdf.seedling.top.key`
  - `/home/admin/certs/pdf.seedling.top/pdf.seedling.top_bundle.pem`

After nginx changes:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Post-Update Verification

After each deploy or re-upload, at minimum run:

```bash
pm2 status
curl http://127.0.0.1:3015/api/health
curl -I http://pdf.seedling.top
curl -I https://pdf.seedling.top
curl https://pdf.seedling.top/api/conversions/catalog
```

Additional expectations:

- `/api/conversions/catalog` should include:
  - `excel_to_pdf`
  - `ppt_to_pdf`
  - `pdf_to_pptx`
  - `pdf_to_word`
  - `delete_pages_pdf`
  - `reorder_pages_pdf`
  - `protect_unlock_pdf`
  - `merge_pdf`
  - `compress_pdf`
  - `watermark_pdf`
  - `add_page_numbers_pdf`
  - `sign_stamp_pdf`
  - `rotate_pdf`
  - `pdf_extract_pages`
  - `split_pdf`
- buyer homepage opens
- admin page opens
- buyer login works
- homepage shows overview cards, not direct upload forms
- desktop overview layout shows 3 cards per row
- detail page hides the big homepage hero
- detail page shows a clear `返回列表` button
- Word to PDF works
- PDF to PPTX works
- PDF to Word works
- PDF to images returns ZIP
- images to PDF works
- PDF merge works
- PDF compress works
- PDF watermark works
- Delete PDF pages works
- Reorder PDF pages works
- Protect/Unlock PDF works
- PDF page numbers work
- PDF sign / stamp works
- PDF rotate pages work
- Excel to PDF works
- PPT to PDF works
- PDF extract pages works
- split PDF works
- upload progress works
- Chinese filenames remain readable
- admin code enable/disable works
- admin usage stats page works
- usage stats show Chinese feature labels

## Current Status Summary

This project is already beyond scaffolding.

What is true now:

- base product is online
- multiple sellable PDF flows are implemented
- a text-tool line has now also been implemented
- buyer UI is now a tool-station shell with:
  - category cards
  - full-site search
  - text-tool grouped sections
  - detail-page route persistence
- automated tests are present
- real browser verification has been run locally for:
  - Excel to PDF
  - PPT to PDF
  - PDF to PPTX text-PDF path
  - delete PDF pages
  - reorder PDF pages
  - protect/unlock PDF
  - extract pages
  - split PDF
  - merge PDF
  - PDF compress
  - PDF to Word
  - watermark PDF
  - PDF page numbers
  - PDF sign / stamp
  - PDF rotate pages
  - mobile buyer UI
  - text dedupe
  - url extraction
  - list sort
  - regex extraction

Latest local verification nuance:

- `PDF 转 PPT` was browser-tested on local port `3025`
- text-PDF flow was verified end-to-end, including downloaded PPTX content inspection
- scanned-PDF flow was verified end-to-end only for the current fallback path
- local machine did not have a configured `ocrmypdf` command at that time, so editable OCR output for scanned PDFs was **not** browser-verified locally

Latest text-tool / homepage verification nuance:

- homepage category cards were browser-verified
- full-site search across `PPT 工具` + `文本工具` + `编程工具` was browser-verified
- text-tool detail pages keep the current tool after refresh
- current text tools are frontend-local tools, so this round did not require new backend or Python dependencies

Latest dev-tool verification nuance:

- current latest full Node test suite passed
  - completion-time count:
    - `221/221`
- real browser self-tests now additionally covered:
  - Base64 加解密
  - 网站 SSL 证书检测
  - JSON 字段提取
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

Current still-not-finished dev-tool scope includes at least:

- ICP 备案查询
- ICP 批量查询
- ICP 备案反查
- Nslookup 查询
- SSL 证书链下载
- 批量请求 / API 批量请求
- 死链检测
- 多节点 IP 检测
- IP 地址获取主机名
- 浏览器指纹检测
- PHP password_hash
- JSON/CSV/PHP/JS 对象互转的更多长尾工具
- RSA 密钥对生成
- JS/CSS/HTML 美化压缩
- CSS/JS 清除

## Usage Stats Rule

The current admin statistics rule is:

- count one usage event only when the buyer clicks `开始转换`
- do not count opening a detail page
- storage table:
  - `usage_stats`
- grouping:
  - by day
  - by feature
- admin UI supports:
  - today
  - yesterday
  - last 7 days
  - last 30 days
  - custom date range

If future work continues, do not re-discuss the old project context. Stay anchored on this repository and the current PDF tool behavior.
