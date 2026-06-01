<template>
  <a-form-item label="选项配置">
    <div class="listen-choice-editor-list">
      <div
        v-for="(choice, index) in choices"
        :key="choice.id"
        class="listen-choice-editor-row"
      >
        <div class="listen-choice-editor-order">选项 {{ index + 1 }}</div>
        <ImageUploadField
          :model-value="choice.imageUrl"
          button-text="上传图片"
          replace-text="更换图片"
          compact
          layout="side-actions"
          @update:modelValue="updateChoice(choice.id, { imageUrl: $event })"
        />
        <a-input :value="choice.word" placeholder="对应英文单词" @update:value="updateChoice(choice.id, { word: $event })" />
        <label class="listen-choice-editor-answer">
          <input
            type="radio"
            :name="`listen-choose-image-answer-${question.id}`"
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
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onMounted } from 'vue';
import listenChooseImageUtils from '../../shared/listenChooseImage';
import ImageUploadField from './ImageUploadField.vue';

const { ensureListenChooseImageDraft } = listenChooseImageUtils;

const props = defineProps({
  question: { type: Object, required: true }
});
const emit = defineEmits(['patch']);

function createChoice() {
  return {
    id: `choice_${Math.random().toString(36).slice(2, 9)}`,
    imageUrl: '',
    word: ''
  };
}

function ensureDraft() {
  const draft = ensureListenChooseImageDraft(props.question);
  if (!Array.isArray(props.question.choices) || props.question.correctChoiceId !== draft.correctChoiceId) {
    emit('patch', {
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
  return ensureListenChooseImageDraft(props.question).choices;
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
