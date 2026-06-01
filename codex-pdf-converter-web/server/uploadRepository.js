const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const answerAudioRoot = path.join(uploadsRoot, 'records');

function sanitizeSegment(value, fallback) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function getDateFolder() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getExtensionFromMimeType(mimeType = '') {
  const normalized = String(mimeType || '').toLowerCase();
  if (normalized.includes('webm')) return '.webm';
  if (normalized.includes('ogg')) return '.ogg';
  if (normalized.includes('mpeg')) return '.mp3';
  if (normalized.includes('wav')) return '.wav';
  if (normalized.includes('mp4')) return '.m4a';
  return '.bin';
}

async function saveAnswerAudio({ buffer, mimeType = '', questionId = '', questionType = '' }) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    const error = new Error('录音文件为空，无法上传。');
    error.statusCode = 400;
    throw error;
  }

  const dateFolder = getDateFolder();
  const targetDir = path.join(answerAudioRoot, dateFolder);
  await fs.mkdir(targetDir, { recursive: true });

  const safeQuestionType = sanitizeSegment(questionType, 'audio');
  const safeQuestionId = sanitizeSegment(questionId, crypto.randomUUID());
  const extension = getExtensionFromMimeType(mimeType);
  const filename = `${safeQuestionType}-${safeQuestionId}-${Date.now()}${extension}`;
  const absolutePath = path.join(targetDir, filename);
  const relativePath = path.posix.join('records', dateFolder, filename);

  await fs.writeFile(absolutePath, buffer);

  return {
    audioPath: relativePath,
    audioUrl: `/api/uploads/${relativePath}`,
    audioMimeType: mimeType || 'application/octet-stream'
  };
}

module.exports = {
  uploadsRoot,
  saveAnswerAudio
};
