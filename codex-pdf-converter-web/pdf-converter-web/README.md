# PDF Converter Web

Independent web app for:

- `Word -> PDF`
- `PDF -> Images`
- `Images -> PDF`

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

## Conversion notes

### Images -> PDF

- Works in the current local environment via Python `Pillow + reportlab`

### Word -> PDF

- If `LIBREOFFICE_BIN` is configured, the server uses LibreOffice headless
- If LibreOffice is unavailable, `.docx` files fall back to a basic text-first PDF export using `python-docx + reportlab`
- The fallback is intentionally limited and does not preserve full Word layout fidelity

### PDF -> Images

- Uses Python `pdf2image`
- Requires poppler binaries such as `pdfinfo` and `pdftoppm`
- If `tools/poppler/poppler-25.07.0/Library/bin` exists locally, the app auto-detects it
- On Ubuntu 22.04, install poppler before using this feature

## Deployment

Ubuntu deployment guide:

- [deployment-ubuntu-22.04.md](D:/aa-workplace/customPlugin/codex-pdf-converter-web/pdf-converter-web/docs/deployment-ubuntu-22.04.md)
