<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">听力动作关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">{{ helperText }}</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.instructionText, questionId: question.id, kind: 'listening' })">🔊 播放指令</button>
    </div>

    <div class="instruction-player-card">
      <div class="instruction-script">{{ question.instructionText }}</div>
    </div>

    <div ref="stageViewportRef" class="student-instruction-stage">
      <template v-if="resolvedImageUrl">
        <div ref="stageRef" class="student-instruction-scene" :style="sceneFrameStyle">
          <img :src="resolvedImageUrl" alt="instruction scene" class="student-instruction-image" @load="handleImageLoad" />

          <template v-if="isDragMode">
            <button
              v-for="target in targets"
              :key="target.id"
              type="button"
              class="student-drop-target"
              :class="{ selected: answer.selected === target.id, hovered: hoveredTargetId === target.id }"
              :style="targetStyle(target)"
              @click="placeObjectOnTarget(target.id)"
            >
              <span v-if="target.label">{{ target.label }}</span>
            </button>

            <button
              type="button"
              class="student-drag-object"
              :class="{ dragging: isDragging }"
              :style="dragObjectStyle"
              @pointerdown.prevent="startDrag"
            >
              <img
                v-if="draggableObject.imageUrl"
                :src="draggableObject.imageUrl"
                :alt="draggableObject.label"
                class="student-drag-object-image"
                draggable="false"
              />
              <span v-else class="student-drag-object-text">{{ draggableObject.label }}</span>
            </button>
          </template>

          <template v-else>
            <button
              v-for="target in targets"
              :key="target.id"
              type="button"
              class="student-hit-target"
              :class="{ selected: answer.selected === target.id }"
              :style="targetStyle(target)"
              @click="$emit('select', target.id)"
            >
              <span v-if="target.label">{{ target.label }}</span>
            </button>
          </template>
        </div>
      </template>
      <div v-else class="student-instruction-empty-state">
        这道题还没有上传场景图，请跳过并联系老师完善题目。
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { resolveInstructionImage } from '../../utils/content';
import followInstructionUtils from '../../shared/followInstruction';
import layoutScaleUtils from '../../shared/layoutScale';

const {
  DEFAULT_DRAGGABLE_OBJECT,
  INSTRUCTION_MODE_DRAG_PLACE,
  normalizeDraggableObject
} = followInstructionUtils;
const { calculateContainBox } = layoutScaleUtils;

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  audioState: { type: Object, required: true }
});

const emit = defineEmits(['select', 'speak']);
const stageViewportRef = ref(null);
const stageRef = ref(null);
const stageViewportSize = ref({ width: 0, height: 0 });
const sceneImageSize = ref({ width: 0, height: 0 });
const isDragging = ref(false);
const hoveredTargetId = ref('');
const dragObjectPosition = ref({ x: 14, y: 70 });
const activePointer = ref(null);
let stageResizeObserver = null;
const resolvedImageUrl = computed(() => resolveInstructionImage(props.question.imageUrl));
const instructionMode = computed(() => (
  props.question.mode === INSTRUCTION_MODE_DRAG_PLACE ? INSTRUCTION_MODE_DRAG_PLACE : 'tap'
));
const isDragMode = computed(() => instructionMode.value === INSTRUCTION_MODE_DRAG_PLACE);
const targets = computed(() => (Array.isArray(props.question.targets) ? props.question.targets : []));
const draggableObject = computed(() => normalizeDraggableObject(props.question.draggableObject));
const objectSize = computed(() => clampToRange(draggableObject.value.size, 8, 36, DEFAULT_DRAGGABLE_OBJECT.size));
const helperText = computed(() => (
  isDragMode.value ? '听清指令后，把物体拖到正确区域。' : '听清指令后，点击图片里的正确区域。'
));
const sceneFrameStyle = computed(() => {
  if (!stageViewportSize.value.width || !stageViewportSize.value.height) {
    return {};
  }

  if (!sceneImageSize.value.width || !sceneImageSize.value.height) {
    return {
      width: '100%',
      height: '100%'
    };
  }

  const containBox = calculateContainBox({
    viewportWidth: stageViewportSize.value.width,
    viewportHeight: stageViewportSize.value.height,
    contentWidth: sceneImageSize.value.width,
    contentHeight: sceneImageSize.value.height
  });

  return {
    width: `${containBox.width}px`,
    height: `${containBox.height}px`
  };
});
const dragObjectStyle = computed(() => ({
  left: `${dragObjectPosition.value.x}%`,
  top: `${dragObjectPosition.value.y}%`,
  width: `${objectSize.value}%`,
  height: `${objectSize.value}%`
}));

function clampToRange(value, min, max, fallback = min) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(parsed * 100) / 100));
}

function targetStyle(target) {
  return {
    left: `${target.x}%`,
    top: `${target.y}%`,
    width: `${target.width}%`,
    height: `${target.height}%`
  };
}

function syncStageViewportSize() {
  if (!stageViewportRef.value) {
    stageViewportSize.value = { width: 0, height: 0 };
    return;
  }
  stageViewportSize.value = {
    width: stageViewportRef.value.clientWidth,
    height: stageViewportRef.value.clientHeight
  };
}

