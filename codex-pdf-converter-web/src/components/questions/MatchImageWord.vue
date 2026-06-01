<template>
  <div class="match-play-stage">
    <div class="question-topline">
      <div>
        <span class="tag">图片连连看</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">选一张图，再点单词！</div>
      </div>
      <div class="info-badge">已配对 {{ Object.keys(answer.matches || {}).length }} / {{ question.pairs.length }}</div>
    </div>

    <div class="match-board">
      <div class="match-column">
        <button
          v-for="pair in question.pairs"
          :key="pair.id"
          class="match-card image sticker-match-card"
          :class="{ active: activePairId === pair.id, linked: Boolean((answer.matches || {})[pair.id]) }"
          @click="activePairId = pair.id"
        >
          <div class="sticker-choice-pin"></div>
          <img v-if="pair.imageUrl" :src="pair.imageUrl" alt="match option" class="question-asset-image" />
          <div v-else class="emoji-board sentence-image-fallback">🖼️</div>
          <div class="match-status-chip">
            {{ activePairId === pair.id ? '准备配对' : ((answer.matches || {})[pair.id] ? '配对成功' : '点我开始') }}
          </div>
        </button>
      </div>

      <div class="match-column">
        <button
          v-for="pair in shuffledPairs"
          :key="`${pair.id}_${pair.word}`"
          class="match-card word word-sticker-match"
          :class="{ selected: assignedWordIds.includes(pair.word), armed: Boolean(activePairId) }"
          @click="selectWord(pair.word)"
        >
          {{ pair.word }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, ref } from 'vue';

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true }
});

const emit = defineEmits(['set-match']);
const activePairId = ref('');

const shuffledPairs = computed(() => {
  const pairs = (props.question.pairs || []).slice();
  return pairs.sort((left, right) => left.word.localeCompare(right.word));
});
const assignedWordIds = computed(() => Object.values(props.answer.matches || {}));

function selectWord(word) {
  if (!activePairId.value) {
    return;
  }
  emit('set-match', { pairId: activePairId.value, word });
  activePairId.value = '';
}
</script>
