<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">拼写关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">看图后输入完整单词。后续可扩展为字母拖拽拼写。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', question.answerWord)">🔊 听单词</button>
    </div>
    <div class="spelling-board">
      <div class="emoji-board word-fallback-board" style="font-size:46px;">{{ question.answerWord || 'word' }}</div>
      <div class="letter-row">
        <div
          v-for="(letter, index) in maskedLetters"
          :key="index"
          class="letter-box"
          :class="{ blank: !letter }"
        >
          {{ letter || '?' }}
        </div>
      </div>
      <div class="answer-box">
        <input :value="answer.input || ''" placeholder="请输入完整单词" @input="$emit('update-input', $event.target.value)" />
        <button class="btn btn-ghost" @click="$emit('fill-answer', question.answerWord)">填入正确答案</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue';

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true }
});

defineEmits(['speak', 'update-input', 'fill-answer']);

const maskedLetters = computed(() => props.question.answerWord.split('').map((ch, index) => (
  props.question.blankIndexes.includes(index) ? '' : ch
)));
</script>

