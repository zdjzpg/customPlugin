# PDF Converter Web

Independent web app for:

- `Word -> PDF`
- `Excel -> PDF`
- `PPT -> PDF`
- `PDF -> PPTX`
- `PDF -> Word`
- `扫描件转可搜索 PDF`
- `批量 Word / Excel / PPT 转 PDF`
- `批量 PDF -> Images`
- `试卷 / 讲义整理`
- `图片转 Word`
- `PDF 转 Excel`
- `图片表格转 Excel`
- `音视频工具`
- `PDF -> Images`
- `Images -> PDF`
- `PDF Merge`
- `PDF 压缩`
- `PDF 加水印`
- `PDF 加页码`
- `PDF 签名 / 盖章`
- `PDF 旋转页面`
- `PDF 提取页面`
- `拆分 PDF`
- `图像工具`

Current `音视频工具` line includes:

- `文字转语音`
- `音频剪切`
- `音频合并`
- `音频试听播放`
- `视频加速播放`
- `特定频率音频生成`
- `白噪音生成器`

Current scope:

- single admin login
- buyer login via redemption code
- public preview page at `/preview`
- local file storage
- SQLite for metadata
- `Images -> PDF` real conversion
- `Word -> PDF` real `.docx` fallback conversion
- `PDF -> Images` production path wired, requires poppler
- admin code management
- admin conversion records
- admin feature usage statistics
- admin code-value search for code management and recent conversions
- admin per-code daily click chart with top-15 tool legend
- image-tools category with local/server image processing
- office / teaching document cleanup and OCR exports

This project is intentionally isolated from the parent workspace.

## Local development

This project requires `Node 24+`.

The current workspace already has a bundled Node 24 runtime at:

`C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

### Run tests

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.cjs
```

### Start the app

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server/index.cjs
```

Then open:

- buyer page: `http://127.0.0.1:3015/`
- admin page: `http://127.0.0.1:3015/admin`
- preview page: `http://127.0.0.1:3015/preview`

### Default admin credentials

- username: `admin`
- password: `change-me`

### Seeded demo redemption codes

- usage card: `DEMO-USES-5`
- duration card: `DEMO-DAYS-7`

## Environment variables

See [.env.example](D:/aa-workplace/customPlugin/codex-pdf-converter-web/pdf-converter-web/.env.example).

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `PYTHON_BIN`
- `LIBREOFFICE_BIN`
- `POPPLER_BIN_DIR`
- `GHOSTSCRIPT_BIN`
- `OCRMYPDF_BIN`
- `TESSERACT_BIN`
- `FFMPEG_BIN`

## Conversion notes

### Images -> PDF

- Works in the current local environment via Python `Pillow + reportlab`

### Word -> PDF

- If `LIBREOFFICE_BIN` is configured, the server uses LibreOffice headless
- If LibreOffice is unavailable, `.docx` files fall back to a basic text-first PDF export using `python-docx + reportlab`
- The fallback is intentionally limited and does not preserve full Word layout fidelity

### Excel -> PDF / PPT -> PDF

- Uses LibreOffice headless
- Supports:
  - `.xlsx`
  - `.xls`
  - `.pptx`
  - `.ppt`
- Complex pagination, print areas, slide/export nuances follow actual LibreOffice output

### PDF -> Word

- Uses Python `pdf2docx`
- Supports:
  - text PDF to editable `.docx`
  - OCR mode for scanned PDFs
- OCR mode requires:
  - `ocrmypdf`
  - `tesseract-ocr`
  - OCR language packs such as Chinese and English
- The market-standard tradeoff still applies:
  - text PDFs usually preserve editability and layout better
- scanned PDFs depend on OCR quality and page complexity

### 扫描件转可搜索 PDF

- Uses `ocrmypdf`
- Accepts:
  - `.pdf`
- Outputs:
  - searchable `.pdf`
- Best for:
  - scanned handouts
  - copied documents
  - archive PDFs that need keyword search

### 批量 Office / PDF 处理

- Current batch coverage includes:
  - `批量 Word 转 PDF`
  - `批量 Excel 转 PDF`
  - `批量 PPT 转 PDF`
  - `批量 PDF 转图片`
- Outputs:
  - one ZIP package
- Current behavior:
  - preserves the user-visible upload order
  - runs each file through the corresponding single-file conversion path

### 试卷 / 讲义整理

- Accepts:
  - `.pdf`
  - `.png`
  - `.jpg`
  - `.jpeg`
  - `.webp`
  - `.bmp`
  - `.tif`
  - `.tiff`
