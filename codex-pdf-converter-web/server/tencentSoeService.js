const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const WebSocket = require('ws');
const ffmpegPath = require('ffmpeg-static');

const execFileAsync = promisify(execFile);
const FALLBACK_SCORE = 100;
const DEFAULT_SERVER_ENGINE_TYPE = '16k_en';
const DEFAULT_TIMEOUT_MS = 30000;
const SOE_HOST = 'soe.cloud.tencent.com';
const SOE_PATH = '/soe/api';
const uploadsRoot = path.resolve(process.cwd(), 'uploads');

function clampScore(value) {
  if (!Number.isFinite(Number(value))) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function averageWordAccuracy(words = []) {
  const validScores = (Array.isArray(words) ? words : [])
    .map((item) => Number(item?.PronAccuracy))
    .filter((item) => Number.isFinite(item) && item >= 0);

  if (!validScores.length) {
    return null;
  }

  const total = validScores.reduce((sum, item) => sum + item, 0);
  return total / validScores.length;
}

function parseSoeResultPayload(result = {}) {
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result;
  }

  const text = String(result || '').trim();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    // Fall through to the looser parsers below.
  }

  try {
    const jsonLike = text.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
    return JSON.parse(jsonLike);
  } catch (error) {
    // Some Tencent examples render result payloads without valid JSON quoting.
  }

  const parsed = {};
  const suggestedScoreMatch = text.match(/SuggestedScore\s*:\s*(-?\d+(?:\.\d+)?)/);
  if (suggestedScoreMatch) {
    parsed.SuggestedScore = Number(suggestedScoreMatch[1]);
  }

  const pronAccuracyMatches = Array.from(text.matchAll(/PronAccuracy\s*:\s*(-?\d+(?:\.\d+)?)/g))
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));

  if (pronAccuracyMatches.length) {
    parsed.PronAccuracy = pronAccuracyMatches[0];
  }

  if (pronAccuracyMatches.length > 1) {
    parsed.Words = pronAccuracyMatches.slice(1).map((value) => ({ PronAccuracy: value }));
  }

  return parsed;
}

function normalizeSoeSuggestedScore(response = {}) {
  const payload = parseSoeResultPayload(response);

  if (Number.isFinite(Number(payload.SuggestedScore))) {
    return clampScore(payload.SuggestedScore);
  }

  const candidates = [
    payload.PronAccuracy,
    averageWordAccuracy(payload.Words),
    payload.SentenceInfoSet?.[payload.SentenceInfoSet.length - 1]?.SuggestedScore,
    payload.SentenceInfoSet?.[payload.SentenceInfoSet.length - 1]?.PronAccuracy
  ];

  const score = candidates.find((item) => Number.isFinite(Number(item)) && Number(item) >= 0);
  return clampScore(score);
}

function relaxReadAloudScore(score) {
  const normalized = clampScore(score);

  if (normalized >= 90) {
    return normalized;
  }

  if (normalized <= 60) {
    return clampScore(normalized + 10 + (60 - normalized) * 0.15);
  }

  return clampScore(normalized + (90 - normalized) * 0.2);
}

function relaxListenAnswerScore(score) {
  const normalized = clampScore(score);

  if (normalized >= 90) {
    return normalized;
  }

  if (normalized <= 60) {
    return clampScore(normalized + 15 + (60 - normalized) * 0.2 + (normalized < 10 ? 1 : 0));
  }

  return clampScore(normalized + 1 + (90 - normalized) * 0.4);
}

function relaxOralAnswerScore(score, questionType = 'read_aloud') {
  if (questionType === 'listen_answer_question') {
    return relaxListenAnswerScore(score);
  }
  return relaxReadAloudScore(score);
}

function parseScoreCoeff(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.max(1, Math.min(4, numeric));
}

function parseTimeout(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.round(numeric);
}

function parseSentenceInfoEnabled(value) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }
  if (value === true || value === '1' || value === 1 || value === 'true') {
    return 1;
  }
  return 0;
}

