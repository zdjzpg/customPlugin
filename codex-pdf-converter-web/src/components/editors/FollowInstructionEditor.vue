<template>
  <div class="instruction-editor">
    <div class="field-grid two">
      <a-form-item label="听力指令">
        <a-input
          :value="question.instructionText"
          placeholder="例如：Put the apple on the table."
          @update:value="updateText('instructionText', $event)"
        />
      </a-form-item>
      <a-form-item label="作答模式">
        <a-select
          :value="instructionMode"
          :options="modeOptions"
          @change="updateMode"
        />
      </a-form-item>
    </div>

    <a-card class="instruction-config-summary" size="small">
      <div class="instruction-summary-grid">
        <div class="instruction-summary-item">
          <div class="instruction-summary-label">目标区域</div>
          <div class="instruction-summary-value">{{ targets.length }} 个</div>
        </div>
        <div class="instruction-summary-item">
          <div class="instruction-summary-label">当前答案</div>
          <div class="instruction-summary-value">{{ currentTargetLabel }}</div>
        </div>
        <div class="instruction-summary-item">
          <div class="instruction-summary-label">拖拽物</div>
          <div class="instruction-summary-value">{{ isDragMode ? draggableObject.label : '点选模式' }}</div>
        </div>
        <div class="instruction-summary-item">
          <div class="instruction-summary-label">场景图</div>
          <div class="instruction-summary-value">{{ question.imageUrl ? '已上传' : '未上传' }}</div>
        </div>
      </div>
      <div class="instruction-summary-actions">
        <span class="muted tiny">{{ instructionGuide }}</span>
        <a-space wrap>
          <a-button class="instruction-config-trigger" type="primary" @click="openRegionModal">打开区域配置</a-button>
          <a-button @click="previewInstruction">试听指令</a-button>
        </a-space>
      </div>
    </a-card>

    <a-modal
      :open="isRegionModalOpen"
      title="听音做指令区域配置"
      :width="1280"
      :footer="null"
      destroy-on-close
      @cancel="closeRegionModal"
    >
      <div class="instruction-modal-toolbar">
        <div class="instruction-config-guide muted tiny">{{ instructionGuide }}</div>

        <div class="instruction-config-panel" :class="{ 'is-drag-mode': isDragMode }">
          <a-card class="instruction-config-card" :bordered="false">
            <div class="instruction-config-card-header">
              <div class="instruction-config-card-title">场景图</div>
              <div class="instruction-config-card-note">用于绘制目标区域</div>
            </div>
            <ImageUploadField
              :model-value="question.imageUrl"
              button-text="上传场景图"
              replace-text="更换场景图"
              compact
              @update:modelValue="updateText('imageUrl', $event)"
            />
          </a-card>

          <a-card v-if="isDragMode" class="instruction-config-card" :bordered="false">
            <div class="instruction-config-card-header">
              <div class="instruction-config-card-title">拖拽物图片</div>
              <div class="instruction-config-card-note">学生端拖动的物品</div>
            </div>
            <ImageUploadField
              :model-value="draggableObject.imageUrl"
              button-text="上传拖拽物"
              replace-text="更换拖拽物"
              compact
              @update:modelValue="patchDraggableObject({ imageUrl: $event })"
            />
          </a-card>
        </div>

        <div v-if="isDragMode" class="instruction-config-fields">
          <a-form-item label="拖拽物名称">
            <a-input
              :value="draggableObject.label"
              placeholder="例如：apple"
              @update:value="patchDraggableObject({ label: $event })"
            />
          </a-form-item>
          <a-form-item label="初始 X (%)">
            <a-input-number
              :value="draggableObject.startX"
              :min="0"
              :max="100"
              :style="{ width: '100%' }"
              @change="patchObjectPercent('startX', $event)"
            />
          </a-form-item>
          <a-form-item label="初始 Y (%)">
            <a-input-number
              :value="draggableObject.startY"
              :min="0"
              :max="100"
              :style="{ width: '100%' }"
              @change="patchObjectPercent('startY', $event)"
            />
          </a-form-item>
          <a-form-item label="大小 (%)">
            <a-input-number
              :value="draggableObject.size"
              :min="8"
              :max="36"
              :style="{ width: '100%' }"
              @change="patchObjectPercent('size', $event)"
            />
          </a-form-item>
        </div>
      </div>

      <div class="instruction-editor-grid instruction-modal-grid">
        <a-card class="instruction-canvas-card" :bordered="false">
          <template #title>
            <div class="instruction-canvas-header">
              <div>
                <div class="tag">目标区域编辑</div>
                <div class="muted tiny">在图片上按住鼠标拖出矩形区域，松手后会自动加入右侧列表。</div>
              </div>
            </div>
          </template>

          <div
            ref="canvasRef"
            class="instruction-canvas"
            @mousedown="startDraw"
          >
            <template v-if="resolvedImageUrl">
              <img :src="resolvedImageUrl" alt="instruction scene" class="instruction-scene-image" draggable="false" />
              <div
                v-if="isDragMode"
                class="instruction-object-preview"
                :style="dragPreviewStyle"
              >
                <img
                  v-if="draggableObject.imageUrl"
                  :src="draggableObject.imageUrl"
                  :alt="draggableObject.label"
                  class="instruction-object-preview-image"
                  draggable="false"
                />
                <span v-else>{{ draggableObject.label }}</span>
              </div>
              <div
                v-for="target in targets"
                :key="target.id"
                class="instruction-target-box"
                :class="{ correct: question.correctTargetId === target.id }"
                :style="boxStyle(target)"
                @mousedown.stop
                @click.stop="selectTarget(target.id)"
              >
                <span v-if="target.label">{{ target.label }}</span>
              </div>
              <div
                v-if="draftRect"
                class="instruction-target-box draft"
                :style="draftStyle"
              ></div>
            </template>
            <div v-else class="instruction-empty-state">
              先上传场景图，再在这里画出可点击区域。
            </div>
          </div>
        </a-card>

        <a-card class="instruction-sidebar" size="small">
          <template #title>
            <div class="card-title">
              <h3>区域列表</h3>
              <a-tag color="blue">{{ targets.length }} 个</a-tag>
            </div>
          </template>

          <div v-if="targets.length" class="instruction-region-list">
            <div v-for="(target, index) in targets" :key="target.id" class="instruction-region-item">
              <a-form-item :label="`区域 ${index + 1}`">
                <a-input :value="target.label" placeholder="例如：table top" @update:value="renameTarget(target.id, $event)" />
              </a-form-item>
              <div class="instruction-region-meta">
                <span class="muted tiny">{{ target.id }}</span>
                <span class="muted tiny">{{ target.width }}% × {{ target.height }}%</span>
              </div>
              <a-space wrap>
                <a-button
                  :disabled="question.correctTargetId === target.id"
                  @click="selectTarget(target.id)"
                >
                  {{ question.correctTargetId === target.id ? activeTargetLabel : '设为目标区域' }}
                </a-button>
                <a-button danger @click="removeTarget(target.id)">删除</a-button>
              </a-space>
            </div>
          </div>
          <div v-else class="empty">先在左侧图片上拖动鼠标画框，再到这里命名并设置正确区域。</div>
        </a-card>
      </div>

      <div class="instruction-modal-footer">
        <a-space>
          <a-button @click="closeRegionModal">取消</a-button>
          <a-button type="primary" @click="closeRegionModal">保存并关闭</a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onBeforeUnmount, ref } from 'vue';
