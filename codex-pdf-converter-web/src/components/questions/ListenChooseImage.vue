<template>
  <div class="listen-image-stage">
    <div class="question-topline">
      <div>
        <span class="tag">听力关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">听一听，点它！</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.answerWord || question.answer, questionId: question.id, kind: 'listening' })">🔊 播放单词</button>
    </div>

    <div class="listen-image-confetti">
      <span>✨</span><span>⭐</span><span>✨</span>
    </div>
    <div class="choice-grid listen-image-grid">
      <button
        v-for="choice in question.choices"
        :key="choice.id"
        class="choice-card sticker-choice-card"
        :class="{ selected: answer.selected === choice.id }"
        @click="$emit('select', choice.id)"
      >
        <div class="sticker-choice-pin"></div>
        <div v-if="choice.imageUrl" class="choice-image-board">
          <img :src="choice.imageUrl" :alt="choice.word" class="choice-image" />
        </div>
        <div v-else class="emoji-board word-fallback-board">{{ choice.word || 'word' }}</div>
        <div class="choice-label">{{ choice.word }}</div>
      </button>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  audioState: { type: Object, required: true }
});

defineEmits(['select', 'speak']);
</script>
