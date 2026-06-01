<template>
  <div class="look-word-stage">
    <div class="question-topline">
      <div>
        <span class="tag">读图关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">看看是谁，点单词！</div>
      </div>
      <div class="info-badge">目标图片</div>
    </div>
    <div class="look-word-playboard">
      <div v-if="question.imageUrl" class="look-word-image-card">
        <img :src="question.imageUrl" :alt="question.targetWord" class="question-asset-image" />
      </div>
      <div v-else class="emoji-board sentence-image-fallback word-fallback-board" style="font-size: 46px; margin-top: 18px;">
        {{ question.targetWord || 'word' }}
      </div>
      <div class="look-word-sticker-row">
        <button
          v-for="word in question.options"
          :key="word"
          class="option-chip word-sticker"
          :class="{ selected: answer.selected === word }"
          @click="$emit('select', word)"
        >
          {{ word }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true }
});

defineEmits(['select']);
</script>
