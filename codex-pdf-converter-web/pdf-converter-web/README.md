# PDF Converter Web

Independent web app for:

- `Word -> PDF`
- `Excel -> PDF`
- `PPT -> PDF`
- `PDF -> PPTX`
- `PDF -> Word`
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

Current scope:

- single admin login
- buyer login via redemption code
- local file storage
- SQLite for metadata
- `Images -> PDF` real conversion
- `Word -> PDF` real `.docx` fallback conversion
- `PDF -> Images` production path wired, requires poppler
- admin code management
- admin conversion records

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
