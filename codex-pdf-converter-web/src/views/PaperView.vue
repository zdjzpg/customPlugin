<template>
  <Teleport to="body">
    <StudentOpeningOverlay
      v-if="state.currentPaper && state.openingAnimationVisible"
      :title="state.currentPaper.examTitle"
      @enter="closeOpeningAnimation"
    />
    <StudentFinishOverlay
      v-if="state.currentPaper && state.finishAnimationVisible"
      @continue="completeFinishAnimation"
    />
    <RewardWheelOverlay
      v-if="state.currentPaper && state.rewardWheelVisible"
      :items="rewardItems"
      :drawing="state.rewardDrawing"
      :result="state.rewardResult"
      @draw="drawCurrentReward"
      @close="closeRewardWheel"
    />
    <StudentNoticeBubble
      :open="state.studentNotice.visible"
      :title="state.studentNotice.title"
      :message="state.studentNotice.message"
      :emoji="state.studentNotice.emoji"
      :action-label="state.studentNotice.actionLabel"
      @close="closeStudentNotice"
    />
    <ReportGeneratingOverlay :open="state.reportGeneratingVisible" />
    <PlaybackAnimalOverlay
      :open="state.playbackOverlay.visible"
      :text="state.playbackOverlay.text"
      :kind="state.playbackOverlay.kind"
    />
  </Teleport>

  <div
    ref="reportCaptureRef"
    v-if="state.currentPaper"
    :class="['app-shell', { 'paper-view-shell-intake': isIntakeState, 'paper-view-shell-exam': isExamState, 'paper-view-shell-report': isReportState }]"
  >
    <template v-if="!state.sessionStarted && !state.report">
      <div class="hero">
        <div class="hero-top">
          <div>
            <h1 class="hero-title">{{ state.currentPaper.examTitle }}</h1>
            <p class="hero-subtitle">{{ state.currentPaper.welcomeSpeech }}</p>
          </div>
        </div>
        <div class="chip-row">
          <div class="chip">📝 {{ state.currentPaper.questions.length }} 道题</div>
          <div class="chip">⭐ 总分 {{ currentPaperTotal }}</div>
        </div>
      </div>

      <div class="main-grid intake-grid">
        <div class="card">
          <div class="card-title">
            <h2>填写学生信息</h2>
          </div>
          <div class="field-grid two">
            <div class="field">
              <label>姓名</label><input v-model="state.student.name" placeholder="例如：小可爱" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('name')" class="form-error">请填写姓名</div>
              </div>
            </div>
            <div class="field">
              <label>手机号</label><input v-model="state.student.phone" placeholder="家长手机号" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('phone')" class="form-error">请填写手机号</div>
              </div>
            </div>
            <div class="field">
              <label>年龄</label><input v-model="state.student.age" placeholder="例如：6" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('age')" class="form-error">请填写年龄</div>
              </div>
            </div>
            <div class="field">
              <label>学校</label><input v-model="state.student.school" placeholder="例如：星光小学" />
              <div class="field-error-slot"></div>
            </div>
            <div class="field field-span-full">
              <label>年级 / 班级</label><input v-model="state.student.grade" placeholder="例如：中班 / 一年级" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('grade')" class="form-error">请填写年级 / 班级</div>
              </div>
            </div>
          </div>
          <div class="footer-actions">
            <button class="btn btn-primary" @click="beginExam">开始闯关</button>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="state.sessionStarted && !state.report && currentQuestion">
      <div class="exam-header">
        <div class="question-topline">
          <div>
            <div class="tag">第 {{ state.currentIndex + 1 }} / {{ state.currentPaper.questions.length }} 题</div>
            <h2 class="exam-paper-title">{{ state.currentPaper.examTitle }}</h2>
            <div class="muted">{{ state.student.name || '未填写姓名' }} · {{ state.student.age || '-' }}岁 · {{ state.student.school || '-' }} · {{ state.student.grade || '-' }}</div>
          </div>
          <div class="exam-header-badges">
            <div class="tag question-difficulty-tag">{{ currentQuestionDifficultyLabel }}</div>
            <div class="info-badge">当前题分值 {{ currentQuestion.score }}</div>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="exam-layout">
        <div class="question-stage">
          <div ref="questionFitViewportRef" class="question-fit-viewport">
            <div
              ref="questionFitContentRef"
              class="question-fit-content"
              :style="{ '--question-fit-scale': String(questionScale) }"
            >
              <component
                :is="componentMap[currentQuestion.type]"
                :key="currentQuestion.id"
                :question="currentQuestion"
                :answer="currentAnswer"
                :audio-state="getQuestionAudioState(currentQuestion.id)"
                :wave-bars="state.waveBars"
                @select="selectOption"
                @speak="speak"
                @add-token="addToken"
                @remove-slot="removeSlot"
                @toggle-letter="toggleLetterSelection"
                @set-letter-slot="setLetterSlot"
                @clear-letter-slot="clearLetterSlot"
                @set-match="setMatch"
                @update-input="updateSpelling"
                @fill-answer="fillAnswer"
                @start-speech="runSpeechRecognition"
                @mock-score="runMockSpeechScore"
                @mock-answer="runMockKeywordAnswer"
              />
            </div>
          </div>
        </div>
        <div class="footer-actions">
          <button class="btn btn-ghost" :disabled="state.currentIndex === 0" @click="previousQuestion">上一题</button>
          <button class="btn btn-primary" @click="goNext">
            {{ state.currentIndex === state.currentPaper.questions.length - 1 ? '提交卷子' : '下一题' }}
          </button>
        </div>
      </div>
    </template>

        <template v-else-if="state.report">
      <StudentCraftReport
        :student="state.student"
        :report="state.report"
        :report-ability-items="reportAbilityItems"
        :report-comment-display="reportCommentDisplay"
        :question-count="state.currentPaper.questions.length"
        :reward-name="state.rewardResult?.name || ''"
        :layout-mode="reportLayoutMode"
        @download-image="downloadReportImage"
        @download-html="downloadCurrentReport"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { toPng } from 'html-to-image';
