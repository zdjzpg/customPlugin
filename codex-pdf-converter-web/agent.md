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
- PDF to images
- images to PDF
- PDF extract pages
- split PDF

Current behavior:

- buyer logs in with redemption code
- admin has separate login and code management
- upload pipeline uses `multipart/form-data`
- conversion records are stored in SQLite

Detailed rules for the two newest features:

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
   - `查看详情`
4. user clicks into method detail page
5. only on detail page:
   - upload file
   - fill parameters
   - start conversion
   - download result

Current layout rules:

- homepage overview cards:
  - desktop: 3 columns
  - medium width: 2 columns
  - mobile: 1 column
- page side padding was intentionally reduced from the earlier version

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
- PDF to images:
  - `pdf2image`
  - poppler
- images to PDF:
  - `reportlab`
  - `Pillow`
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
- Python conversion entry:
  - `scripts/run_conversion.py`
- buyer frontend:
  - `public/index.html`
  - `public/app.js`
  - `public/toolCatalogMarkup.mjs`
  - `public/styles.css`

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

The newest PDF page features require:

- `pypdf`

If this dependency is not already present on the server, run:

```bash
cd /home/admin/pdf-converter-web
sudo python3 -m pip install pypdf
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
  - `pdf_extract_pages`
  - `split_pdf`
- buyer homepage opens
- admin page opens
- buyer login works
- homepage shows overview cards, not direct upload forms
- desktop overview layout shows 3 cards per row
- Word to PDF works
- PDF to images returns ZIP
- images to PDF works
- PDF extract pages works
- split PDF works
- upload progress works
- Chinese filenames remain readable
- admin code enable/disable works

## Current Status Summary

This project is already beyond scaffolding.

What is true now:

- base product is online
- five conversion flows are implemented
- buyer UI has been simplified into overview -> detail flow
- automated tests are present
- real browser verification has been run locally for the new PDF page tools

If future work continues, do not re-discuss the old project context. Stay anchored on this repository and the current PDF tool behavior.