function getSoeConfig() {
  return {
    appId: String(process.env.TENCENT_SOE_APP_ID || '').trim(),
    secretId: String(process.env.TENCENT_SECRET_ID || '').trim(),
    secretKey: String(process.env.TENCENT_SECRET_KEY || '').trim(),
    region: String(process.env.TENCENT_SOE_REGION || 'ap-guangzhou').trim() || 'ap-guangzhou',
    scoreCoeff: parseScoreCoeff(process.env.TENCENT_SOE_SCORE_COEFF),
    serverEngineType: String(process.env.TENCENT_SOE_SERVER_ENGINE_TYPE || DEFAULT_SERVER_ENGINE_TYPE).trim() || DEFAULT_SERVER_ENGINE_TYPE,
    sentenceInfoEnabled: parseSentenceInfoEnabled(process.env.TENCENT_SOE_SENTENCE_INFO_ENABLED),
    timeoutMs: parseTimeout(process.env.TENCENT_SOE_TIMEOUT_MS)
  };
}

function buildFallbackResult(reason) {
  return {
    rawScore: FALLBACK_SCORE,
    fallbackUsed: true,
    reason
  };
}

function formatReadAloudScoreLog({ questionNumber, scoringResult = {} }) {
  const prefix = `��${Number(questionNumber || 0)}��`;
  if (scoringResult.fallbackUsed) {
    return `${prefix} ʶ�����${String(scoringResult.reason || 'unknown')}��`;
  }
  return `${prefix} ${clampScore(scoringResult.rawScore)}��`;
}

function normalizeReferenceText(refText = '') {
  return String(refText || '').trim().replace(/\s+/g, ' ');
}

function determineEvalMode(refText = '') {
  const words = normalizeReferenceText(refText).split(' ').filter(Boolean);
  if (words.length <= 1) {
    return 0;
  }
  if (words.length <= 30) {
    return 1;
  }
  return 2;
}

function buildSoeRequestParams({
  secretId = '',
  refText = '',
  voiceId = '',
  timestamp = Math.floor(Date.now() / 1000),
  expired = timestamp + 3600,
  nonce = crypto.randomInt(10000000, 99999999),
  scoreCoeff = 1,
  serverEngineType = DEFAULT_SERVER_ENGINE_TYPE,
  sentenceInfoEnabled = 1
} = {}) {
  return {
    secretid: String(secretId || '').trim(),
    timestamp: Number(timestamp),
    expired: Number(expired),
    nonce: Number(nonce),
    server_engine_type: String(serverEngineType || DEFAULT_SERVER_ENGINE_TYPE).trim() || DEFAULT_SERVER_ENGINE_TYPE,
    voice_format: 1,
    voice_id: String(voiceId || crypto.randomUUID()).trim(),
    text_mode: 0,
    ref_text: normalizeReferenceText(refText),
    eval_mode: determineEvalMode(refText),
    score_coeff: parseScoreCoeff(scoreCoeff),
    sentence_info_enabled: Number(sentenceInfoEnabled) ? 1 : 0,
    rec_mode: 1
  };
}

function buildSoeWebsocketUrl({ appId = '', secretKey = '', params = {} } = {}) {
  const normalizedAppId = String(appId || '').trim();
  const normalizedSecretKey = String(secretKey || '').trim();
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right));

  const rawQuery = entries
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  const signSource = `${SOE_HOST}${SOE_PATH}/${normalizedAppId}?${rawQuery}`;
  const signature = crypto
    .createHmac('sha1', normalizedSecretKey)
    .update(signSource)
    .digest('base64');
  const encodedQuery = entries
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  return `wss://${SOE_HOST}${SOE_PATH}/${normalizedAppId}?${encodedQuery}&signature=${encodeURIComponent(signature)}`;
}

function resolveAudioAbsolutePath(audioPath = '') {
  const normalized = String(audioPath || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) {
    return '';
  }
  return path.resolve(uploadsRoot, normalized);
}

