const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

function loadEnvFile(envFilePath = path.join(__dirname, '..', '.env')) {
  if (!fs.existsSync(envFilePath)) {
    return false;
  }

  dotenv.config({ path: envFilePath, override: false });
  return true;
}

function loadConfig(options = {}) {
  const libreOfficeCandidates =
    options.libreOfficeCandidates || getDefaultLibreOfficeCandidates();
  const ghostscriptCandidates =
    options.ghostscriptCandidates || getDefaultGhostscriptCandidates();
  const ocrmypdfCandidates =
    options.ocrmypdfCandidates || getDefaultOcrmypdfCandidates();

  return {
    port: toInteger(process.env.PORT, 3015),
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'change-me',
    adminSessionTtlMs: toInteger(process.env.ADMIN_SESSION_TTL_MS, 12 * 60 * 60 * 1000),
    buyerSessionTtlMs: toInteger(process.env.BUYER_SESSION_TTL_MS, 3 * 24 * 60 * 60 * 1000),
    pythonBin:
      process.env.PYTHON_BIN ||
      'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
    libreOfficeBin: process.env.LIBREOFFICE_BIN || detectLibreOfficeBin(libreOfficeCandidates),
    popplerBinDir: process.env.POPPLER_BIN_DIR || detectLocalPopplerBinDir(),
    ghostscriptBin: process.env.GHOSTSCRIPT_BIN || detectGhostscriptBin(ghostscriptCandidates),
    ocrmypdfBin: process.env.OCRMYPDF_BIN || detectOcrmypdfBin(ocrmypdfCandidates)
  };
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  loadConfig,
  loadEnvFile
};

function detectLocalPopplerBinDir() {
  const candidate = path.join(
    __dirname,
    '..',
    'tools',
    'poppler',
    'poppler-25.07.0',
    'Library',
    'bin'
  );

  return fs.existsSync(candidate) ? candidate : '';
}

function detectLibreOfficeBin(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return '';
}

function getDefaultLibreOfficeCandidates() {
  return [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/usr/bin/libreoffice',
    '/usr/local/bin/libreoffice'
  ];
}

function detectGhostscriptBin(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return '';
}

function getDefaultGhostscriptCandidates() {
  return [
    'C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'C:\\Program Files (x86)\\gs\\gs10.05.1\\bin\\gswin32c.exe',
    '/usr/bin/gs',
    '/usr/local/bin/gs'
  ];
}

function detectOcrmypdfBin(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return '';
}

function getDefaultOcrmypdfCandidates() {
  return [
    'C:\\Users\\19816\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\Scripts\\ocrmypdf.exe',
    '/usr/local/bin/ocrmypdf',
    '/usr/bin/ocrmypdf'
  ];
}
