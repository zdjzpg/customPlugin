const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const tencentcloud = require('tencentcloud-sdk-nodejs');
const { uploadsRoot } = require('./uploadRepository');

const {
  tts: {
    v20190823: { Client: TtsClient }
  }
} = tencentcloud;

const DEFAULT_REGION = 'ap-guangzhou';
const DEFAULT_CODEC = 'mp3';
const DEFAULT_VOICE_TYPE = 101001;
const DEFAULT_PRIMARY_LANGUAGE = 2;
const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_SPEED = 0;
const DEFAULT_VOLUME = 0;
const DEFAULT_MODEL_TYPE = 1;
const MAX_TEXT_LENGTH = 300;
const ttsCacheRoot = path.join(uploadsRoot, 'tts');
const inFlightTtsRequests = new Map();

function normalizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeTtsText(text = '') {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

function getTtsConfig() {
  return {
    secretId: String(process.env.TENCENT_SECRET_ID || '').trim(),
    secretKey: String(process.env.TENCENT_SECRET_KEY || '').trim(),
    region: String(process.env.TENCENT_TTS_REGION || process.env.TENCENT_SOE_REGION || DEFAULT_REGION).trim() || DEFAULT_REGION,
    voiceType: normalizeNumber(process.env.TENCENT_TTS_VOICE_TYPE, DEFAULT_VOICE_TYPE),
    primaryLanguage: normalizeNumber(process.env.TENCENT_TTS_PRIMARY_LANGUAGE, DEFAULT_PRIMARY_LANGUAGE),
    sampleRate: normalizeNumber(process.env.TENCENT_TTS_SAMPLE_RATE, DEFAULT_SAMPLE_RATE),
    speed: normalizeNumber(process.env.TENCENT_TTS_SPEED, DEFAULT_SPEED),
    volume: normalizeNumber(process.env.TENCENT_TTS_VOLUME, DEFAULT_VOLUME),
    modelType: normalizeNumber(process.env.TENCENT_TTS_MODEL_TYPE, DEFAULT_MODEL_TYPE),
    codec: String(process.env.TENCENT_TTS_CODEC || DEFAULT_CODEC).trim().toLowerCase() || DEFAULT_CODEC
  };
}

function getAudioMimeType(codec = DEFAULT_CODEC) {
  if (codec === 'wav') {
    return 'audio/wav';
  }
  if (codec === 'pcm') {
    return 'audio/pcm';
  }
  return 'audio/mpeg';
}

function ensureTtsConfig(config = {}) {
  if (!config.secretId || !config.secretKey) {
    const error = new Error('Tencent TTS credentials are missing.');
    error.statusCode = 503;
    throw error;
  }
}

function buildTtsCacheKey({ text = '', config = {} } = {}) {
  const normalizedText = normalizeTtsText(text);
  return crypto
    .createHash('sha1')
    .update(JSON.stringify({
      version: 1,
      text: normalizedText,
      voiceType: config.voiceType,
      primaryLanguage: config.primaryLanguage,
      sampleRate: config.sampleRate,
      codec: config.codec,
      speed: config.speed,
      volume: config.volume,
      modelType: config.modelType
    }))
    .digest('hex');
}

function resolveTtsCacheFile(cacheKey, codec = DEFAULT_CODEC, cacheRoot = ttsCacheRoot) {
  const extension = codec === 'wav' ? 'wav' : codec === 'pcm' ? 'pcm' : 'mp3';
  const folder = cacheKey.slice(0, 2);
  const relativePath = path.posix.join('tts', folder, `${cacheKey}.${extension}`);
  return {
    absolutePath: path.join(cacheRoot, folder, `${cacheKey}.${extension}`),
    relativePath,
    audioUrl: `/api/uploads/${relativePath}`
  };
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    return false;
  }
}

function createTtsClient(config = {}) {
  return new TtsClient({
    credential: {
      secretId: config.secretId,
      secretKey: config.secretKey
    },
    region: config.region,
    profile: {
      httpProfile: {
        endpoint: 'tts.tencentcloudapi.com'
      }
    }
  });
}

async function synthesizeSpeechBuffer({ text = '', config = getTtsConfig(), clientFactory = createTtsClient } = {}) {
  ensureTtsConfig(config);
  const normalizedText = normalizeTtsText(text);

  if (!normalizedText) {
    const error = new Error('TTS text is required.');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    const error = new Error(`TTS text is too long. Max ${MAX_TEXT_LENGTH} characters.`);
    error.statusCode = 400;
    throw error;
  }

  const client = clientFactory(config);
  const response = await client.TextToVoice({
    Text: normalizedText,
    SessionId: crypto.randomUUID(),
    VoiceType: config.voiceType,
    PrimaryLanguage: config.primaryLanguage,
    SampleRate: config.sampleRate,
    Codec: config.codec,
    Speed: config.speed,
    Volume: config.volume,
    ModelType: config.modelType
  });

  const audio = String(response?.Audio || '').trim();
  if (!audio) {
    const error = new Error('Tencent TTS returned no audio.');
    error.statusCode = 502;
    throw error;
  }

  return Buffer.from(audio, 'base64');
}

async function getOrCreateTtsAudioFile({
  text = '',
  config = getTtsConfig(),
  cacheRoot = ttsCacheRoot,
  clientFactory = createTtsClient
} = {}) {
  const normalizedText = normalizeTtsText(text);
  const cacheKey = buildTtsCacheKey({ text: normalizedText, config });
  const resolvedFile = resolveTtsCacheFile(cacheKey, config.codec, cacheRoot);
  const mimeType = getAudioMimeType(config.codec);

  if (await fileExists(resolvedFile.absolutePath)) {
    return {
      ...resolvedFile,
      cacheKey,
      mimeType,
      cacheHit: true
    };
  }

  if (inFlightTtsRequests.has(cacheKey)) {
    return inFlightTtsRequests.get(cacheKey);
  }

  const pending = (async () => {
    await fs.mkdir(path.dirname(resolvedFile.absolutePath), { recursive: true });

    if (await fileExists(resolvedFile.absolutePath)) {
      return {
        ...resolvedFile,
        cacheKey,
        mimeType,
        cacheHit: true
      };
    }

    const audioBuffer = await synthesizeSpeechBuffer({
      text: normalizedText,
      config,
      clientFactory
    });
    await fs.writeFile(resolvedFile.absolutePath, audioBuffer);

    return {
      ...resolvedFile,
      cacheKey,
      mimeType,
      cacheHit: false
    };
  })();

  inFlightTtsRequests.set(cacheKey, pending);

  try {
    return await pending;
  } finally {
    if (inFlightTtsRequests.get(cacheKey) === pending) {
      inFlightTtsRequests.delete(cacheKey);
    }
  }
}

module.exports = {
  buildTtsCacheKey,
  createTtsClient,
  getAudioMimeType,
  getOrCreateTtsAudioFile,
  getTtsConfig,
  normalizeTtsText,
  synthesizeSpeechBuffer
};
