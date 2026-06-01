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

- No new app scaffold has been created yet
- User then changed the request and asked to generate session context into `D:\aa-workplace\customPlugin`

## Recommended Next Step

Create a new independent project inside:

- `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web`

Recommended immediate scope:

1. Scaffold a standalone Node.js monolith app
2. Use bundled Node 24 for install/test/run
3. Implement redemption-code validation first
4. Implement one conversion flow first, preferably:
   - PDF to images
   - or images to PDF
5. Add Word to PDF after the base upload/download pipeline is stable

