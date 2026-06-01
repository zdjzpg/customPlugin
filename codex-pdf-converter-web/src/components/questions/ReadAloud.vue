<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">口语关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">先听示范，再开始跟读。</div>
      </div>
      <button
        class="audio-bubble"
        @click="$emit('speak', { text: question.phrase, questionId: question.id, kind: 'demo_playing' })"
      >
        听示范
      </button>
    </div>
    <div class="read-panel">
      <div class="mascot-card read-buddy-card read-word-card">
        <div class="read-word-badge">跟读词卡</div>
        <h3 class="read-phrase-pop">{{ question.phrase }}</h3>
        <p class="read-word-tip">大声、完整、清楚地读出来。</p>
      </div>
      <div class="recorder-box">
        <div
          class="read-status-pill"
          :class="{
            recording: audioState.readAloudState === 'recording',
            ready: audioState.isMicReady && audioState.readAloudState !== 'recording'
          }"
        >
          {{ statusText }}
        </div>
        <div class="wave" :class="{ 'wave-passive': audioState.readAloudState !== 'recording' }">
          <span
            v-for="bar in waveBars"
            :key="bar.index"
            :style="{ '--i': bar.index, height: `${bar.height}px` }"
          ></span>
        </div>
        <div class="footer-actions">
          <button
            class="btn btn-primary read-start-btn"
            :class="{ recording: audioState.readAloudState === 'recording' }"
            :disabled="audioState.isPreparingMic"
            @click="$emit('start-speech', question.id, question.phrase)"
          >
            {{ actionText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue';

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  waveBars: { type: Array, required: true },
  audioState: { type: Object, required: true }
});

defineEmits(['speak', 'start-speech']);

const statusText = computed(() => {
  if (props.audioState.readAloudState === 'recording') {
    return '现在可以开始读了，我已经在听啦。';
  }
  if (props.audioState.isPreparingMic) {
    return '正在准备麦克风，请先不要开口，听到提示音后再开始读。';
  }
  if (props.audioState.isMicReady) {
    return '麦克风已就绪，点开始后听到提示音再开口读。';
  }
  return '准备好后点击开始跟读。';
});

const actionText = computed(() => {
  if (props.audioState.readAloudState === 'recording') {
    return '结束录音';
  }
  if (props.audioState.isPreparingMic) {
    return '麦克风准备中...';
  }
  return '开始跟读';
});
</script>
