<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">口语问答</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">先听问题，再用英语回答。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.questionText, questionId: question.id, kind: 'demo_playing' })">🔊 播放问题</button>
    </div>

    <div class="read-panel">
      <div class="mascot-card read-buddy-card">
        <h3 style="margin: 12px 0 6px; font-size: 28px;">{{ question.questionText }}</h3>
        <p class="muted">可以先听一遍，再点击开始回答。</p>
      </div>
      <div class="recorder-box">
        <div class="read-status-pill" :class="{ recording: audioState.readAloudState === 'recording' }">
          {{ audioState.readAloudState === 'recording' ? '正在录音...' : '准备好就点击开始回答' }}
        </div>
        <div class="wave" :class="{ 'wave-passive': audioState.readAloudState !== 'recording' }">
          <span
            v-for="bar in waveBars"
            :key="bar.index"
            :style="{ '--i': bar.index, height: `${bar.height}px` }"
          ></span>
        </div>
        <div class="footer-actions">
          <button class="btn btn-secondary read-start-btn" :class="{ recording: audioState.readAloudState === 'recording' }" @click="$emit('start-speech', question.id, '')">
            {{ audioState.readAloudState === 'recording' ? '结束录音' : '开始回答' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  waveBars: { type: Array, required: true },
  audioState: { type: Object, required: true }
});

defineEmits(['speak', 'start-speech']);
</script>