async function prepareTencentAudio(audioAbsolutePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tencent-soe-'));
  const outputPath = path.join(tempDir, `${path.parse(audioAbsolutePath).name}.wav`);

  await execFileAsync(
    ffmpegPath,
    [
      '-y',
      '-i',
      audioAbsolutePath,
      '-ac',
      '1',
      '-ar',
      '16000',
      '-acodec',
      'pcm_s16le',
      outputPath
    ],
    { windowsHide: true }
  );

  return {
    outputPath,
    async cleanup() {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  };
}

function sendSocketPayload(socket, payload, options) {
  return new Promise((resolve, reject) => {
    socket.send(payload, options, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function requestSoeScoreOverWebSocket({
  appId = '',
  secretId = '',
  secretKey = '',
  refText = '',
  audioBuffer,
  scoreCoeff = 1,
  serverEngineType = DEFAULT_SERVER_ENGINE_TYPE,
  sentenceInfoEnabled = 0,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  createWebSocket = (url) => new WebSocket(url)
} = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = buildSoeRequestParams({
    secretId,
    refText,
    voiceId: crypto.randomUUID(),
    timestamp,
    expired: timestamp + 3600,
    nonce: crypto.randomInt(10000000, 99999999),
    scoreCoeff,
    serverEngineType,
    sentenceInfoEnabled
  });
  const url = buildSoeWebsocketUrl({
    appId,
    secretKey,
    params
  });

  return new Promise((resolve, reject) => {
    let socket = null;
    let settled = false;
    let handshakeComplete = false;
    let latestResult = null;

    const timer = setTimeout(() => {
      fail(new Error('soe_timeout'));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      if (!socket) {
        return;
      }
      socket.removeAllListeners();
      try {
        socket.close();
      } catch (error) {
        // Ignore cleanup failures.
      }
    }

    function succeed(result) {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(result);
    }

    function fail(error) {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    }

    try {
      socket = createWebSocket(url);
    } catch (error) {
      fail(error);
      return;
    }

    socket.on('message', (message, isBinary) => {
      if (isBinary) {
        return;
      }

      let payload;
      try {
        const text = Buffer.isBuffer(message) ? message.toString('utf8') : String(message || '');
        payload = JSON.parse(text);
      } catch (error) {
        fail(error);
        return;
      }

      if (Number(payload.code) !== 0) {
        fail(new Error(payload.message || payload.code_desc || `soe_error_${payload.code}`));
        return;
      }

      if (payload.result !== undefined) {
        latestResult = parseSoeResultPayload(payload.result);
      }

      if (!handshakeComplete) {
        handshakeComplete = true;
        Promise.resolve()
          .then(() => sendSocketPayload(socket, audioBuffer, { binary: true }))
          .then(() => sendSocketPayload(socket, JSON.stringify({ type: 'end' })))
          .catch(fail);
        return;
      }

      if (Number(payload.final) === 1) {
        if (latestResult) {
          succeed(latestResult);
          return;
        }
        fail(new Error('missing_score_result'));
      }
    });

    socket.on('error', fail);
    socket.on('close', (code, reason) => {
      if (settled) {
        return;
      }
      const closeReason = Buffer.isBuffer(reason) ? reason.toString('utf8') : String(reason || '');
      fail(new Error(closeReason || `soe_socket_closed_${code}`));
    });
  });
}

async function scoreReadAloudAnswer({ audioPath = '', refText = '', questionType = 'read_aloud' } = {}) {
  const config = getSoeConfig();
  const normalizedRefText = normalizeReferenceText(refText);
  const audioAbsolutePath = resolveAudioAbsolutePath(audioPath);

  if (!normalizedRefText) {
    return buildFallbackResult('missing_ref_text');
  }

  if (!audioAbsolutePath) {
    return buildFallbackResult('missing_audio');
  }

  if (!config.appId) {
    return buildFallbackResult('missing_app_id');
  }

  if (!config.secretId || !config.secretKey) {
    return buildFallbackResult('missing_credentials');
  }

  let preparedAudio = null;

  try {
    await fs.access(audioAbsolutePath);
    preparedAudio = await prepareTencentAudio(audioAbsolutePath);
    const voiceBuffer = await fs.readFile(preparedAudio.outputPath);
    const response = await requestSoeScoreOverWebSocket({
      appId: config.appId,
      secretId: config.secretId,
      secretKey: config.secretKey,
      refText: normalizedRefText,
      audioBuffer: voiceBuffer,
      scoreCoeff: config.scoreCoeff,
      serverEngineType: config.serverEngineType,
      sentenceInfoEnabled: config.sentenceInfoEnabled,
      timeoutMs: config.timeoutMs
    });
    const sourceRawScore = normalizeSoeSuggestedScore(response);

    return {
      rawScore: relaxOralAnswerScore(sourceRawScore, questionType),
      sourceRawScore,
      fallbackUsed: false,
      response
    };
  } catch (error) {
    return buildFallbackResult(error.message || 'soe_failed');
  } finally {
    await preparedAudio?.cleanup?.();
  }
}

module.exports = {
  buildSoeRequestParams,
  buildSoeWebsocketUrl,
  formatReadAloudScoreLog,
  getSoeConfig,
  normalizeSoeSuggestedScore,
  parseSoeResultPayload,
  relaxOralAnswerScore,
  relaxReadAloudScore,
  requestSoeScoreOverWebSocket,
  scoreReadAloudAnswer
};
