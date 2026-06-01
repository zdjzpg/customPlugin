<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">组句关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">当前原型先用点击拼句，后续接真正拖拽时只换内部交互。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', question.sentence)">🔊 听整句</button>
    </div>
    <div class="stage-strip">
      <div class="slot-row">
        <button
          v-for="(slot, index) in question.tokens"
          :key="index"
          class="slot"
          :class="{ filled: (answer.order || [])[index] }"
          @click="$emit('remove-slot', index)"
        >
          {{ (answer.order || [])[index] || '点这里退回' }}
        </button>
      </div>
      <div class="word-bank">
        <button
          v-for="(token, index) in question.shuffledTokens"
          :key="`${token}_${index}`"
          class="word-tile"
          :class="{ used: isUsed(token, index) }"
          :disabled="isUsed(token, index)"
          @click="$emit('add-token', token)"
        >
          {{ token }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true }
});

defineEmits(['add-token', 'remove-slot', 'speak']);

function isUsed(token, index) {
  const order = props.answer.order || [];
  const usedCount = order.filter((item) => item === token).length;
  const beforeCount = props.question.shuffledTokens.slice(0, index).filter((item) => item === token).length;
  return usedCount > beforeCount;
}
</script>