- Current first version supports:
  - border cleanup
  - contrast enhancement
  - grayscale / black-white cleanup
  - optional double-page split
  - PDF or image ZIP output

### 图片转 Word

- Uses:
  - `tesseract`
  - `python-docx`
- Accepts common image formats
- Outputs:
  - one `.docx`
- Current behavior:
  - focuses on extracting readable text into editable paragraphs
  - does not promise complex page layout fidelity

### PDF 转 Excel / 图片表格转 Excel

- `PDF 转 Excel`
  - uses `PyMuPDF` table detection plus `openpyxl`
- `图片表格转 Excel`
  - uses `OpenCV` grid detection plus `tesseract` OCR
- Outputs:
  - one `.xlsx`
- Current first version is best suited for:
  - ruled tables
  - schedules
  - score sheets
  - simple lists and rosters

### PDF -> PPTX

- Uses Python `PyMuPDF + python-pptx`
- Each PDF page becomes one PPT slide
- Tries to extract:
  - editable text blocks
  - separate images
- If a PDF has no extractable text and `ocrmypdf` is configured, the server runs OCR first
- Complex layouts, tables, and multi-column pages may shift during output

### PDF -> Images

- Uses Python `pdf2image`
- Requires poppler binaries such as `pdfinfo` and `pdftoppm`
- If `tools/poppler/poppler-25.07.0/Library/bin` exists locally, the app auto-detects it
- On Ubuntu 22.04, install poppler before using this feature

### 图像工具

Current implemented image-tool coverage includes:

- image resize / width-height change
- HEIC to JPG / PNG
- image format convert
- image batch compress
- free crop / ratio crop / batch ratio crop
- split grid / long-image concat / collage
- grayscale / invert / printmaking / emboss
- background fill / dark-mode background / solid-background removal
- smart background removal
- image add text
- image border / frame
- platform cover templates with single-image multi-template ZIP export
- image annotate canvas
- image flip / mirror
- image metadata view / clear
- image blur / redact
- image rotate adjust
- image object erase (lightweight)
- favicon / app icon / chrome icon generation
- padding / pixelate / DPI change / content clear / file-size increase
- GIF split / GIF merge
- Excel image extract / PPT image extract
- round-corner / tile-fill / anti-OCR image
- id-photo resize / crop / background swap
- payment-code merge
- QR generate / batch QR generate / QR decode
- local image border / template / annotation tools
- local social-cover padding
- local image privacy redaction
- local blurred-background fill

Current buyer homepage now includes:

- `PPT 工具`
- `音视频工具`
- `文本工具`
- `编程工具`
- `图像工具`

Current homepage short copy:

- `文件、图像与文本处理一站完成`

Current public preview behavior:

- `/preview` is publicly accessible without a redemption code
- buyers can search tools and switch categories there
- preview cards do not enter detail pages
- clicking preview cards only shows the login/contact prompt
- preview page includes:
  - `已有卡密，去登录`
    shortcut back to `/`

Deferred image-tool items that are intentionally not exposed in buyer UI yet are tracked in:

- [2026-06-04-image-tools-program-design.md](D:/aa-workplace/customPlugin/codex-pdf-converter-web/pdf-converter-web/docs/superpowers/specs/2026-06-04-image-tools-program-design.md)

### Latest local verification

- full Node test suite passed
  - `390/390`
- real browser local regression additionally covered:
  - image-tools category entry
  - image-tools search
  - image resize exact
  - image format convert
  - GIF merge
  - image batch compress ZIP download
  - favicon generate
  - image border / frame
  - platform template batch ZIP export
  - image annotate canvas
  - image flip / mirror
  - image metadata view / clear
  - image blur / redact
  - image rotate adjust
  - image object erase (lightweight)

Browser regression artifacts were stored in:

- `D:\temp\codex-image-tools-browser-20260604`
- `D:\temp\codex-image-tool-batch-20260605`
- `D:\temp\codex-image-batch-template-20260605`
- `D:\temp\codex-image-five-20260605`

Additional Python packages required by the latest image-tool additions:

- `pillow-heif` for `HEIC 转 JPG / PNG`
- `rembg[cpu]` for `智能抠图 / 去背景`
- `qrcode[pil]` for `二维码生成 / 批量二维码`
- `opencv-python` or system `python3-opencv` for `二维码解码`

Latest high-click UU-style image-tool additions now also include:

- `图片隐私打码`
- `图片模糊背景填充`
- `收款码合并`
- `二维码生成`
- `批量二维码`
- `二维码解码`

