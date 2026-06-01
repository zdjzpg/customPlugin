import { computed, reactive } from 'vue';
import {
  TYPE_META,
  buildWaveBars,
  clone,
  decodeConfig,
  defaultConfig,
  encodeConfig,
  getQuestionDefaults,
  normalizeQuestion,
  safeWord,
  uid
} from '../utils/content';
import {
  createPaper as apiCreatePaper,
  createSubmission as apiCreateSubmission,
  copyPaperById,
  createUser as apiCreateUser,
  drawSubmissionReward as apiDrawSubmissionReward,
  fetchMe,
  fetchPaperById,
  fetchPapers as apiFetchPapers,
  fetchPublicPaperByShareCode,
  fetchPublicSubmissionReport as apiFetchPublicSubmissionReport,
  fetchPaperSubmissions,
  fetchUsers as apiFetchUsers,
  getStoredAuthToken,
  login as apiLogin,
  logout as apiLogout,
  removePaperById,
  resetUserPassword as apiResetUserPassword,
  setStoredAuthToken,
  updatePaper as apiUpdatePaper,
  uploadAnswerAudio,
  updateUserStatus as apiUpdateUserStatus
} from '../api/client';
import studentValidation from '../shared/studentValidation';
import paperValidation from '../shared/paperValidation';
import shareCodeUtils from '../shared/shareCode';
import audioFeedbackUtils from '../shared/audioFeedback';
import paperEditPolicy from '../shared/paperEditPolicy';
import questionAbilitiesUtils from '../shared/questionAbilities';
import questionDifficultyUtils from '../shared/questionDifficulty';
import questionTypeSupport from '../shared/questionTypeSupport';
import reportAbilitiesUtils from '../shared/reportAbilities';
import reportCommentsUtils from '../shared/reportComments';
import studentExperienceUtils from '../shared/studentExperience';
import followInstructionUtils from '../shared/followInstruction';

const { getMissingStudentFields } = studentValidation;
const { getPaperScoreSummary } = paperValidation;
const { normalizeShareCode } = shareCodeUtils;
const { getReadAloudBuddyState, getListeningBuddyState } = audioFeedbackUtils;
const { canEditPaper, getPaperEditBlockedMessage } = paperEditPolicy;
const { REPORT_ABILITIES, getDefaultAbilitiesForType, normalizeQuestionAbilities } = questionAbilitiesUtils;
const { normalizeQuestionDifficulty } = questionDifficultyUtils;
const { evaluateNewQuestionAnswer } = questionTypeSupport;
const { buildWeightedAbilityMap, toAbilityItems } = reportAbilitiesUtils;
const {
  formatReportCommentsInline,
  normalizeReportCommentConfig,
  resolveReportComments,
  validateReportCommentConfig
} = reportCommentsUtils;
const { createSpeechPlaybackPlan, getSpeechPlaybackTuning, loadSpeechVoices, normalizeRewardConfig, validateRewardConfig } = studentExperienceUtils;
const { validateInstructionQuestion } = followInstructionUtils;

function createEmptyEditingPaper() {
  const config = defaultConfig();
  config.examTitle = '新的英语测评卷';
  return config;
}

function getTotalScore(questions) {
  return questions.reduce((sum, item) => sum + Number(item.score || 0), 0);
}

function buildRecordItems(paper, answers) {
  if (!paper) {
    return [];
  }
  return paper.questions.map((question, index) => {
    const answer = answers[question.id] || {};
    const questionAbilities = Array.isArray(question.abilities) && question.abilities.length ? question.abilities : [];
    let correctText = '';
    let studentText = '';
    let gained = 0;

    if (question.type === 'listen_choose_image') {
      const selectedChoice = (question.choices || []).find((item) => item.id === answer.selected);
      const correctChoice = (question.choices || []).find((item) => item.id === question.correctChoiceId);
      correctText = correctChoice?.word || question.answerWord || '未配置';
      studentText = selectedChoice?.word || '未作答';
      gained = answer.selected === question.correctChoiceId ? question.score : 0;
    } else if (question.type === 'listen_follow_instruction') {
      const selectedTarget = (question.targets || []).find((item) => item.id === answer.selected);
      const correctTarget = (question.targets || []).find((item) => item.id === question.correctTargetId);
      if (question.mode === 'drag_place') {
        const objectLabel = question.draggableObject?.label || 'object';
        correctText = `${objectLabel} -> ${correctTarget?.label || question.correctTargetId || '未配置'}`;
        studentText = answer.selected
          ? `${objectLabel} -> ${selectedTarget?.label || answer.selected}`
          : '未作答';
      } else {
        correctText = correctTarget?.label || question.correctTargetId || '未配置';
        studentText = selectedTarget?.label || answer.selected || '未作答';
      }
      gained = answer.selected === question.correctTargetId ? question.score : 0;
    } else if (question.type === 'look_choose_word') {
      correctText = question.targetWord;
      studentText = answer.selected || '未作答';
      gained = answer.selected === question.targetWord ? question.score : 0;
    } else if (question.type === 'sentence_sort') {
      correctText = question.sentence;
      studentText = (answer.order || []).join(' ') || '未完成';
      gained = studentText === question.sentence ? question.score : 0;
    } else if (question.type === 'read_aloud') {
      correctText = question.phrase;
      studentText = answer.transcript || '未识别';
      gained = Math.round(((answer.autoScore || 0) / 100) * question.score);
    } else if (question.type === 'listen_answer_question' || question.type === 'listen_choose_letter' || question.type === 'read_sentence_with_image' || question.type === 'match_image_word') {
      const result = evaluateNewQuestionAnswer(question, answer) || {};
      correctText = result.correctText || '未配置';
      studentText = result.studentText || '未作答';
      gained = Number(result.gained || 0);
    } else {
      correctText = question.answerWord;
      studentText = answer.input || '未作答';
      gained = safeWord(answer.input) === safeWord(question.answerWord) ? question.score : 0;
    }

    return {
      index: index + 1,
      meta: {
        ...(TYPE_META[question.type] || { label: question.type, ability: '-', icon: '📝' }),
        ability: questionAbilities.join(' / ') || '-'
      },
      questionType: question.type,
      abilities: questionAbilities,
      prompt: question.prompt,
      correctText,
      studentText,
      audioPath: answer.audioPath || '',
      audioUrl: answer.audioUrl || '',
      audioMimeType: answer.audioMimeType || '',
      gained,
      total: question.score,
      status: gained >= question.score * 0.7 ? '通过' : '待加强'
    };
  });
}

