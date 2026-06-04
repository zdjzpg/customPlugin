export function createToneWavBytes(input = {}) {
  const sampleRate = toPositiveInteger(input.sampleRate, 44100, 8000, 96000);
  const durationSeconds = toBoundedNumber(input.durationSeconds, 2, 0.1, 120);
  const frequencyHz = toBoundedNumber(input.frequencyHz, 440, 20, 20000);
  const volume = toBoundedNumber(input.volume, 0.5, 0.01, 1);
  const totalSamples = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const samples = new Int16Array(totalSamples);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const sampleValue = Math.sin(2 * Math.PI * frequencyHz * time) * volume;
    samples[index] = clampPcm16(sampleValue);
  }

  return encodePcm16Wav(samples, sampleRate);
}

export function createWhiteNoiseWavBytes(input = {}) {
  const sampleRate = toPositiveInteger(input.sampleRate, 44100, 8000, 96000);
  const durationSeconds = toBoundedNumber(input.durationSeconds, 5, 0.1, 120);
  const volume = toBoundedNumber(input.volume, 0.35, 0.01, 1);
  const random = typeof input.random === 'function' ? input.random : Math.random;
  const totalSamples = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const samples = new Int16Array(totalSamples);

  for (let index = 0; index < totalSamples; index += 1) {
    const sampleValue = ((random() * 2) - 1) * volume;
    samples[index] = clampPcm16(sampleValue);
  }

  return encodePcm16Wav(samples, sampleRate);
}

export function createObjectUrlFromBytes(bytes, mimeType = 'audio/wav') {
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export function collectWaveformPeaks(channelData, bucketCount = 120) {
  const values = Array.from(channelData || []);
  if (values.length === 0 || bucketCount <= 0) {
    return [];
  }

  const step = Math.max(1, Math.floor(values.length / bucketCount));
  const peaks = [];
  for (let index = 0; index < values.length; index += step) {
    const slice = values.slice(index, Math.min(values.length, index + step));
    const peak = slice.reduce((maxValue, value) => Math.max(maxValue, Math.abs(value)), 0);
    peaks.push(peak);
  }
  return peaks;
}

export function drawWaveform(canvas, peaks = []) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const width = canvas.width || 640;
  const height = canvas.height || 160;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#f4efe5';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#d3c0a6';
  context.fillRect(0, (height / 2) - 1, width, 2);
  context.fillStyle = '#8a5b2b';

  if (peaks.length === 0) {
    return;
  }

  const barWidth = width / peaks.length;
  peaks.forEach((peak, index) => {
    const clampedPeak = Math.max(0, Math.min(1, peak));
    const barHeight = clampedPeak * height * 0.44;
    const x = index * barWidth;
    context.fillRect(x, (height / 2) - barHeight, Math.max(1, barWidth - 1), barHeight * 2);
  });
}

function encodePcm16Wav(samples, sampleRate) {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  samples.forEach((sample, index) => {
    view.setInt16(44 + (index * bytesPerSample), sample, true);
  });

  return new Uint8Array(buffer);
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function clampPcm16(value) {
  const normalized = Math.max(-1, Math.min(1, value));
  return normalized < 0
    ? Math.round(normalized * 0x8000)
    : Math.round(normalized * 0x7fff);
}

function toPositiveInteger(value, fallbackValue, minValue, maxValue) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  return Math.min(Math.max(parsed, minValue), maxValue);
}

function toBoundedNumber(value, fallbackValue, minValue, maxValue) {
  const parsed = Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  return Math.min(Math.max(parsed, minValue), maxValue);
}
