<template>
  <div class="look-word-editor">
    <a-form-item label="目标图片">
      <ImageUploadField
        :model-value="question.imageUrl"
        button-text="上传目标图片"
        replace-text="更换目标图片"
        @update:modelValue="patchQuestion({ imageUrl: $event })"
      />
    </a-form-item>

    <a-form-item label="文字选项">
      <div class="look-word-option-list">
        <div
          v-for="(choice, index) in choices"
          :key="choice.id"
          class="look-word-option-row"
        >
          <div class="listen-choice-editor-order">选项 {{ index + 1 }}</div>
          <a-input
            :value="choice.word"
            placeholder="输入英文单词"
            @update:value="updateChoice(choice.id, { word: $event })"
          />
          <label class="listen-choice-editor-answer">
            <input
              type="radio"
              :name="`look-choose-word-answer-${question.id}`"
              :checked="question.correctChoiceId === choice.id"
              @change="selectCorrectChoice(choice.id)"
            />
            <span>正确答案</span>
          </label>
          <a-button danger @click="removeChoice(choice.id)">删除</a-button>
        </div>

        <a-button dashed @click="addChoice">新增选项</a-button>
      </div>
    </a-form-item>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onMounted } from 'vue';
import lookChooseWordUtils from '../../shared/lookChooseWord';
import ImageUploadField from './ImageUploadField.vue';

const { ensureLookChooseWordDraft } = lookChooseWordUtils;

const props = defineProps({
  question: { type: Object, required: true }
});
const emit = defineEmits(['patch']);

function createChoice() {
  return {
    id: `choice_${Math.random().toString(36).slice(2, 9)}`,
    word: ''
  };
}

function patchQuestion(patch) {
  emit('patch', patch);
}

function ensureDraft() {
  const draft = ensureLookChooseWordDraft(props.question);
  if (
    !Array.isArray(props.question.choices)
    || props.question.correctChoiceId !== draft.correctChoiceId
    || props.question.imageUrl !== draft.imageUrl
  ) {
    emit('patch', {
      imageUrl: draft.imageUrl,
      choices: draft.choices,
      correctChoiceId: draft.correctChoiceId
    });
  }
}

onMounted(ensureDraft);

const choices = computed(() => {
  if (Array.isArray(props.question.choices)) {
    return props.question.choices;
  }
  return ensureLookChooseWordDraft(props.question).choices;
});

function patchChoices(nextChoices, extraPatch = {}) {
  emit('patch', {
    choices: nextChoices,
    ...extraPatch
  });
}

function updateChoice(choiceId, patch) {
  const nextChoices = choices.value.map((choice) => (
    choice.id === choiceId ? { ...choice, ...patch } : choice
  ));
  patchChoices(nextChoices);
}

function addChoice() {
  const nextChoices = [...choices.value, createChoice()];
  patchChoices(nextChoices, {
    correctChoiceId: props.question.correctChoiceId || nextChoices[0]?.id || ''
  });
}

function removeChoice(choiceId) {
  const nextChoices = choices.value.filter((choice) => choice.id !== choiceId);
  patchChoices(nextChoices, {
    correctChoiceId: props.question.correctChoiceId === choiceId ? (nextChoices[0]?.id || '') : props.question.correctChoiceId
  });
}

function selectCorrectChoice(choiceId) {
  emit('patch', { correctChoiceId: choiceId });
}
</script>