Current local-image-tool line now additionally includes:

- `图片加边框 / 描边`
- `平台封面尺寸模板`
- `图片标注 / 箭头框选`
- `图片加边框 / 社媒封面留白`
- `图片隐私打码`
- `图片模糊背景填充`

### 音视频工具

- `文字转语音`
  - current first version supports:
    - `中文普通话`
    - `英文`
  - outputs:
    - `mp3`
    - `wav`
  - uses Python `edge-tts`
  - `wav` export requires `ffmpeg`
- `音频剪切`
  - uses `ffmpeg`
  - supports start/end time trimming
- `音频合并`
  - uses `ffmpeg`
  - merges in current upload order
- `音频试听播放`
  - local browser tool
  - does not require backend processing
- `视频加速播放`
  - local browser tool
  - does not require backend processing
- `特定频率音频生成`
  - local browser WAV generation
- `白噪音生成器`
  - local browser WAV generation

If you want to use all current audio tools locally or on the server, make sure:

- `FFMPEG_BIN` points to a reachable `ffmpeg`
- `PYTHON_BIN` can import `edge_tts`

### OCR / QR / Image Utility Runtime Notes

- `OCR 文字识别`
  - requires:
    - `TESSERACT_BIN`
    - language packs such as English / Chinese
- `音频转文字`
  - requires:
    - `FFMPEG_BIN`
    - Python package `openai-whisper`
  - current recommended default:
    - `WHISPER_MODEL=tiny`
- `扫描件转可搜索 PDF`
  - requires:
    - `OCRMYPDF_BIN`
- `图片转 Word`
  - requires:
    - `TESSERACT_BIN`
- `图片表格转 Excel`
  - requires:
    - `TESSERACT_BIN`
- `PDF 转 Excel`
  - requires Python package:
    - `openpyxl`
- `试卷 / 讲义整理`
  - requires:
    - Python `cv2`
- `二维码生成 / 批量二维码`
  - requires Python package:
    - `qrcode[pil]`
- `二维码解码`
  - requires:
    - Python `cv2`
  - current implementation uses:
    - OpenCV `QRCodeDetector`

### PDF 提取页面 / 拆分 PDF

- Uses Python `pypdf`
- `PDF 提取页面` supports text input such as `1,3,5-8`
- `拆分 PDF` supports one output range per line and returns one ZIP package
- On Ubuntu 22.04, ensure `pypdf` is installed for these two features

### PDF 压缩

- Uses `Ghostscript`
- Supports:
  - `标准压缩`
  - `强力压缩`
- Returns one compressed PDF
- Shows size comparison between the original file and the compressed result

### PDF 加水印

- Supports:
  - text watermark
  - image watermark
- Text watermark supports:
  - tiled diagonal layout
  - single centered layout
- Image watermark supports:
  - `PNG`
  - `JPG`
  - fixed positions:
    - center
    - bottom-left
    - bottom-right

### PDF 加页码

- Supports whole-document unified page numbering
- Positions:
  - footer center
  - bottom-right
- Supports:
  - start page number
  - plain format like `1`
  - Chinese format like `第 1 页`

### PDF 签名 / 盖章

- Supports whole-document unified sign/stamp placement
- Supports:
  - uploaded sign/stamp image
  - drawn signature in browser
- Fixed positions:
  - center
  - bottom-left
  - bottom-right
- Adjustable:
  - scale
  - opacity

### PDF 旋转页面

- Supports whole-document unified rotation
- Angles:
  - `90°`
  - `180°`
  - `270°`

## Deployment

Ubuntu deployment guide:

- [deployment-ubuntu-22.04.md](D:/aa-workplace/customPlugin/codex-pdf-converter-web/pdf-converter-web/docs/deployment-ubuntu-22.04.md)

## Admin Dashboard

Current admin dashboard includes four modules inside one page:

- `卡密管理`
  - create / enable / disable codes
  - code-value substring search
  - client-side pagination with `20` rows per page
- `最近转换记录`
  - shows time, code, tool, status, input, output, error
  - tool names are rendered with Chinese labels
  - code-value substring search
  - client-side pagination with `20` rows per page
- `功能统计`
  - grouped by day and feature
  - supports:
    - `今天`
    - `昨天`
    - `近7天`
    - `近30天`
    - `自定义日期`
  - client-side pagination with `20` rows per page
- `卡密图表`
  - query one code value at a time
  - groups clicks by day
  - legend shows the top `15` tools for that code in the selected date range
  - chart is rendered with local frontend markup, no external chart dependency
