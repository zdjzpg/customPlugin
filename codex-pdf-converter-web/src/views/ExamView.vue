<template>
  <div class="app-shell" v-if="currentQuestion">
    <PlaybackAnimalOverlay
      :open="state.playbackOverlay.visible"
      :text="state.playbackOverlay.text"
      :kind="state.playbackOverlay.kind"
    />

    <div class="exam-header">
      <div class="question-topline">
        <div>
          <div class="tag">第 {{ state.currentIndex + 1 }} / {{ state.paper.questions.length }} 题</div>
          <h2 style="margin:12px 0 8px; font-size:28px;">{{ state.paper.examTitle }}</h2>
          <div class="muted">{{ state.student.name || '未填写姓名' }} · {{ state.student.age || '-' }}岁 · {{ state.student.school || '-' }} · {{ state.student.grade || '-' }}</div>
        </div>
        <div class="info-badge">当前题分值 {{ currentQuestion.score }}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" :style="{ width: progressPercent + '%' }"></div></div>
    </div>

    <div class="exam-layout">
      <div class="question-stage">
        <component
          :is="componentMap[currentQuestion.type]"
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
      <div class="footer-actions">
        <button class="btn btn-ghost" :disabled="state.currentIndex === 0" @click="previousQuestion">上一题</button>
        <div class="toolbar">
          <button class="btn btn-primary" @click="goNext">{{ state.currentIndex === state.paper.questions.length - 1 ? '完成并生成报告' : '下一题' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
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
import { useExamStore } from '../store/examStore';

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
  spell_blank: SpellBlank
};

const router = useRouter();
const route = useRoute();
const {
  state,
  currentQuestion,
  currentAnswer,
  progressPercent,
  previousQuestion,
  nextQuestion,
  getQuestionAudioState,
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
  speak
} = useExamStore();

async function goNext() {
  const finished = await nextQuestion();
  if (finished) {
    router.push({ name: 'report', query: route.query });
  }
}
</script>