import ListenAnswerQuestion from '../components/questions/ListenAnswerQuestion.vue';
import ListenChooseImage from '../components/questions/ListenChooseImage.vue';
import ListenChooseLetter from '../components/questions/ListenChooseLetter.vue';
import ListenFollowInstruction from '../components/questions/ListenFollowInstruction.vue';
import LookChooseWord from '../components/questions/LookChooseWord.vue';
import MatchImageWord from '../components/questions/MatchImageWord.vue';
import SentenceSort from '../components/questions/SentenceSort.vue';
import ReadAloud from '../components/questions/ReadAloud.vue';
import ReadSentenceWithImage from '../components/questions/ReadSentenceWithImage.vue';
import SpellBlank from '../components/questions/SpellBlank.vue';
import PlaybackAnimalOverlay from '../components/shared/PlaybackAnimalOverlay.vue';
import ReportGeneratingOverlay from '../components/shared/ReportGeneratingOverlay.vue';
import RewardWheelOverlay from '../components/shared/RewardWheelOverlay.vue';
import StudentNoticeBubble from '../components/shared/StudentNoticeBubble.vue';
import StudentCraftReport from '../components/shared/StudentCraftReport.vue';
import StudentFinishOverlay from '../components/shared/StudentFinishOverlay.vue';
import StudentOpeningOverlay from '../components/shared/StudentOpeningOverlay.vue';
import layoutScaleUtils from '../shared/layoutScale';
import questionAbilitiesUtils from '../shared/questionAbilities';
import questionDifficultyUtils from '../shared/questionDifficulty';
import reportCommentsUtils from '../shared/reportComments';
import reportLayoutModeUtils from '../shared/reportLayoutMode';
import reportImageExportUtils from '../shared/reportImageExport';
import { useExamStore } from '../store/examStore';
const { REPORT_ABILITIES } = questionAbilitiesUtils;
const { getQuestionDifficultyLabel } = questionDifficultyUtils;
const { calculateContainScale } = layoutScaleUtils;
const { formatReportCommentsInline } = reportCommentsUtils;
const { resolveReportLayoutMode } = reportLayoutModeUtils;
const { buildReportImageOptions } = reportImageExportUtils;
const {
  state,
  currentQuestion,
  currentAnswer,
  progressPercent,
  closeOpeningAnimation,
  closeStudentNotice,
  completeFinishAnimation,
  closeRewardWheel,
  drawCurrentReward,
  previousQuestion,
  nextQuestion,
  beginPaperSession,
  getQuestionAudioState,
  missingStudentFields,
  selectOption,
  addToken,
  removeSlot,
  toggleLetterSelection,
  setLetterSlot,
  clearLetterSlot,
  setMatch,
  updateSpelling,
  fillAnswer,
  runSpeechRecognition,
  runMockSpeechScore,
  runMockKeywordAnswer,
  speak,
  downloadCurrentReport,
} = useExamStore();

const componentMap = {
  listen_answer_question: ListenAnswerQuestion,
  listen_choose_image: ListenChooseImage,
  listen_choose_letter: ListenChooseLetter,
  listen_follow_instruction: ListenFollowInstruction,
  look_choose_word: LookChooseWord,
  match_image_word: MatchImageWord,
  sentence_sort: SentenceSort,
  read_aloud: ReadAloud,
  read_sentence_with_image: ReadSentenceWithImage,
  spell_blank: SpellBlank,
};

const currentPaperTotal = computed(() => state.currentPaper ? state.currentPaper.questions.reduce((sum, item) => sum + item.score, 0) : 0);
const intakeAttempted = ref(false);
const showIntakeErrors = computed(() => intakeAttempted.value);
const rewardItems = computed(() => state.currentPaper?.rewardConfig?.items || []);
const isIntakeState = computed(() => Boolean(state.currentPaper && !state.sessionStarted && !state.report));
const isExamState = computed(() => Boolean(state.currentPaper && state.sessionStarted && !state.report));
const isReportState = computed(() => Boolean(state.currentPaper && state.report));
const reportAbilityItems = computed(() => REPORT_ABILITIES
  .filter((label) => state.report?.abilityMap?.[label]?.total > 0)
  .map((label) => {
    const item = state.report.abilityMap[label];
    return {
      label,
      score: item.score,
      total: item.total,
      percent: item.total ? Math.round((item.score / item.total) * 100) : 0
    };
  }));