const state = reactive({
  authToken: getStoredAuthToken(),
  authUser: null,
  authReady: false,
  papers: [],
  paperFilters: {
    keyword: '',
    questionType: ''
  },
  paperPagination: { page: 1, pageSize: 10, total: 0 },
  users: [],
  submissions: [],
  editingPaperId: null,
  editingPaper: createEmptyEditingPaper(),
  config: null,
  currentPaperId: null,
  currentPaperShareCode: '',
  currentPaper: null,
  paper: null,
  currentSubmissionId: '',
  reportToken: '',
  student: { name: '', phone: '', age: '', grade: '', school: '' },
  answers: {},
  audioUi: {},
  currentIndex: 0,
  report: null,
  reportGeneratingVisible: false,
  studentNotice: {
    visible: false,
    title: '',
    message: '',
    emoji: '🐥',
    actionLabel: '知道啦'
  },
  openingAnimationVisible: false,
  finishAnimationVisible: false,
  rewardWheelVisible: false,
  rewardDrawing: false,
  rewardResult: null,
  playbackOverlay: {
    visible: false,
    text: '',
    kind: 'listening'
  },
  waveBars: buildWaveBars(),
  sessionStarted: false,
  loading: false,
  apiError: ''
});

state.config = state.editingPaper;
state.paper = state.currentPaper;

function setError(error) {
  state.apiError = error ? error.message || String(error) : '';
}

function showStudentNotice({
  title = '',
  message = '',
  emoji = '🐥',
  actionLabel = '知道啦'
} = {}) {
  state.studentNotice = {
    visible: true,
    title,
    message,
    emoji,
    actionLabel
  };
}

function closeStudentNotice() {
  state.studentNotice.visible = false;
}

function ensureAnswer(questionId) {
  if (!state.answers[questionId]) {
    state.answers[questionId] = {};
  }
  return state.answers[questionId];
}

function getCurrentQuestion() {
  return state.currentPaper ? state.currentPaper.questions[state.currentIndex] : null;
}

function syncLegacyEditingConfig() {
  state.config = state.editingPaper;
}

function syncLegacyCurrentPaper() {
  state.paper = state.currentPaper;
}

const MICROPHONE_QUESTION_TYPES = new Set([
  'read_aloud',
  'listen_answer_question',
  'read_sentence_with_image'
]);

const activeAnswerAudioRecordings = new Map();
const pendingAnswerAudioUploads = new Map();
const activeSpeechRecognitions = new Map();
const preparedAnswerAudioInputs = new Map();

function createAudioUiState() {
  return {
    isPlaying: false,
    isRecording: false,
    justScored: false,
    isPreparingMic: false,
    isMicReady: false
  };
}

function ensureAudioUi(questionId) {
  if (!questionId) {
    return createAudioUiState();
  }
  if (!state.audioUi[questionId]) {
    state.audioUi[questionId] = createAudioUiState();
  }
  return state.audioUi[questionId];
}

function isMicrophoneQuestionType(type) {
  return MICROPHONE_QUESTION_TYPES.has(String(type || ''));
}

function pickAnswerAudioMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return '';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];
  return candidates.find((item) => MediaRecorder.isTypeSupported(item)) || '';
}

function getAnswerAudioConstraints() {
  return {
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };
}

function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => track.stop());
}

function playRecordingStartCue() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.0001;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  const now = audioContext.currentTime;
  gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  oscillator.start(now);
  oscillator.stop(now + 0.18);
  oscillator.onended = () => {
    oscillator.disconnect();
    gainNode.disconnect();
    audioContext.close?.();
  };
}

function clearPreparedAnswerAudio(questionId) {
  if (!questionId) {
    return;
  }
  const prepared = preparedAnswerAudioInputs.get(questionId);
  preparedAnswerAudioInputs.delete(questionId);
  stopMediaStream(prepared?.stream);
  const audioUi = ensureAudioUi(questionId);
  audioUi.isPreparingMic = false;
  audioUi.isMicReady = false;
}

function clearAllPreparedAnswerAudio() {
  Array.from(preparedAnswerAudioInputs.keys()).forEach((questionId) => {
    clearPreparedAnswerAudio(questionId);
  });
}

async function ensureAnswerAudioInput(questionId, questionType, { markPreparing = false } = {}) {
  if (!isMicrophoneQuestionType(questionType) || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    return null;
  }

  const audioUi = ensureAudioUi(questionId);
  const existing = preparedAnswerAudioInputs.get(questionId);
  if (existing?.stream) {
    audioUi.isPreparingMic = false;
    audioUi.isMicReady = true;
    return existing.stream;
  }

  if (markPreparing) {
    audioUi.isPreparingMic = true;
    audioUi.isMicReady = false;
  }

  if (existing?.promise) {
    return existing.promise;
  }

  const promise = navigator.mediaDevices.getUserMedia(getAnswerAudioConstraints())
    .then((stream) => {
      preparedAnswerAudioInputs.set(questionId, { stream });
      audioUi.isPreparingMic = false;
      audioUi.isMicReady = true;
      return stream;
    })
    .catch(() => {
      preparedAnswerAudioInputs.delete(questionId);
      audioUi.isPreparingMic = false;
      audioUi.isMicReady = false;
      return null;
    });

  preparedAnswerAudioInputs.set(questionId, { promise });
  return promise;
}

function prewarmAnswerAudioRecorder(questionId, questionType) {
  return ensureAnswerAudioInput(questionId, questionType, { markPreparing: true });
}

function syncPreparedMicrophoneWithCurrentQuestion() {
  const currentQuestion = getCurrentQuestion();
  const currentQuestionId = currentQuestion?.id || '';

  Array.from(preparedAnswerAudioInputs.keys()).forEach((questionId) => {
    if (questionId !== currentQuestionId) {
      clearPreparedAnswerAudio(questionId);
    }
  });

  Object.keys(state.audioUi).forEach((questionId) => {
    if (questionId !== currentQuestionId) {
      state.audioUi[questionId].isPreparingMic = false;
      state.audioUi[questionId].isMicReady = false;
    }
  });

  if (!state.sessionStarted || !currentQuestion || !isMicrophoneQuestionType(currentQuestion.type)) {
    return;
  }

  void prewarmAnswerAudioRecorder(currentQuestion.id, currentQuestion.type);
}