import { resolveInstructionImage } from '../../utils/content';
import followInstructionUtils from '../../shared/followInstruction';
import studentExperienceUtils from '../../shared/studentExperience';
import ImageUploadField from './ImageUploadField.vue';

const {
  DEFAULT_DRAGGABLE_OBJECT,
  INSTRUCTION_MODE_DRAG_PLACE,
  INSTRUCTION_MODE_TAP,
  createRectTarget,
  normalizeDraggableObject
} = followInstructionUtils;
const { getSpeechPlaybackTuning, loadSpeechVoices, resolveSpeechPlaybackSettings } = studentExperienceUtils;

const props = defineProps({
  question: { type: Object, required: true }
});

const emit = defineEmits(['patch']);
const canvasRef = ref(null);
const drawingBounds = ref(null);
const startPoint = ref(null);
const draftRect = ref(null);
const isRegionModalOpen = ref(false);
const modeOptions = [
  { label: '点击区域（基础）', value: INSTRUCTION_MODE_TAP },
  { label: '拖拽放置（高级）', value: INSTRUCTION_MODE_DRAG_PLACE }
];

const targets = computed(() => (Array.isArray(props.question.targets) ? props.question.targets : []));
const instructionMode = computed(() => (
  props.question.mode === INSTRUCTION_MODE_DRAG_PLACE ? INSTRUCTION_MODE_DRAG_PLACE : INSTRUCTION_MODE_TAP
));
const isDragMode = computed(() => instructionMode.value === INSTRUCTION_MODE_DRAG_PLACE);
const draggableObject = computed(() => normalizeDraggableObject(props.question.draggableObject));
const resolvedImageUrl = computed(() => resolveInstructionImage(props.question.imageUrl));
const selectedTarget = computed(() => targets.value.find((target) => target.id === props.question.correctTargetId) || null);
const currentTargetLabel = computed(() => selectedTarget.value?.label || props.question.correctTargetId || '未设置');
const instructionGuide = computed(() => (
  isDragMode.value
    ? '建议先上传场景图并画框，再设置拖拽物初始位置。'
    : '建议先上传场景图并画框，学生端会按点击区域判分。'
));
const activeTargetLabel = computed(() => (
  isDragMode.value ? '当前目标区域' : '当前正确答案'
));
const draftStyle = computed(() => {
  if (!draftRect.value) {
    return {};
  }
  return {
    left: `${draftRect.value.left}px`,
    top: `${draftRect.value.top}px`,
    width: `${draftRect.value.width}px`,
    height: `${draftRect.value.height}px`
  };
});
const dragPreviewStyle = computed(() => {
  const size = clampPercent(draggableObject.value.size, DEFAULT_DRAGGABLE_OBJECT.size);
  return {
    left: `${clampPercent(draggableObject.value.startX)}%`,
    top: `${clampPercent(draggableObject.value.startY)}%`,
    width: `${size}%`,
    height: `${size}%`
  };
});