const reportCaptureRef = ref(null);
const questionFitViewportRef = ref(null);
const questionFitContentRef = ref(null);
const questionScale = ref(1);
const viewportWidth = ref(typeof window === 'undefined' ? 1920 : window.innerWidth);
const viewportHeight = ref(typeof window === 'undefined' ? 1080 : window.innerHeight);
const currentQuestionDifficultyLabel = computed(() => getQuestionDifficultyLabel(currentQuestion.value?.difficulty));
const reportCommentLine = computed(() => formatReportCommentsInline(state.report?.comments));
const reportCommentDisplay = computed(() => reportCommentLine.value || '今天完成得很认真，继续把你的英语小本领一点点收集起来吧。');
const reportLayoutMode = computed(() => resolveReportLayoutMode(viewportWidth.value, viewportHeight.value));
let scaleFrameId = null;
let scaleObserver = null;

const EXAM_BODY_CLASS = 'exam-single-screen';
const REPORT_BODY_CLASS = 'report-single-screen';

function setExamBodyClass(active) {
  document.body.classList.toggle(EXAM_BODY_CLASS, active);
}

function setReportBodyClass(active) {
  document.body.classList.toggle(REPORT_BODY_CLASS, active);
}

function clearScaleObserver() {
  if (scaleObserver) {
    scaleObserver.disconnect();
    scaleObserver = null;
  }
}

async function updateQuestionScale() {
  if (!isExamState.value || !questionFitViewportRef.value || !questionFitContentRef.value) {
    questionScale.value = 1;
    return;
  }

  questionScale.value = 1;
  await nextTick();

  const viewportEl = questionFitViewportRef.value;
  const contentEl = questionFitContentRef.value;
  if (!viewportEl || !contentEl) {
    return;
  }

  const nextScale = calculateContainScale({
    viewportWidth: viewportEl.clientWidth,
    viewportHeight: viewportEl.clientHeight,
    contentWidth: contentEl.scrollWidth,
    contentHeight: contentEl.scrollHeight
  });

  questionScale.value = nextScale;
}

function scheduleQuestionScale() {
  if (scaleFrameId) {
    window.cancelAnimationFrame(scaleFrameId);
  }
  scaleFrameId = window.requestAnimationFrame(() => {
    scaleFrameId = null;
    void updateQuestionScale();
  });
}

async function bindScaleObserver() {
  clearScaleObserver();
  await nextTick();
  if (!isExamState.value || !questionFitViewportRef.value || !questionFitContentRef.value || typeof ResizeObserver === 'undefined') {
    return;
  }
  scaleObserver = new ResizeObserver(() => {
    scheduleQuestionScale();
  });
  scaleObserver.observe(questionFitViewportRef.value);
  scaleObserver.observe(questionFitContentRef.value);
}

function beginExam() {
  intakeAttempted.value = true;
  if (missingStudentFields.value.length > 0) {
    return;
  }
  intakeAttempted.value = false;
  beginPaperSession();
}

async function goNext() {
  const finished = await nextQuestion();
  if (finished && state.currentPaperShareCode && state.reportToken && typeof window !== 'undefined') {
    const nextHash = `#/paper/${encodeURIComponent(state.currentPaperShareCode)}?report=${encodeURIComponent(state.reportToken)}`;
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${nextHash}`);
  }
}

async function downloadReportImage() {
  if (!reportCaptureRef.value) {
    return;
  }
  const dataUrl = await toPng(reportCaptureRef.value, buildReportImageOptions());
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `english-report-${Date.now()}.png`;
  link.click();
}

function fieldError(field) {
  return missingStudentFields.value.includes(field);
}

watch(isExamState, async (active) => {
  setExamBodyClass(active);
  if (!active) {
    questionScale.value = 1;
    clearScaleObserver();
    return;
  }
  await bindScaleObserver();
  scheduleQuestionScale();
}, { immediate: true });

watch(isReportState, (active) => {
  setReportBodyClass(active);
}, { immediate: true });

watch(() => currentQuestion.value?.id, async () => {
  if (!isExamState.value) {
    return;
  }
  await bindScaleObserver();
  scheduleQuestionScale();
});

onMounted(() => {
  window.addEventListener('resize', handleViewportResize);
  scheduleQuestionScale();
});

onBeforeUnmount(() => {
  if (scaleFrameId) {
    window.cancelAnimationFrame(scaleFrameId);
    scaleFrameId = null;
  }
  clearScaleObserver();
  setExamBodyClass(false);
  setReportBodyClass(false);
  window.removeEventListener('resize', handleViewportResize);
});

function handleViewportResize() {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
  scheduleQuestionScale();
}
</script>