async function startAnswerAudioRecording(questionId, questionType) {
  if (!isMicrophoneQuestionType(questionType) || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    return null;
  }

  try {
    const audioUi = ensureAudioUi(questionId);
    const stream = await ensureAnswerAudioInput(questionId, questionType);
    if (!stream) {
      return null;
    }
    preparedAnswerAudioInputs.delete(questionId);
    audioUi.isPreparingMic = false;
    audioUi.isMicReady = false;
    const mimeType = pickAnswerAudioMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks = [];
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = AudioContextCtor ? new AudioContextCtor() : null;
    const analyser = audioContext ? audioContext.createAnalyser() : null;
    const source = audioContext ? audioContext.createMediaStreamSource(stream) : null;
    const levelBuffer = analyser ? new Float32Array(analyser.fftSize) : null;
    let maxLevel = 0;
    let levelFrameId = 0;

    if (source && analyser && levelBuffer) {
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      const sampleLevel = () => {
        analyser.getFloatTimeDomainData(levelBuffer);
        let framePeak = 0;
        for (let index = 0; index < levelBuffer.length; index += 1) {
          framePeak = Math.max(framePeak, Math.abs(levelBuffer[index]));
        }
        maxLevel = Math.max(maxLevel, framePeak);
        levelFrameId = window.requestAnimationFrame(sampleLevel);
      };
      audioContext.resume?.();
      sampleLevel();
    }

    const finished = new Promise((resolve) => {
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onerror = () => {
        if (levelFrameId) {
          window.cancelAnimationFrame(levelFrameId);
        }
        source?.disconnect?.();
        analyser?.disconnect?.();
        audioContext?.close?.();
        stopMediaStream(stream);
        resolve(null);
      };
      recorder.onstop = () => {
        if (levelFrameId) {
          window.cancelAnimationFrame(levelFrameId);
        }
        source?.disconnect?.();
        analyser?.disconnect?.();
        audioContext?.close?.();
        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: blobType });
        stopMediaStream(stream);
        resolve(blob.size > 0 ? { blob, audioMimeType: blobType, maxLevel } : null);
      };
    });

    recorder.start();
    activeAnswerAudioRecordings.set(questionId, { recorder, finished });
    return true;
  } catch (error) {
    return null;
  }
}

function stopAnswerAudioRecording(questionId) {
  const activeRecording = activeAnswerAudioRecordings.get(questionId);
  if (!activeRecording) {
    return Promise.resolve(null);
  }

  activeAnswerAudioRecordings.delete(questionId);
  if (activeRecording.recorder.state !== 'inactive') {
    activeRecording.recorder.stop();
  }
  return activeRecording.finished;
}

function trackAnswerAudioUpload(questionId, promise) {
  pendingAnswerAudioUploads.set(questionId, promise);
  promise.finally(() => {
    if (pendingAnswerAudioUploads.get(questionId) === promise) {
      pendingAnswerAudioUploads.delete(questionId);
    }
  });
  return promise;
}

function stopSpeechRecognition(questionId) {
  const recognition = activeSpeechRecognitions.get(questionId);
  if (!recognition) {
    return false;
  }
  activeSpeechRecognitions.delete(questionId);
  recognition.__manualStop = true;
  recognition.stop();
  return true;
}

async function uploadAnswerAudioForQuestion(questionId, questionType) {
  const recording = await stopAnswerAudioRecording(questionId);
  if (!recording?.blob) {
    return null;
  }

  if (Number(recording.maxLevel || 0) < 0.01) {
    showStudentNotice({
      title: '咦，我没有听到声音',
      message: '请靠近一点麦克风，再大声读一遍，我们马上继续闯关。',
      emoji: '🐥',
      actionLabel: '重新开始'
    });
    return null;
  }

  try {
    const uploaded = await uploadAnswerAudio(recording.blob, { questionId, questionType });
    const answer = ensureAnswer(questionId);
    answer.audioPath = uploaded.audioPath || '';
    answer.audioUrl = uploaded.audioUrl || '';
    answer.audioMimeType = uploaded.audioMimeType || recording.audioMimeType || recording.blob.type || '';
    return uploaded;
  } catch (error) {
    showStudentNotice({
      title: '录音没存好，再试一次吧',
      message: '刚才的声音没有顺利保存，我们再录一遍，就能继续完成这一关。',
      emoji: '🦄',
      actionLabel: '再录一次'
    });
    return null;
  }
}

async function flushPendingAnswerAudioUploads() {
  const pending = Array.from(pendingAnswerAudioUploads.values());
  if (!pending.length) {
    return;
  }
  await Promise.allSettled(pending);
}

function getSavePayload(editingPaper) {
  return {
    examTitle: editingPaper.examTitle,
    themeNote: editingPaper.themeNote,
    welcomeSpeech: editingPaper.welcomeSpeech,
    rewardConfig: clone(editingPaper.rewardConfig || {}),
    commentConfig: clone(editingPaper.commentConfig || {}),
    questions: clone(editingPaper.questions)
  };
}

function setAuthSession({ token, user }) {
  state.authToken = token || '';
  state.authUser = user || null;
  state.authReady = true;
  setStoredAuthToken(token || '');
}

const audioScoreTimers = new Map();
let activeSpeechToken = 0;
let playbackFallbackTimer = null;
let activePlaybackAudio = null;

let storeApi;