function clampPercent(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(parsed * 100) / 100));
}

function resetDrawingState() {
  window.removeEventListener('mousemove', handleMove);
  window.removeEventListener('mouseup', finishDraw);
  startPoint.value = null;
  draftRect.value = null;
  drawingBounds.value = null;
}

function openRegionModal() {
  isRegionModalOpen.value = true;
}

function closeRegionModal() {
  isRegionModalOpen.value = false;
  resetDrawingState();
}

function patchQuestion(patch) {
  emit('patch', patch);
}

function updateText(key, value) {
  patchQuestion({ [key]: value });
}

function updateMode(value) {
  const mode = value === INSTRUCTION_MODE_DRAG_PLACE ? INSTRUCTION_MODE_DRAG_PLACE : INSTRUCTION_MODE_TAP;
  patchQuestion({
    mode,
    draggableObject: normalizeDraggableObject(props.question.draggableObject)
  });
}

function patchDraggableObject(patch) {
  patchQuestion({
    draggableObject: {
      ...draggableObject.value,
      ...patch
    }
  });
}

function patchObjectPercent(key, value) {
  patchDraggableObject({ [key]: clampPercent(value, DEFAULT_DRAGGABLE_OBJECT[key]) });
}

function previewInstruction() {
  if (!window.speechSynthesis || !props.question.instructionText) {
    return;
  }
  void loadSpeechVoices(window.speechSynthesis);
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(props.question.instructionText);
  const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  const speechSettings = resolveSpeechPlaybackSettings(voices);
  const playbackTuning = getSpeechPlaybackTuning('demo_playing');
  utter.rate = playbackTuning.rate;
  utter.pitch = playbackTuning.pitch;
  utter.lang = speechSettings.lang;
  if (speechSettings.voice) {
    utter.voice = speechSettings.voice;
  }
  window.speechSynthesis.resume?.();
  window.speechSynthesis.speak(utter);
}

function eventPoint(event) {
  const bounds = canvasRef.value?.getBoundingClientRect();
  if (!bounds) {
    return null;
  }
  return {
    x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
    y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top))
  };
}

function updateDraft(point) {
  if (!startPoint.value || !point) {
    return;
  }
  const left = Math.min(startPoint.value.x, point.x);
  const top = Math.min(startPoint.value.y, point.y);
  draftRect.value = {
    left,
    top,
    width: Math.abs(point.x - startPoint.value.x),
    height: Math.abs(point.y - startPoint.value.y)
  };
}

function handleMove(event) {
  updateDraft(eventPoint(event));
}

function finishDraw() {
  window.removeEventListener('mousemove', handleMove);
  window.removeEventListener('mouseup', finishDraw);

  if (!draftRect.value || !drawingBounds.value) {
    startPoint.value = null;
    draftRect.value = null;
    drawingBounds.value = null;
    return;
  }

  if (draftRect.value.width >= 16 && draftRect.value.height >= 16) {
    const nextTargets = targets.value.slice();
    const target = createRectTarget(draftRect.value, drawingBounds.value, nextTargets.length + 1);
    nextTargets.push(target);
    patchQuestion({
      targets: nextTargets,
      correctTargetId: props.question.correctTargetId || target.id
    });
  }

  startPoint.value = null;
  draftRect.value = null;
  drawingBounds.value = null;
}

function startDraw(event) {
  if (!resolvedImageUrl.value || !isRegionModalOpen.value) {
    return;
  }
  if (event.button !== 0) {
    return;
  }
  const bounds = canvasRef.value?.getBoundingClientRect();
  const point = eventPoint(event);
  if (!bounds || !point) {
    return;
  }

  drawingBounds.value = { width: bounds.width, height: bounds.height };
  startPoint.value = point;
  draftRect.value = { left: point.x, top: point.y, width: 0, height: 0 };

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', finishDraw);
}

function selectTarget(targetId) {
  patchQuestion({ correctTargetId: targetId });
}

function renameTarget(targetId, value) {
  patchQuestion({
    targets: targets.value.map((target) => (target.id === targetId ? { ...target, label: value } : target))
  });
}

function removeTarget(targetId) {
  const nextTargets = targets.value.filter((target) => target.id !== targetId);
  patchQuestion({
    targets: nextTargets,
    correctTargetId: props.question.correctTargetId === targetId
      ? (nextTargets[0] ? nextTargets[0].id : '')
      : props.question.correctTargetId
  });
}

function boxStyle(target) {
  return {
    left: `${target.x}%`,
    top: `${target.y}%`,
    width: `${target.width}%`,
    height: `${target.height}%`
  };
}

onBeforeUnmount(() => {
  resetDrawingState();
});
</script>
