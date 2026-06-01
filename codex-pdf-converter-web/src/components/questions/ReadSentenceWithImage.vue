<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">图文跟读</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">看图后把整句读出来。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.sentenceText, questionId: question.id, kind: 'demo_playing' })">🔊 听示范</button>
    </div>

    <div class="read-panel image-read-panel">
      <div class="mascot-card read-buddy-card">
        <div class="sentence-image-card">
          <img v-if="question.imageUrl" :src="question.imageUrl" alt="sentence hint" class="question-asset-image" />
          <div v-else class="emoji-board sentence-image-fallback">🖼️</div>
        </div>
        <h3 style="margin:12px 0 6px; font-size:26px;">{{ question.sentenceText }}</h3>
        <p class="muted">观察图片，完整读出句子。</p>
      </div>
      <div class="recorder-box">
        <div class="read-status-pill" :class="{ recording: audioState.readAloudState === 'recording' }">
          {{ audioState.readAloudState === 'recording' ? '正在录音...' : '准备好就点击开始跟读' }}
        </div>
        <div class="wave" :class="{ 'wave-passive': audioState.readAloudState !== 'recording' }">
          <span
            v-for="bar in waveBars"
            :key="bar.index"
            :style="{ '--i': bar.index, height: `${bar.height}px` }"
          ></span>
        </div>
        <div class="footer-actions">
          <button class="btn btn-secondary read-start-btn" :class="{ recording: audioState.readAloudState === 'recording' }" @click="$emit('start-speech', question.id, question.sentenceText)">
            {{ audioState.readAloudState === 'recording' ? '结束录音' : '开始跟读' }}
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
