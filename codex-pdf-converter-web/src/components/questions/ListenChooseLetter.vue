<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">字母听辨</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">
          {{ question.requireBothCases ? '把两个字母拖回上面的小窝。' : '把听到的字母拖回上面的小窝。' }}
        </div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.targetLetter, questionId: question.id, kind: 'listening' })">🔊 播放字母</button>
    </div>

    <div class="letter-home-board">
      <div
        v-for="slot in letterSlots"
        :key="slot.key"
        :ref="(node) => setHomeRef(slot.key, node)"
        class="letter-home-shell"
        :class="{ filled: Boolean(slot.value), active: activeSlotKey === slot.key, 'snap-glow': celebratingSlotKey === slot.key }"
      >
        <div class="letter-home-nest">
          <div v-if="slot.value" class="letter-home-token">
            <span>{{ slot.value }}</span>
            <button class="letter-home-clear" @click="$emit('clear-letter-slot', slot.index)">×</button>
          </div>
          <div v-else class="letter-home-spark">✨</div>
        </div>
      </div>
    </div>

    <div ref="gardenRef" class="loose-letter-garden">
      <button
        v-for="item in looseLetters"
        :key="item.id"
        :ref="(node) => setLetterRef(item.id, node)"
        class="loose-letter-card"
        :class="{
          selected: selectedLetters.includes(item.letter),
          dragging: dragState.id === item.id,
          returning: returningLetterId === item.id
        }"
        :style="letterStyle(item)"
        @pointerdown="startDrag(item, $event)"
      >
        {{ item.letter }}
      </button>
    </div>

    <Teleport to="body">
      <div v-if="dragState.id" class="drag-ghost" :style="dragGhostStyle">
        {{ dragState.letter }}
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onBeforeUnmount, ref } from 'vue';
import listenChooseLetterLayoutUtils from '../../shared/listenChooseLetterLayout';
import listenChooseLetterDragUtils from '../../shared/listenChooseLetterDrag';

const { buildLetterScatterLayouts } = listenChooseLetterLayoutUtils;
const { createEmptyDragState, buildDragState, getDragGhostPosition } = listenChooseLetterDragUtils;

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  audioState: { type: Object, required: true }
});

const emit = defineEmits(['speak', 'set-letter-slot', 'clear-letter-slot']);
const homeRefs = ref({});
const letterRefs = ref({});
const activeSlotKey = ref('');
const returningLetterId = ref('');
const celebratingSlotKey = ref('');
const dragState = ref(createEmptyDragState());

const selectedLetters = computed(() => props.answer.selectedLetters || []);
const displayOptions = computed(() => props.question.displayOptions || props.question.options || []);
const dragGhostStyle = computed(() => {
  const position = getDragGhostPosition(dragState.value);
  return {
    left: `${position.left}px`,
    top: `${position.top}px`
  };
});

const letterSlots = computed(() => {
  if (props.question.requireBothCases) {
    const [upperValue = '', lowerValue = ''] = props.answer.selectedLetters || [];
    return [
      { key: 'upper', index: 0, value: upperValue },
      { key: 'lower', index: 1, value: lowerValue }
    ];
  }

  return [
    {
      key: 'single',
      index: 0,
      value: (props.answer.selectedLetters || [])[0] || ''
    }
  ];
});

const looseLetters = computed(() => {
  const layouts = buildLetterScatterLayouts(displayOptions.value);

  return displayOptions.value.map((letter, index) => {
    const layout = layouts[index];
  const seed = String(letter || '')
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + index * 17;
  const rise = 12 + (seed % 14);
  const riseSoft = Math.max(8, Math.round(rise * 0.62));
  const swayLeft = 3 + (seed % 8);
  const swayLeftSoft = Math.max(2, Math.round(swayLeft * 0.45));
  const swayRight = 4 + ((seed >> 2) % 10);
  const swayDown = 3 + ((seed >> 4) % 7);
  const tiltA = 1 + (seed % 7);
  const tiltASoft = Math.max(1, Math.round(tiltA * 0.5));
  const tiltB = 1 + ((seed >> 3) % 8);
  const scale = (0.97 + ((seed % 9) * 0.012)).toFixed(3);
  const duration = (1.3 + ((seed % 11) * 0.14)).toFixed(2);
  const delay = ((seed % 10) * 0.09).toFixed(2);

  return {
    id: `${letter}-${index}`,
    letter,
    style: {
      left: layout.left,
      top: layout.top,
      '--rotate': layout.rotate,
      '--float-rise': `${rise}px`,
      '--float-rise-soft': `${riseSoft}px`,
      '--float-sway-left': `${swayLeft}px`,
      '--float-sway-left-soft': `${swayLeftSoft}px`,
      '--float-sway-right': `${swayRight}px`,
      '--float-sway-down': `${swayDown}px`,
      '--float-tilt-a': `${tiltA}deg`,
      '--float-tilt-a-soft': `${tiltASoft}deg`,
      '--float-tilt-b': `${tiltB}deg`,
      '--float-scale': scale,
      '--float-duration': `${duration}s`,
      '--delay': `${delay}s`
    }
  };
  });
});

