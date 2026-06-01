<template>
  <div ref="overlayRef" class="student-overlay student-overlay-wheel">
    <canvas ref="confettiCanvas" class="student-confetti-canvas"></canvas>

    <div ref="cardRef" class="student-overlay-card reward-card reward-machine-card">
      <div class="reward-machine-shell">
        <div ref="titleWrapRef" class="reward-machine-header">
          <div class="reward-machine-marquee">CAPSULE BONUS</div>
          <h2>幸运转盘</h2>
          <p v-if="!spinningToResult && !revealedResult">拉下摇杆前，先看看今天的惊喜会落在哪个格子。</p>
          <p v-else-if="spinningToResult">转盘正在揭晓最终奖品，请等指针停稳。</p>
          <p v-else>恭喜你抽中了：{{ revealedResult.name }}</p>
        </div>

        <div class="reward-machine-stage">
          <div class="reward-machine-lights" aria-hidden="true">
            <span v-for="light in 12" :key="light"></span>
          </div>

          <div class="reward-machine-window">
            <div ref="pointerRef" class="reward-wheel-pointer">
              <span class="reward-wheel-pointer-cap"></span>
            </div>

            <div class="reward-wheel-wrap">
              <div ref="wheelRef" class="reward-wheel" :style="wheelStyle">
                <div
                  v-for="(item, index) in items"
                  :key="item.id"
                  class="reward-wheel-label"
                  :style="labelStyle(index)"
                >
                  <div class="reward-wheel-label-badge">
                    <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="reward-wheel-image" />
                  </div>
                  <span>{{ item.name }}</span>
                </div>

                <div class="reward-wheel-center">
                  <div class="reward-wheel-center-core">GO</div>
                </div>
              </div>
            </div>

            <div class="reward-machine-window-gloss" aria-hidden="true"></div>
          </div>
        </div>

        <div ref="actionsRef" class="reward-machine-console">
          <div class="reward-machine-ticket">
            <span class="reward-machine-ticket-label">扭蛋机出票口</span>
            <strong>{{ result ? '兑奖成功' : drawing ? '转盘高速旋转中' : '准备投币开始抽奖' }}</strong>
          </div>

          <div class="reward-wheel-actions">
            <button
              v-if="!revealedResult"
              class="btn btn-primary student-overlay-cta reward-machine-button"
              :disabled="drawing || spinningToResult"
              @click="$emit('draw')"
            >
              {{ spinningToResult ? '结果揭晓中...' : (drawing ? '抽奖中...' : '开始抽奖') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="revealedResult"
      ref="resultOverlayRef"
      class="reward-result-modal"
    >
      <div
        ref="resultCardRef"
        class="reward-prize-chute reward-result-card reward-result-popup"
      >
        <div class="reward-result-burst">✦ ✦ ✦</div>
        <div class="reward-result-label">兑奖成功</div>
        <div class="reward-result-name">{{ revealedResult.name }}</div>
        <img v-if="revealedResult.imageUrl" :src="revealedResult.imageUrl" alt="" class="reward-result-image" />
        <p v-if="revealedResult.description" class="reward-result-description">{{ revealedResult.description }}</p>
        <button class="btn btn-primary student-overlay-cta reward-result-button" @click="$emit('close')">收下礼物</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import confetti from 'canvas-confetti';
import { gsap } from 'gsap';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  drawing: { type: Boolean, required: true },
  result: { type: Object, default: null }
});

defineEmits(['draw', 'close']);

const overlayRef = ref(null);
const confettiCanvas = ref(null);
const cardRef = ref(null);
const titleWrapRef = ref(null);
const wheelRef = ref(null);
const pointerRef = ref(null);
const actionsRef = ref(null);
const resultOverlayRef = ref(null);
const resultCardRef = ref(null);
const rotation = ref(0);
const revealedResult = ref(null);
const spinningToResult = ref(false);
const colors = ['#61b5ff', '#82df82', '#ffd767', '#ff9e61', '#ff84b3', '#90a0ff'];
const randomBetween = gsap.utils.random;

