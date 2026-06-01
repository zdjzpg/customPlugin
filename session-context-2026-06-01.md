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