function bindStageResizeObserver() {
  syncStageViewportSize();
  if (!stageViewportRef.value || typeof ResizeObserver === 'undefined') {
    return;
  }
  if (stageResizeObserver) {
    stageResizeObserver.disconnect();
  }
  stageResizeObserver = new ResizeObserver(() => {
    syncStageViewportSize();
  });
  stageResizeObserver.observe(stageViewportRef.value);
}

function handleImageLoad(event) {
  const image = event.target;
  if (!image?.naturalWidth || !image?.naturalHeight) {
    return;
  }
  sceneImageSize.value = {
    width: image.naturalWidth,
    height: image.naturalHeight
  };
}

function startPosition() {
  const size = objectSize.value;
  return {
    x: clampToRange(draggableObject.value.startX, 0, 100 - size, DEFAULT_DRAGGABLE_OBJECT.startX),
    y: clampToRange(draggableObject.value.startY, 0, 100 - size, DEFAULT_DRAGGABLE_OBJECT.startY)
  };
}

function centerObjectInTarget(target) {
  const size = objectSize.value;
  return {
    x: clampToRange(target.x + (target.width - size) / 2, 0, 100 - size, 0),
    y: clampToRange(target.y + (target.height - size) / 2, 0, 100 - size, 0)
  };
}

function findHitTarget(position) {
  const size = objectSize.value;
  const centerX = position.x + size / 2;
  const centerY = position.y + size / 2;
  return targets.value.find((target) => (
    centerX >= target.x
    && centerX <= target.x + target.width
    && centerY >= target.y
    && centerY <= target.y + target.height
  )) || null;
}

function syncDragObjectPosition() {
  if (!isDragMode.value) {
    return;
  }
  const selectedTarget = targets.value.find((target) => target.id === props.answer.selected);
  dragObjectPosition.value = selectedTarget ? centerObjectInTarget(selectedTarget) : startPosition();
  hoveredTargetId.value = '';
}

function cleanupDragListeners() {
  window.removeEventListener('pointermove', handleDragMove);
  window.removeEventListener('pointerup', finishDrag);
  window.removeEventListener('pointercancel', finishDrag);
}

function startDrag(event) {
  if (!isDragMode.value || !stageRef.value) {
    return;
  }
  const stageBounds = stageRef.value.getBoundingClientRect();
  if (!stageBounds.width || !stageBounds.height) {
    return;
  }

  const pointerX = ((event.clientX - stageBounds.left) / stageBounds.width) * 100;
  const pointerY = ((event.clientY - stageBounds.top) / stageBounds.height) * 100;
  activePointer.value = {
    id: event.pointerId,
    offsetX: pointerX - dragObjectPosition.value.x,
    offsetY: pointerY - dragObjectPosition.value.y
  };
  isDragging.value = true;
  cleanupDragListeners();
  window.addEventListener('pointermove', handleDragMove);
  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', finishDrag);
}

function handleDragMove(event) {
  if (!isDragging.value || !activePointer.value || activePointer.value.id !== event.pointerId || !stageRef.value) {
    return;
  }
  const stageBounds = stageRef.value.getBoundingClientRect();
  if (!stageBounds.width || !stageBounds.height) {
    return;
  }

  const size = objectSize.value;
  const pointerX = ((event.clientX - stageBounds.left) / stageBounds.width) * 100;
  const pointerY = ((event.clientY - stageBounds.top) / stageBounds.height) * 100;
  const nextPosition = {
    x: clampToRange(pointerX - activePointer.value.offsetX, 0, 100 - size, dragObjectPosition.value.x),
    y: clampToRange(pointerY - activePointer.value.offsetY, 0, 100 - size, dragObjectPosition.value.y)
  };
  dragObjectPosition.value = nextPosition;
  const target = findHitTarget(nextPosition);
  hoveredTargetId.value = target ? target.id : '';
}

function finishDrag(event) {
  if (!isDragging.value || !activePointer.value || activePointer.value.id !== event.pointerId) {
    return;
  }
  const target = findHitTarget(dragObjectPosition.value);
  if (target) {
    dragObjectPosition.value = centerObjectInTarget(target);
    hoveredTargetId.value = target.id;
    emit('select', target.id);
  } else {
    dragObjectPosition.value = startPosition();
    hoveredTargetId.value = '';
    emit('select', '');
  }
  isDragging.value = false;
  activePointer.value = null;
  cleanupDragListeners();
}

function placeObjectOnTarget(targetId) {
  const target = targets.value.find((item) => item.id === targetId);
  if (!target) {
    return;
  }
  dragObjectPosition.value = centerObjectInTarget(target);
  hoveredTargetId.value = target.id;
  emit('select', target.id);
}

watch(
  [() => props.question.id, () => props.answer.selected, isDragMode, targets, draggableObject],
  syncDragObjectPosition,
  { immediate: true, deep: true }
);

watch(() => props.question.imageUrl, () => {
  sceneImageSize.value = { width: 0, height: 0 };
  syncStageViewportSize();
});

onMounted(() => {
  bindStageResizeObserver();
  if (props.question.autoPlay) {
    window.setTimeout(() => emit('speak', { text: props.question.instructionText, questionId: props.question.id, kind: 'listening' }), 150);
  }
});

onBeforeUnmount(() => {
  cleanupDragListeners();
  if (stageResizeObserver) {
    stageResizeObserver.disconnect();
    stageResizeObserver = null;
  }
});
</script>