const wheelStyle = computed(() => {
  const step = 360 / Math.max(props.items.length, 1);
  const gradient = props.items.map((item, index) => {
    const start = index * step;
    const end = start + step;
    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  }).join(', ');

  return {
    background: `conic-gradient(from -90deg, ${gradient})`
  };
});

onMounted(() => {
  gsap.set([titleWrapRef.value, wheelRef.value, actionsRef.value], {
    opacity: 0,
    y: 62,
    x: () => randomBetween(-24, 24)
  });
  gsap.set(cardRef.value, { opacity: 0, scale: 0.64, y: 110, rotate: -8 });

  gsap.timeline()
    .to(overlayRef.value, { opacity: 1, duration: 0.24 })
    .to(cardRef.value, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.95, ease: 'back.out(2)' }, 0.04)
    .to(titleWrapRef.value, { opacity: 1, x: 0, y: 0, duration: 0.66, ease: 'back.out(2.1)' }, 0.26)
    .to(wheelRef.value, { opacity: 1, x: 0, y: 0, duration: 0.72, ease: 'back.out(2.1)' }, 0.38)
    .to(actionsRef.value, { opacity: 1, x: 0, y: 0, duration: 0.62, ease: 'back.out(2)' }, 0.52);

  gsap.to(pointerRef.value, {
    y: () => randomBetween(-12, -4),
    rotate: () => randomBetween(-6, 6),
    duration: () => randomBetween(0.42, 0.86),
    repeat: -1,
    yoyo: true,
    repeatRefresh: true,
    ease: 'power1.inOut'
  });
});

async function revealPrize(value) {
  revealedResult.value = value;
  await nextTick();

  if (resultOverlayRef.value) {
    gsap.fromTo(resultOverlayRef.value, { opacity: 0 }, {
      opacity: 1,
      duration: 0.22,
      ease: 'power1.out'
    });
  }

  if (resultCardRef.value) {
    gsap.fromTo(resultCardRef.value, { opacity: 0, scale: 0.36, y: 92, rotate: -10 }, {
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0,
      duration: 0.94,
      ease: 'back.out(2.2)',
      delay: 0.08
    });
  }
}

watch(() => props.drawing, (value) => {
  if (value) {
    gsap.to(wheelRef.value, {
      rotate: '+=1440',
      duration: 2.2,
      ease: 'power3.inOut'
    });
  }
});

watch(() => props.result, async (value) => {
  if (!value) {
    spinningToResult.value = false;
    revealedResult.value = null;
    return;
  }

  if (!props.items.length) {
    await revealPrize(value);
    return;
  }

  spinningToResult.value = true;
  const index = props.items.findIndex((item) => item.id === value.id);
  const step = 360 / props.items.length;
  const target = index < 0 ? 0 : index * step;
  rotation.value += 1800 + (360 - target - step / 2);

  gsap.to(wheelRef.value, {
    rotate: rotation.value,
    duration: 4.2,
    ease: 'power4.out',
    onComplete: () => {
      const fire = confetti.create(confettiCanvas.value, { resize: true, useWorker: true });
      fire({
        particleCount: 220,
        spread: 128,
        startVelocity: 62,
        scalar: 1.16,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#5ec8ff', '#ffd55d', '#ff8db6', '#7cde86']
      });
      gsap.fromTo(cardRef.value, { scale: 1 }, {
        scale: 1.08,
        duration: 0.32,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut'
      });
      spinningToResult.value = false;
      void revealPrize(value);
    }
  });
});

function labelStyle(index) {
  const step = 360 / Math.max(props.items.length, 1);
  return {
    transform: `translate(-50%, -50%) rotate(${index * step}deg) translateY(-104px) rotate(${-index * step}deg)`
  };
}
</script>