export function useExamStore() {
  if (storeApi) {
    return storeApi;
  }

  const editingTotalScore = computed(() => getTotalScore(state.editingPaper.questions));
  const editingScoreSummary = computed(() => getPaperScoreSummary(state.editingPaper.questions));
  const editingCommentValidation = computed(() => validateReportCommentConfig(state.editingPaper.commentConfig || {}));
  const editingRewardValidation = computed(() => validateRewardConfig(state.editingPaper.rewardConfig || {}));
  const editingInstructionValidation = computed(() => {
    const questions = Array.isArray(state.editingPaper.questions) ? state.editingPaper.questions : [];
    for (let index = 0; index < questions.length; index += 1) {
      const result = validateInstructionQuestion(questions[index], index);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true, message: '' };
  });
  const totalScore = computed(() => getTotalScore((state.config?.questions) || []));
  const currentQuestion = computed(() => getCurrentQuestion());
  const currentAnswer = computed(() => {
    const question = getCurrentQuestion();
    return question ? (state.answers[question.id] || {}) : {};
  });
  const progressPercent = computed(() => {
    if (!state.currentPaper || !state.currentPaper.questions.length) {
      return 0;
    }
    return Math.round((state.currentIndex / state.currentPaper.questions.length) * 100);
  });
  const recordItems = computed(() => buildRecordItems(state.currentPaper, state.answers));
  const configuredPapers = computed(() => state.papers.map((paper) => ({
    ...paper,
    questionCount: paper.questions?.length || paper.questionCount || 0,
    totalScore: Number(paper.totalScore || getTotalScore(paper.questions || []))
  })));
  const paperPagination = computed(() => state.paperPagination);
  const paperTypeOptions = computed(() => {
    const set = new Set();
    state.papers.forEach((paper) => {
      (paper.questions || []).forEach((question) => set.add(question.type));
    });
    return Array.from(set);
  });
  const submissionsByPaper = computed(() => {
    const grouped = {};
    state.submissions.forEach((item) => {
      if (!grouped[item.paperId]) {
        grouped[item.paperId] = [];
      }
      grouped[item.paperId].push(item);
    });
    return grouped;
  });
  const isAuthenticated = computed(() => Boolean(state.authUser));
  const isAdmin = computed(() => state.authUser?.role === 'ADMIN');
  const missingStudentFields = computed(() => getMissingStudentFields(state.student));

  function buildPaperFetchParams(filters = {}) {
    return {
      keyword: typeof filters.keyword === 'string' ? filters.keyword : state.paperFilters.keyword,
      questionType: typeof filters.questionType === 'string' ? filters.questionType : state.paperFilters.questionType,
      page: Number(filters.page || state.paperPagination.page || 1),
      pageSize: Number(filters.pageSize || state.paperPagination.pageSize || 10)
    };
  }

  async function fetchPapers(filters = {}) {
    state.loading = true;
    try {
      const params = buildPaperFetchParams(filters);
      const result = await apiFetchPapers(params);
      state.papers = result.items || [];
      state.paperFilters = {
        keyword: params.keyword || '',
        questionType: params.questionType || ''
      };
      state.paperPagination = {
        page: Number(result.page || params.page || state.paperPagination.page || 1),
        pageSize: Number(result.pageSize || params.pageSize || state.paperPagination.pageSize || 10),
        total: Number(result.total || 0)
      };
      setError(null);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      state.loading = false;
    }
  }

  async function fetchUsersInternal() {
    const result = await apiFetchUsers();
    state.users = result.items || [];
  }

  function stopActivePlaybackAudio() {
    if (!activePlaybackAudio) {
      return;
    }
    try {
      activePlaybackAudio.pause();
      activePlaybackAudio.src = '';
    } catch (error) {
      // Ignore cleanup failures from abandoned audio elements.
    }
    activePlaybackAudio = null;
  }

  function stopSpeakingVisuals() {
    if (playbackFallbackTimer) {
      window.clearTimeout(playbackFallbackTimer);
      playbackFallbackTimer = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    stopActivePlaybackAudio();
    Object.keys(state.audioUi).forEach((questionId) => {
      ensureAudioUi(questionId).isPlaying = false;
    });
    state.playbackOverlay.visible = false;
  }

  function flashScored(questionId) {
    const audioUi = ensureAudioUi(questionId);
    audioUi.isRecording = false;
    audioUi.justScored = true;
    if (audioScoreTimers.has(questionId)) {
      window.clearTimeout(audioScoreTimers.get(questionId));
    }
    const timerId = window.setTimeout(() => {
      ensureAudioUi(questionId).justScored = false;
      audioScoreTimers.delete(questionId);
    }, 1600);
    audioScoreTimers.set(questionId, timerId);
  }

  function applySpeechRecognitionFallback(questionId, targetText = '', question = null) {
    const answer = ensureAnswer(questionId);
    answer.transcript = answer.transcript || targetText || question?.phrase || question?.sentenceText || '';
    answer.autoScore = 100;
    flashScored(questionId);
  }

  function normalizeSpeakPayload(payload) {
    if (typeof payload === 'string') {
      return { text: payload, questionId: '', kind: 'listening' };
    }
    return {
      text: payload?.text || '',
      questionId: payload?.questionId || '',
      kind: payload?.kind || 'listening'
    };
  }

  function buildTtsAudioUrl(text) {
    const search = new URLSearchParams({ text: String(text || '') });
    return `/api/tts?${search.toString()}`;
  }

  function getTtsPlaybackRate(kind = 'listening') {
    if (kind === 'demo_playing') {
      return 0.96;
    }
    return 1;
  }

  function playWithBrowserSpeechFallback({ text, kind = 'listening', speechToken }) {
    if (!window.speechSynthesis) {
      stopSpeakingVisuals();
      return;
    }

    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const playbackPlan = createSpeechPlaybackPlan(voices);
    const playbackTuning = getSpeechPlaybackTuning(kind);
    let attemptId = 0;
    let started = false;
    let fallbackKickoffTimer = null;
    const safeTextLength = Math.max(1, String(text || '').length);
    const fallbackDuration = Math.max(2200, Math.min(9000, safeTextLength * 240 + 1800));
    playbackFallbackTimer = window.setTimeout(() => {
      if (speechToken === activeSpeechToken) {
        stopSpeakingVisuals();
      }
    }, fallbackDuration);

    const speakWithSettings = (settings, isFallback = false) => {
      attemptId += 1;
      const currentAttempt = attemptId;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = playbackTuning.rate;
      utter.pitch = playbackTuning.pitch;
      if (settings.lang) {
        utter.lang = settings.lang;
      }
      if (settings.voice) {
        utter.voice = settings.voice;
      }
      utter.onstart = () => {
        if (speechToken !== activeSpeechToken || currentAttempt !== attemptId) {
          return;
        }
        started = true;
        if (fallbackKickoffTimer) {
          window.clearTimeout(fallbackKickoffTimer);
          fallbackKickoffTimer = null;
        }
      };
      utter.onend = () => {
        if (speechToken === activeSpeechToken && currentAttempt === attemptId) {
          stopSpeakingVisuals();
        }
      };
      utter.onerror = () => {
        if (speechToken !== activeSpeechToken || currentAttempt !== attemptId) {
          return;
        }
        if (!isFallback && playbackPlan.fallback) {
          window.speechSynthesis.cancel();
          speakWithSettings(playbackPlan.fallback, true);
          return;
        }
        stopSpeakingVisuals();
      };
      if (!isFallback && playbackPlan.fallback) {
        fallbackKickoffTimer = window.setTimeout(() => {
          if (speechToken !== activeSpeechToken || currentAttempt !== attemptId || started) {
            return;
          }
          window.speechSynthesis.cancel();
          speakWithSettings(playbackPlan.fallback, true);
        }, 900);
      }
      if (typeof window.speechSynthesis.resume === 'function') {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utter);
    };

    speakWithSettings(playbackPlan.primary);
  }

  function playWithTencentTts({ text, kind = 'listening', speechToken }) {
    if (typeof Audio === 'undefined') {
      playWithBrowserSpeechFallback({ text, kind, speechToken });
      return;
    }

    let fallbackTriggered = false;
    const audio = new Audio(buildTtsAudioUrl(text));
    audio.preload = 'auto';
    audio.playbackRate = getTtsPlaybackRate(kind);
    activePlaybackAudio = audio;

    const fallbackToBrowserSpeech = () => {
      if (fallbackTriggered || speechToken !== activeSpeechToken) {
        return;
      }
      fallbackTriggered = true;
      if (activePlaybackAudio === audio) {
        activePlaybackAudio = null;
      }
      try {
        audio.pause();
        audio.src = '';
      } catch (error) {
        // Ignore cleanup failures from rejected playback.
      }
      playWithBrowserSpeechFallback({ text, kind, speechToken });
    };

    audio.onended = () => {
      if (speechToken === activeSpeechToken && activePlaybackAudio === audio) {
        activePlaybackAudio = null;
        stopSpeakingVisuals();
      }
    };
    audio.onerror = fallbackToBrowserSpeech;

    const playback = audio.play();
    if (playback?.catch) {
      playback.catch(() => {
        fallbackToBrowserSpeech();
      });
    }
  }

  storeApi = {
    state,
    TYPE_META,
    editingTotalScore,
    editingScoreSummary,
    editingCommentValidation,
    editingRewardValidation,
    editingInstructionValidation,
    totalScore,
    currentQuestion,
    currentAnswer,
    progressPercent,
    recordItems,
    configuredPapers,
    paperPagination,
    paperTypeOptions,
    submissionsByPaper,
    isAuthenticated,
    isAdmin,
    missingStudentFields,
    getQuestionAudioState(questionId) {
      const audioUi = ensureAudioUi(questionId);
      return {
        ...audioUi,
        readAloudState: getReadAloudBuddyState({
          isDemoPlaying: audioUi.isPlaying,
          isRecording: audioUi.isRecording,
          hasScore: audioUi.justScored
        }),
        listeningState: getListeningBuddyState({
          isPlaying: audioUi.isPlaying
        })
      };
    },
    async ensureAuthLoaded() {
      if (state.authReady) {
        return state.authUser;
      }
      if (!state.authToken) {
        state.authReady = true;
        state.authUser = null;
        return null;
      }
      try {
        const result = await fetchMe();
        setAuthSession({ token: state.authToken, user: result.user });
        setError(null);
        return state.authUser;
      } catch (error) {
        setAuthSession({ token: '', user: null });
        setError(null);
        return null;
      }
    },
    async login(username, password) {
      state.loading = true;
      try {
        const result = await apiLogin({ username, password });
        setAuthSession(result);
        setError(null);
        return result.user;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async logout() {
      state.loading = true;
      try {
        if (state.authToken) {
          await apiLogout().catch(() => null);
        }
      } finally {
        setAuthSession({ token: '', user: null });
        state.papers = [];
        state.users = [];
        state.submissions = [];
        state.loading = false;
      }
    },
    async fetchUsers() {
      state.loading = true;
      try {
        await fetchUsersInternal();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async createUser(payload) {
      state.loading = true;
      try {
        await apiCreateUser(payload);
        await fetchUsersInternal();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async resetUserPassword(userId, password) {
      state.loading = true;
      try {
        await apiResetUserPassword(userId, password);
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async updateUserStatus(userId, status) {
      state.loading = true;
      try {
        await apiUpdateUserStatus(userId, status);
        await fetchUsersInternal();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async fetchPapers(filters = {}) {
      await fetchPapers(filters);
    },
    createNewPaper() {
      state.editingPaperId = null;
      state.editingPaper = createEmptyEditingPaper();
      syncLegacyEditingConfig();
    },
    async loadPaperForEdit(paperId) {
      state.loading = true;
      try {
        const paper = await fetchPaperById(paperId);
        if (!canEditPaper(paper)) {
          throw new Error(getPaperEditBlockedMessage());
        }
        state.editingPaperId = paper.id;
        state.editingPaper = {
          examTitle: paper.examTitle,
          themeNote: paper.themeNote,
          welcomeSpeech: paper.welcomeSpeech,
          shareCode: paper.shareCode,
          rewardConfig: normalizeRewardConfig(paper.rewardConfig || {}),
          commentConfig: normalizeReportCommentConfig(paper.commentConfig || {}),
          questions: clone(paper.questions).map((question) => ({
            ...question,
            abilities: normalizeQuestionAbilities(question.abilities, getDefaultAbilitiesForType(question.type)),
            difficulty: normalizeQuestionDifficulty(question.difficulty)
          }))
        };
        syncLegacyEditingConfig();
        setError(null);
        return true;
      } catch (error) {
        setError(error);
        state.editingPaperId = null;
        state.editingPaper = createEmptyEditingPaper();
        syncLegacyEditingConfig();
        return false;
      } finally {
        state.loading = false;
      }
    },
    async saveEditingPaper() {
      state.loading = true;
      try {
        state.editingPaper.questions = state.editingPaper.questions.map((question) => ({
          ...question,
          abilities: normalizeQuestionAbilities(question.abilities, getDefaultAbilitiesForType(question.type)),
          difficulty: normalizeQuestionDifficulty(question.difficulty)
        }));
        if (state.editingPaperId) {
          const saved = await apiUpdatePaper(state.editingPaperId, getSavePayload(state.editingPaper));
          state.editingPaper.shareCode = saved.shareCode || state.editingPaper.shareCode;
        } else {
          const saved = await apiCreatePaper(getSavePayload(state.editingPaper));
          state.editingPaperId = saved.id;
          state.editingPaper.shareCode = saved.shareCode || '';
        }
        await fetchPapers();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async removePaper(paperId) {
      state.loading = true;
      try {
        await removePaperById(paperId);
        const shouldFallbackPage = state.papers.length === 1 && Number(state.paperPagination.page || 1) > 1;
        await fetchPapers({
          page: shouldFallbackPage ? Number(state.paperPagination.page || 1) - 1 : state.paperPagination.page
        });
        if (state.currentPaperId === paperId) {
          state.currentPaperId = null;
          state.currentPaperShareCode = '';
          state.currentPaper = null;
          syncLegacyCurrentPaper();
        }
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async copyPaper(paperId) {
      state.loading = true;
      try {
        await copyPaperById(paperId);
        await fetchPapers();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    addQuestion(type) {
      state.editingPaper.questions.push(getQuestionDefaults(type));
    },
    duplicateQuestion(id) {
      const source = state.editingPaper.questions.find((item) => item.id === id);
      const duplicate = clone(source);
      duplicate.id = uid('q');
      state.editingPaper.questions.push(duplicate);
    },
    removeQuestion(id) {
      state.editingPaper.questions = state.editingPaper.questions.filter((item) => item.id !== id);
    },
    async preparePaperSession(shareCode) {
      state.loading = true;
      try {
        activeSpeechRecognitions.clear();
        activeAnswerAudioRecordings.clear();
        pendingAnswerAudioUploads.clear();
        clearAllPreparedAnswerAudio();
        const normalizedShareCode = normalizeShareCode(shareCode);
        const rawPaper = await fetchPublicPaperByShareCode(normalizedShareCode);
        state.currentPaperId = rawPaper.id;
        state.currentPaperShareCode = rawPaper.shareCode || normalizedShareCode;
        state.currentPaper = {
          ...rawPaper,
          rewardConfig: normalizeRewardConfig(rawPaper.rewardConfig || {}),
          commentConfig: normalizeReportCommentConfig(rawPaper.commentConfig || {}),
          questions: rawPaper.questions.map(normalizeQuestion)
        };
        syncLegacyCurrentPaper();
        state.student = { name: '', phone: '', age: '', grade: '', school: '' };
        state.answers = {};
        state.audioUi = {};
        state.currentIndex = 0;
        state.currentSubmissionId = '';
        state.reportToken = '';
        state.report = null;
        state.reportGeneratingVisible = false;
        closeStudentNotice();
        state.openingAnimationVisible = normalizeRewardConfig(rawPaper.rewardConfig || {}).openingAnimationEnabled;
        state.finishAnimationVisible = false;
        state.rewardWheelVisible = false;
        state.rewardDrawing = false;
        state.rewardResult = null;
        state.playbackOverlay.visible = false;
        state.waveBars = buildWaveBars();
        state.sessionStarted = false;
        setError(null);
        return true;
      } catch (error) {
        setError(error);
        state.currentPaperId = null;
        state.currentPaperShareCode = '';
        state.currentPaper = null;
        syncLegacyCurrentPaper();
        return false;
      } finally {
        state.loading = false;
      }
    },
    async loadPublicSubmissionReport(shareCode, reportToken) {
      state.loading = true;
      try {
        activeSpeechRecognitions.clear();
        activeAnswerAudioRecordings.clear();
        pendingAnswerAudioUploads.clear();
        clearAllPreparedAnswerAudio();
        const normalizedShareCode = normalizeShareCode(shareCode);
        const result = await apiFetchPublicSubmissionReport(normalizedShareCode, reportToken);
        state.currentPaperId = result.paper?.id || '';
        state.currentPaperShareCode = result.paper?.shareCode || normalizedShareCode;
        state.currentPaper = {
          ...(result.paper || {}),
          rewardConfig: normalizeRewardConfig(result.paper?.rewardConfig || {}),
          commentConfig: normalizeReportCommentConfig(result.paper?.commentConfig || {}),
          questions: Array.isArray(result.paper?.questions) ? result.paper.questions.map(normalizeQuestion) : []
        };
        syncLegacyCurrentPaper();
        state.student = { ...(result.student || { name: '', phone: '', age: '', grade: '', school: '' }) };
        state.answers = {};
        state.audioUi = {};
        state.currentIndex = 0;
        state.currentSubmissionId = result.id || '';
        state.reportToken = result.reportToken || reportToken || '';
        state.report = result.report || null;
        state.reportGeneratingVisible = false;
        closeStudentNotice();
        state.openingAnimationVisible = false;
        state.finishAnimationVisible = false;
        state.rewardWheelVisible = false;
        state.rewardDrawing = false;
        state.rewardResult = result.reward || null;
        state.playbackOverlay.visible = false;
        state.waveBars = buildWaveBars();
        state.sessionStarted = false;
        setError(null);
        return true;
      } catch (error) {
        setError(error);
        return false;
      } finally {
        state.loading = false;
      }
    },
    beginPaperSession() {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        void loadSpeechVoices(window.speechSynthesis);
      }
      activeSpeechRecognitions.clear();
      activeAnswerAudioRecordings.clear();
      pendingAnswerAudioUploads.clear();
      clearAllPreparedAnswerAudio();
      state.sessionStarted = true;
      state.currentIndex = 0;
      state.answers = {};
      state.audioUi = {};
      state.currentSubmissionId = '';
      state.reportToken = '';
      state.openingAnimationVisible = false;
      state.report = null;
      state.reportGeneratingVisible = false;
      closeStudentNotice();
      state.finishAnimationVisible = false;
      state.rewardWheelVisible = false;
      state.rewardDrawing = false;
      state.rewardResult = null;
      state.playbackOverlay.visible = false;
      state.waveBars = buildWaveBars();
      syncLegacyCurrentPaper();
      syncPreparedMicrophoneWithCurrentQuestion();
    },
    previousQuestion() {
      if (state.currentIndex > 0) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        stopSpeechRecognition(getCurrentQuestion()?.id);
        stopSpeakingVisuals();
        state.currentIndex -= 1;
        state.waveBars = buildWaveBars();
        syncPreparedMicrophoneWithCurrentQuestion();
      }
    },
    async nextQuestion() {
      if (state.currentIndex < state.currentPaper.questions.length - 1) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        stopSpeakingVisuals();
        state.currentIndex += 1;
        state.waveBars = buildWaveBars();
        syncPreparedMicrophoneWithCurrentQuestion();
        return false;
      }

      await flushPendingAnswerAudioUploads();

      const details = buildRecordItems(state.currentPaper, state.answers);
      const abilityMap = buildWeightedAbilityMap(details);
      let total = 0;
      let totalPossible = 0;

      details.forEach((detail) => {
        total += detail.gained;
        totalPossible += detail.total;
      });

      const reportComments = resolveReportComments(state.currentPaper?.commentConfig || {}, total);

      const draftReport = {
        total,
        totalPossible,
        percent: totalPossible ? Math.round((total / totalPossible) * 100) : 0,
        abilityMap,
        abilityItems: toAbilityItems(abilityMap, REPORT_ABILITIES),
        comments: reportComments,
        details: details.map((detail) => ({
          label: detail.meta.label,
          gained: detail.gained,
          total: detail.total,
          status: detail.status,
          note: `学生作答：${detail.studentText}；标准答案：${detail.correctText}`
        }))
      };

      state.reportGeneratingVisible = true;
      try {
        const submission = await apiCreateSubmission(state.currentPaperId, {
          student: state.student,
          report: draftReport,
          records: details
        });
        state.currentSubmissionId = submission.id || '';
        state.reportToken = submission.reportToken || '';
        state.report = submission.report || draftReport;
        state.finishAnimationVisible = state.currentPaper?.rewardConfig?.finishAnimationEnabled === true;
        state.rewardWheelVisible = !state.finishAnimationVisible && state.currentPaper?.rewardConfig?.enabled === true;
        state.rewardResult = null;
        setError(null);
      } catch (error) {
        state.report = null;
        setError(error);
        throw error;
      } finally {
        state.reportGeneratingVisible = false;
      }
      return true;
    },
    async loadSubmissionsByPaper(paperId, studentKeyword = '') {
      state.loading = true;
      try {
        const result = await fetchPaperSubmissions(paperId, { studentKeyword });
        state.submissions = result.items || [];
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    closeOpeningAnimation() {
      state.openingAnimationVisible = false;
    },
    closeStudentNotice,
    completeFinishAnimation() {
      state.finishAnimationVisible = false;
      state.rewardWheelVisible = state.currentPaper?.rewardConfig?.enabled === true;
    },
    closeRewardWheel() {
      state.rewardWheelVisible = false;
    },
    async drawCurrentReward() {
      if (!state.currentSubmissionId || state.rewardDrawing || state.rewardResult) {
        return state.rewardResult;
      }
      state.rewardDrawing = true;
      try {
        const result = await apiDrawSubmissionReward(state.currentSubmissionId);
        state.rewardResult = result.reward || null;
        return state.rewardResult;
      } finally {
        state.rewardDrawing = false;
      }
    },
    selectOption(value) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.selected = value;
    },
    addToken(token) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.order = answer.order || [];
      if (answer.order.length < getCurrentQuestion().tokens.length) {
        answer.order.push(token);
      }
    },
    removeSlot(index) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.order = answer.order || [];
      if (answer.order[index]) {
        answer.order.splice(index, 1);
      }
    },
    updateSpelling(value) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.input = value;
    },
    fillAnswer(value) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.input = value;
    },
    toggleLetterSelection(letter) {
      const question = getCurrentQuestion();
      const answer = ensureAnswer(question.id);
      if (question.requireBothCases) {
        answer.selectedLetters = answer.selectedLetters || [];
        if (answer.selectedLetters.includes(letter)) {
          answer.selectedLetters = answer.selectedLetters.filter((item) => item !== letter);
        } else {
          answer.selectedLetters.push(letter);
        }
        return;
      }
      answer.selectedLetters = [letter];
    },
    setLetterSlot({ slotIndex, letter }) {
      const question = getCurrentQuestion();
      const answer = ensureAnswer(question.id);
      const slotCount = question.requireBothCases ? 2 : 1;
      const next = Array.from({ length: slotCount }, (_, index) => answer.selectedLetters?.[index] || '');

      for (let index = 0; index < next.length; index += 1) {
        if (next[index] === letter) {
          next[index] = '';
        }
      }

      next[Math.max(0, Math.min(slotIndex, slotCount - 1))] = letter;
      answer.selectedLetters = next;
    },
    clearLetterSlot(slotIndex) {
      const question = getCurrentQuestion();
      const answer = ensureAnswer(question.id);
      const slotCount = question.requireBothCases ? 2 : 1;
      const next = Array.from({ length: slotCount }, (_, index) => answer.selectedLetters?.[index] || '');
      next[Math.max(0, Math.min(slotIndex, slotCount - 1))] = '';
      answer.selectedLetters = next;
    },
    setMatch(pairId, word) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.matches = {
        ...(answer.matches || {}),
        [pairId]: word
      };
    },
    removeMatch(pairId) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      const matches = { ...(answer.matches || {}) };
      delete matches[pairId];
      answer.matches = matches;
    },
    runMockSpeechScore(questionId) {
      const question = state.currentPaper.questions.find((item) => item.id === questionId);
      const answer = ensureAnswer(questionId);
      answer.autoScore = Math.floor(78 + Math.random() * 18);
      answer.transcript = question.phrase || question.sentenceText || question.questionText || '';
      flashScored(questionId);
    },
    runMockKeywordAnswer(questionId) {
      const question = state.currentPaper.questions.find((item) => item.id === questionId);
      const answer = ensureAnswer(questionId);
      answer.transcript = (question.answerKeywords || [question.targetLetter || ''])[0] || '';
      answer.autoScore = 100;
      flashScored(questionId);
    },
    async runSpeechRecognition(questionId, targetText) {
      const audioUi = ensureAudioUi(questionId);
      const question = state.currentPaper.questions.find((item) => item.id === questionId);
      if (audioUi.isRecording) {
        stopSpeechRecognition(questionId);
        void trackAnswerAudioUpload(questionId, uploadAnswerAudioForQuestion(questionId, question?.type || ''));
        audioUi.isRecording = false;
        audioUi.isPreparingMic = false;
        audioUi.isMicReady = false;
        return;
      }
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        applySpeechRecognitionFallback(questionId, targetText, question);
        return;
      }
      stopSpeakingVisuals();
      audioUi.justScored = false;
      audioUi.isPreparingMic = true;
      await startAnswerAudioRecording(questionId, question?.type || '');
      audioUi.isPreparingMic = false;
      const recognition = new Recognition();
      recognition.__manualStop = false;
      activeSpeechRecognitions.set(questionId, recognition);
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript || '';
        const answer = ensureAnswer(questionId);
        answer.transcript = transcript;
        answer.autoScore = safeWord(transcript) === safeWord(targetText)
          ? 100
          : (safeWord(transcript).includes(safeWord(targetText)) ? 82 : 56);
        flashScored(questionId);
      };
      recognition.onerror = () => {
        activeSpeechRecognitions.delete(questionId);
        ensureAudioUi(questionId).isRecording = false;
        trackAnswerAudioUpload(questionId, uploadAnswerAudioForQuestion(questionId, question?.type || ''));
        void prewarmAnswerAudioRecorder(questionId, question?.type || '');
        applySpeechRecognitionFallback(questionId, targetText, question);
      };
      recognition.onend = () => {
        activeSpeechRecognitions.delete(questionId);
        ensureAudioUi(questionId).isRecording = false;
        trackAnswerAudioUpload(questionId, uploadAnswerAudioForQuestion(questionId, question?.type || ''));
        void prewarmAnswerAudioRecorder(questionId, question?.type || '');
      };
      recognition.start();
      audioUi.isRecording = true;
      playRecordingStartCue();
    },
    speak(payload) {
      const { text, questionId, kind } = normalizeSpeakPayload(payload);
      if (!text) {
        return;
      }
      activeSpeechToken += 1;
      const speechToken = activeSpeechToken;
      stopSpeakingVisuals();
      if (questionId) {
        const audioUi = ensureAudioUi(questionId);
        audioUi.isPlaying = true;
        audioUi.isRecording = false;
      }
      state.playbackOverlay = {
        visible: true,
        text,
        kind
      };
      playWithTencentTts({ text, kind, speechToken });
    },
    downloadCurrentReport() {
      if (!state.report) {
        return;
      }
      const commentLine = formatReportCommentsInline(state.report.comments);
      const html = [
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>英语测评报告</title>',
        '<style>body{font-family:Arial,sans-serif;padding:32px;color:#24456f}h1{color:#2a67b5}.card{border:1px solid #d8e8ff;border-radius:14px;padding:16px;margin-bottom:18px;background:#f8fbff}.line{margin:8px 0}</style>',
        '</head><body><h1>儿童英语测评报告</h1>',
        `<div class="card"><strong>学生：</strong>${state.student.name || '-'}<br><strong>年龄：</strong>${state.student.age || '-'}<br><strong>电话：</strong>${state.student.phone || '-'}<br><strong>学校：</strong>${state.student.school || '-'}<br><strong>年级：</strong>${state.student.grade || '-'}</div>`,
        `<div class="card"><strong>总分：</strong>${state.report.total} / ${state.report.totalPossible}<br><strong>完成率：</strong>${state.report.percent}%</div>`,
        '<div class="card"><strong>教师评语</strong>',
        commentLine ? `<div class="line">${commentLine}</div>` : '',
        '</div></body></html>'
      ].join('');
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `english-report-${Date.now()}.html`;
      link.click();
      URL.revokeObjectURL(url);
    },
    getShareLink() {
      const payload = {
        examTitle: state.config?.examTitle || '',
        themeNote: state.config?.themeNote || '',
        welcomeSpeech: state.config?.welcomeSpeech || '',
        rewardConfig: clone(state.config?.rewardConfig || {}),
        commentConfig: clone(state.config?.commentConfig || {}),
        questions: (state.config?.questions || []).map((question) => normalizeQuestion(question))
      };
      return `${window.location.origin}${window.location.pathname}#/intake?paper=${encodeConfig(payload)}`;
    },
    initFromEncodedPaper(encodedPaper) {
      const config = decodeConfig(encodedPaper);
      if (!config) {
        return false;
      }
      activeSpeechRecognitions.clear();
      activeAnswerAudioRecordings.clear();
      pendingAnswerAudioUploads.clear();
      clearAllPreparedAnswerAudio();
      const normalizedPaper = {
        ...config,
        rewardConfig: normalizeRewardConfig(config.rewardConfig || {}),
        commentConfig: normalizeReportCommentConfig(config.commentConfig || {}),
        questions: (config.questions || []).map((question) => normalizeQuestion(question))
      };
      state.config = clone(normalizedPaper);
      state.currentPaper = clone(normalizedPaper);
      state.paper = state.currentPaper;
        state.student = { name: '', phone: '', age: '', grade: '', school: '' };
        state.answers = {};
        state.audioUi = {};
        state.currentIndex = 0;
        state.reportToken = '';
        state.report = null;
        state.reportGeneratingVisible = false;
      closeStudentNotice();
      state.sessionStarted = false;
      state.playbackOverlay.visible = false;
      return true;
    },
    startExam() {
      if (state.paper && !state.currentPaper) {
        state.currentPaper = clone(state.paper);
        syncLegacyCurrentPaper();
      }
      storeApi.beginPaperSession();
    },
    restartExam() {
      activeSpeechRecognitions.clear();
      activeAnswerAudioRecordings.clear();
      pendingAnswerAudioUploads.clear();
      clearAllPreparedAnswerAudio();
      state.answers = {};
      state.audioUi = {};
      state.currentIndex = 0;
      state.report = null;
      state.reportToken = '';
      closeStudentNotice();
      state.sessionStarted = false;
      state.currentSubmissionId = '';
      state.finishAnimationVisible = false;
      state.rewardWheelVisible = false;
      state.rewardDrawing = false;
      state.rewardResult = null;
      state.playbackOverlay.visible = false;
      state.waveBars = buildWaveBars();
      syncLegacyCurrentPaper();
    },
    buildShareLink(shareCode) {
      const code = normalizeShareCode(shareCode);
      return `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
    }
  };

  return storeApi;
}

