function chooseSpeechVoice(voices = []) {
  if (!Array.isArray(voices) || !voices.length) {
    return null;
  }

  const preferredEnglishVoiceNames = [
    'Google UK English Female',
    'Google UK English Male',
    'Google US English'
  ];
  const englishVoices = voices.filter((voice) => /^en(-|$)/i.test(voice.lang || ''));
  const englishVoice = preferredEnglishVoiceNames
    .map((name) => englishVoices.find((voice) => voice.name === name))
    .find(Boolean) || englishVoices[0];
  if (englishVoice) {
    return englishVoice;
  }

  const defaultVoice = voices.find((voice) => voice.default);
  return defaultVoice || voices[0];
}

function resolveSpeechPlaybackSettings(voices = []) {
  const voice = chooseSpeechVoice(voices);
  return {
    voice,
    lang: String(voice?.lang || '').trim()
  };
}

function loadSpeechVoices(speechSynthesis, timeoutMs = 1200) {
  if (!speechSynthesis?.getVoices) {
    return Promise.resolve([]);
  }

  const existing = speechSynthesis.getVoices();
  if (Array.isArray(existing) && existing.length) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = null;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (speechSynthesis.removeEventListener) {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
      resolve(speechSynthesis.getVoices() || []);
    };

    const handleVoicesChanged = () => {
      const voices = speechSynthesis.getVoices();
      if (Array.isArray(voices) && voices.length) {
        finish();
      }
    };

    if (speechSynthesis.addEventListener) {
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }

    timeoutId = setTimeout(finish, timeoutMs);
  });
}

function createSpeechPlaybackPlan(voices = []) {
  const primary = resolveSpeechPlaybackSettings(voices);
  const fallback = primary.voice && !primary.voice.default
    ? { voice: null, lang: '' }
    : null;

  return {
    primary,
    fallback
  };
}

function getSpeechPlaybackTuning(kind = 'listening') {
  if (kind === 'demo_playing') {
    return { rate: 0.76, pitch: 1 };
  }
  return { rate: 0.68, pitch: 1 };
}

function normalizeRewardConfig(config = {}) {
  const items = (Array.isArray(config.items) ? config.items : [])
    .map((item, index) => ({
      id: item.id || `reward_${index + 1}`,
      name: String(item.name || '').trim(),
      probability: Number(item.probability || 0),
      imageUrl: String(item.imageUrl || '').trim(),
      description: String(item.description || '').trim()
    }))
    .filter((item) => item.name && item.probability > 0);

  return {
    enabled: config.enabled === true,
    openingAnimationEnabled: config.openingAnimationEnabled === true,
    finishAnimationEnabled: config.finishAnimationEnabled === true,
    items
  };
}

function validateRewardConfig(config = {}) {
  if (config.enabled !== true) {
    return {
      isValid: true,
      message: ''
    };
  }

  const items = Array.isArray(config.items) ? config.items : [];
  if (!items.length) {
    return {
      isValid: false,
      message: '开启转盘抽奖后，至少要配置一个礼品。'
    };
  }

  let totalProbability = 0;
  for (const item of items) {
    const name = String(item?.name || '').trim();
    const probability = Number(item?.probability);

    if (!name) {
      return {
        isValid: false,
        message: '请填写每个转盘礼品的名称。'
      };
    }

    if (!Number.isFinite(probability) || probability <= 0) {
      return {
        isValid: false,
        message: '每个转盘礼品的概率必须大于 0。'
      };
    }

    totalProbability += probability;
  }

  if (totalProbability !== 100) {
    return {
      isValid: false,
      message: `转盘奖品概率总和必须等于 100，当前为 ${totalProbability}。`
    };
  }

  return {
    isValid: true,
    message: ''
  };
}

function createDefaultRewardConfig() {
  return {
    enabled: false,
    openingAnimationEnabled: false,
    finishAnimationEnabled: false,
    items: [
      { id: 'reward_1', name: '贴纸', probability: 60, imageUrl: '', description: '' },
      { id: 'reward_2', name: '铅笔', probability: 30, imageUrl: '', description: '' },
      { id: 'reward_3', name: '小礼物', probability: 10, imageUrl: '', description: '' }
    ]
  };
}

function pickRewardItem(config = {}, randomValue = Math.random()) {
  const normalized = normalizeRewardConfig(config);
  const totalWeight = normalized.items.reduce((sum, item) => sum + item.probability, 0);
  if (!normalized.enabled || !normalized.items.length || totalWeight <= 0) {
    return null;
  }

  const roll = Math.max(0, Math.min(0.999999, Number(randomValue) || 0)) * totalWeight;
  let cursor = 0;
  for (const item of normalized.items) {
    cursor += item.probability;
    if (roll < cursor) {
      return item;
    }
  }

  return normalized.items[normalized.items.length - 1] || null;
}

module.exports = {
  chooseSpeechVoice,
  createSpeechPlaybackPlan,
  getSpeechPlaybackTuning,
  loadSpeechVoices,
  resolveSpeechPlaybackSettings,
  createDefaultRewardConfig,
  normalizeRewardConfig,
  pickRewardItem,
  validateRewardConfig
};