function setHomeRef(key, node) {
  if (node) {
    homeRefs.value[key] = node;
    return;
  }
  delete homeRefs.value[key];
}

function setLetterRef(key, node) {
  if (node) {
    letterRefs.value[key] = node;
    return;
  }
  delete letterRefs.value[key];
}

function letterStyle(item) {
  const dragging = dragState.value.id === item.id;
  return {
    ...item.style,
    '--drag-x': `${dragging ? dragState.value.offsetX : 0}px`,
    '--drag-y': `${dragging ? dragState.value.offsetY : 0}px`
  };
}

function hitSlotAtPoint(clientX, clientY) {
  const entry = letterSlots.value.find((slot) => {
    const node = homeRefs.value[slot.key];
    if (!node) {
      return false;
    }
    const nestNode = node.querySelector('.letter-home-nest') || node;
    const rect = nestNode.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  });
  return entry || null;
}

function resetLetterPosition(letterId, offsetX = 0, offsetY = 0) {
  const node = letterRefs.value[letterId];
  returningLetterId.value = letterId;
  dragState.value = createEmptyDragState();
  activeSlotKey.value = '';
  if (node?.animate) {
    node.animate([
      { transform: `translate(${offsetX}px, ${offsetY}px) rotate(var(--rotate, 0deg)) scale(1.04)` },
      { transform: `translate(${Math.round(offsetX * -0.1)}px, ${Math.round(offsetY * -0.1)}px) rotate(var(--rotate, 0deg)) scale(0.98)` },
      { transform: 'translate(0px, 0px) rotate(var(--rotate, 0deg)) scale(1)' }
    ], {
      duration: 300,
      easing: 'cubic-bezier(0.22, 0.8, 0.2, 1.1)'
    });
  }
  window.setTimeout(() => {
    if (returningLetterId.value === letterId) {
      returningLetterId.value = '';
    }
  }, 260);
}

function celebrateHome(slot) {
  const node = homeRefs.value[slot.key];
  celebratingSlotKey.value = slot.key;
  node?.animate?.([
    { transform: 'translateY(0) scale(1)' },
    { transform: 'translateY(-5px) scale(1.04)' },
    { transform: 'translateY(0) scale(1)' }
  ], {
    duration: 320,
    easing: 'ease-out'
  });
  window.setTimeout(() => {
    if (celebratingSlotKey.value === slot.key) {
      celebratingSlotKey.value = '';
    }
  }, 420);
}

function snapLetterToHome(slot, letter) {
  celebrateHome(slot);
  emit('set-letter-slot', { slotIndex: slot.index, letter });
  dragState.value = createEmptyDragState();
  activeSlotKey.value = '';
  returningLetterId.value = '';
}

function onPointerMove(event) {
  if (!dragState.value.id) {
    return;
  }

  dragState.value = {
    ...dragState.value,
    pointerX: event.clientX,
    pointerY: event.clientY,
    offsetX: event.clientX - dragState.value.startX,
    offsetY: event.clientY - dragState.value.startY
  };

  const hitSlot = hitSlotAtPoint(event.clientX, event.clientY);
  activeSlotKey.value = hitSlot ? hitSlot.key : '';
}

function onPointerUp(event) {
  if (!dragState.value.id) {
    return;
  }

  const hitSlot = hitSlotAtPoint(event.clientX, event.clientY);
  if (hitSlot) {
    snapLetterToHome(hitSlot, dragState.value.letter);
    return;
  }

  resetLetterPosition(dragState.value.id, dragState.value.offsetX, dragState.value.offsetY);
}

function startDrag(item, event) {
  if (selectedLetters.value.includes(item.letter)) {
    return;
  }
  returningLetterId.value = '';
  dragState.value = buildDragState({
    item,
    clientX: event.clientX,
    clientY: event.clientY,
    rect: event.currentTarget?.getBoundingClientRect?.()
  });
  activeSlotKey.value = '';
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});
</script>
