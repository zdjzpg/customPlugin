const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { loadConfig, loadEnvFile } = require('../server/config.cjs');

test('loadConfig detects LibreOffice from an explicit environment variable first', () => {
  const previous = process.env.LIBREOFFICE_BIN;
  process.env.LIBREOFFICE_BIN = 'C:\\LibreOffice\\program\\soffice.exe';

  try {
    const config = loadConfig();
    assert.equal(config.libreOfficeBin, 'C:\\LibreOffice\\program\\soffice.exe');
  } finally {
    restoreEnv('LIBREOFFICE_BIN', previous);
  }
});

test('loadConfig can detect LibreOffice from known filesystem candidates', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'libreoffice-detect-'));
  const fakeLibreOfficePath = path.join(tempRoot, 'LibreOffice', 'program', 'soffice.exe');
  fs.mkdirSync(path.dirname(fakeLibreOfficePath), { recursive: true });
  fs.writeFileSync(fakeLibreOfficePath, '');

  const previous = process.env.LIBREOFFICE_BIN;
  delete process.env.LIBREOFFICE_BIN;

  try {
    const config = loadConfig({
      libreOfficeCandidates: [fakeLibreOfficePath]
    });
    assert.equal(config.libreOfficeBin, fakeLibreOfficePath);
  } finally {
    restoreEnv('LIBREOFFICE_BIN', previous);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('loadConfig detects Ghostscript from an explicit environment variable first', () => {
  const previous = process.env.GHOSTSCRIPT_BIN;
  process.env.GHOSTSCRIPT_BIN = 'C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe';

  try {
    const config = loadConfig();
    assert.equal(config.ghostscriptBin, 'C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe');
  } finally {
    restoreEnv('GHOSTSCRIPT_BIN', previous);
  }
});

test('loadConfig detects OCRmyPDF from an explicit environment variable first', () => {
  const previous = process.env.OCRMYPDF_BIN;
  process.env.OCRMYPDF_BIN = 'C:\\Tools\\ocrmypdf.exe';

  try {
    const config = loadConfig();
    assert.equal(config.ocrmypdfBin, 'C:\\Tools\\ocrmypdf.exe');
  } finally {
    restoreEnv('OCRMYPDF_BIN', previous);
  }
});

test('loadEnvFile hydrates process env from project .env style file', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-load-'));
  const envPath = path.join(tempRoot, '.env');
  fs.writeFileSync(envPath, 'PYTHON_BIN=/usr/bin/python3\nPOPPLER_BIN_DIR=/usr/bin\nGHOSTSCRIPT_BIN=/usr/bin/gs\nOCRMYPDF_BIN=/usr/local/bin/ocrmypdf\n');

  const previousPython = process.env.PYTHON_BIN;
  const previousPoppler = process.env.POPPLER_BIN_DIR;
  const previousGhostscript = process.env.GHOSTSCRIPT_BIN;
  const previousOcrmypdf = process.env.OCRMYPDF_BIN;
  delete process.env.PYTHON_BIN;
  delete process.env.POPPLER_BIN_DIR;
  delete process.env.GHOSTSCRIPT_BIN;
  delete process.env.OCRMYPDF_BIN;

  try {
    const loaded = loadEnvFile(envPath);
    assert.equal(loaded, true);
    assert.equal(process.env.PYTHON_BIN, '/usr/bin/python3');
    assert.equal(process.env.POPPLER_BIN_DIR, '/usr/bin');
    assert.equal(process.env.GHOSTSCRIPT_BIN, '/usr/bin/gs');
    assert.equal(process.env.OCRMYPDF_BIN, '/usr/local/bin/ocrmypdf');
  } finally {
    restoreEnv('PYTHON_BIN', previousPython);
    restoreEnv('POPPLER_BIN_DIR', previousPoppler);
    restoreEnv('GHOSTSCRIPT_BIN', previousGhostscript);
    restoreEnv('OCRMYPDF_BIN', previousOcrmypdf);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function restoreEnv(name, value) {
  if (typeof value === 'undefined') {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
