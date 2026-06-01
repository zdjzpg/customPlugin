<template>
  <div
    class="image-upload-field"
    :class="{
      compact: props.compact,
      'side-actions': props.layout === 'side-actions',
      'compact-picture-card': props.compact,
      'has-value': Boolean(props.modelValue)
    }"
  >
    <template v-if="props.compact">
      <a-upload
        accept="image/*"
        list-type="picture-card"
        :file-list="compactFileList"
        :show-upload-list="compactShowUploadList"
        :before-upload="handleBeforeUpload"
        @remove="handleCompactRemove"
      >
        <div class="image-upload-card-trigger">
          <UploadOutlined />
          <span>{{ props.modelValue ? props.replaceText : props.buttonText }}</span>
        </div>
      </a-upload>
    </template>

    <template v-else>
      <div v-if="props.modelValue" class="image-upload-preview">
        <img :src="props.modelValue" alt="uploaded preview" class="image-upload-preview-img" />
      </div>
      <a-space wrap :class="{ 'image-upload-actions': true, compact: props.compact }">
        <a-upload
          accept="image/*"
          :show-upload-list="false"
          :before-upload="handleBeforeUpload"
        >
          <a-button>
            <UploadOutlined />
            {{ props.modelValue ? props.replaceText : props.buttonText }}
          </a-button>
        </a-upload>
        <a-button v-if="props.modelValue" danger @click="clearImage">
          <DeleteOutlined />
          删除图片
        </a-button>
      </a-space>
    </template>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  buttonText: { type: String, default: '上传图片' },
  replaceText: { type: String, default: '更换图片' },
  compact: { type: Boolean, default: false },
  layout: { type: String, default: 'default' }
});

const emit = defineEmits(['update:modelValue']);

const compactFileList = computed(() => {
  if (!props.modelValue) {
    return [];
  }

  return [{
    uid: 'image-upload',
    name: 'image.png',
    status: 'done',
    url: props.modelValue
  }];
});

const compactShowUploadList = {
  showPreviewIcon: false,
  showRemoveIcon: true
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

async function handleBeforeUpload(file) {
  if (!file.type.startsWith('image/')) {
    message.error('请上传图片文件');
    return false;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    emit('update:modelValue', dataUrl);
  } catch (error) {
    message.error('图片读取失败，请重试');
  }

  return false;
}

function clearImage() {
  emit('update:modelValue', '');
}

function handleCompactRemove() {
  clearImage();
  return true;
}
</script>
