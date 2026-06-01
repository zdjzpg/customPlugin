<template>
  <div ref="overlayRef" class="student-overlay student-overlay-finish">
    <canvas ref="confettiCanvas" class="student-confetti-canvas"></canvas>
    <div class="student-overlay-glow finish-glow left"></div>
    <div class="student-overlay-glow finish-glow right"></div>

    <div ref="cardRef" class="student-overlay-card finish-card">
      <div ref="ribbonRef" class="finish-ribbon">通关成功</div>
      <div ref="burstRef" class="finish-burst">
        <span></span><span></span><span></span>
      </div>
      <div ref="mascotRef" class="finish-mascot">🏆</div>
      <div ref="starsRef" class="finish-stars">✨ ✨ ✨</div>
      <h2 ref="titleRef">闯关完成</h2>
      <p ref="subtitleRef">你的答卷已经提交，准备进入幸运转盘。</p>
      <div ref="buttonWrapRef" class="finish-button-wrap">
        <button ref="buttonRef" class="btn btn-primary student-overlay-cta" @click="$emit('continue')">继续领奖励</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineEmits */
import confetti from 'canvas-confetti';
import { gsap } from 'gsap';
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineEmits(['continue']);

const overlayRef = ref(null);
const confettiCanvas = ref(null);
const cardRef = ref(null);
const ribbonRef = ref(null);
const burstRef = ref(null);
const mascotRef = ref(null);
const starsRef = ref(null);
const titleRef = ref(null);
const subtitleRef = ref(null);
const buttonWrapRef = ref(null);
const buttonRef = ref(null);
const loopTweens = [];
const randomBetween = gsap.utils.random;

onMounted(() => {
  gsap.set([ribbonRef.value, mascotRef.value, starsRef.value, titleRef.value, subtitleRef.value, buttonWrapRef.value], {
    opacity: 0,
    y: 56,
    x: () => randomBetween(-20, 20),
    rotate: () => randomBetween(-10, 10)
  });
  gsap.set(cardRef.value, { opacity: 0, scale: 0.58, y: 110, rotate: -8 });
  gsap.set(burstRef.value, { opacity: 0, scale: 0.3, rotate: -16 });
  gsap.set('.finish-glow', { opacity: 0, scale: 0.42 });

  gsap.timeline()
    .to(overlayRef.value, { opacity: 1, duration: 0.26 })
    .to('.finish-glow', { opacity: 1, scale: 1, duration: 1.28, ease: 'expo.out' }, 0)
    .to(cardRef.value, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 1.02, ease: 'back.out(2)' }, 0.05)
    .to(burstRef.value, { opacity: 1, scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(3)' }, 0.18)
    .to(ribbonRef.value, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 0.62, ease: 'back.out(2.2)' }, 0.26)
    .to(mascotRef.value, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 0.72, ease: 'back.out(2.5)' }, 0.34)
    .to(starsRef.value, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 0.68, ease: 'back.out(2.1)' }, 0.44)
    .to(titleRef.value, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 0.74, ease: 'back.out(2)' }, 0.56)
    .to(subtitleRef.value, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 0.62, ease: 'power3.out' }, 0.72)
    .to(buttonWrapRef.value, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 0.68, ease: 'back.out(2.1)' }, 1.02);

  loopTweens.push(
    gsap.to(mascotRef.value, {
      y: () => randomBetween(-24, -10),
      x: () => randomBetween(-10, 10),
      rotate: () => randomBetween(-12, 12),
      duration: () => randomBetween(0.9, 1.7),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );

  loopTweens.push(
    gsap.to(starsRef.value, {
      y: () => randomBetween(-18, -8),
      x: () => randomBetween(-8, 12),
      rotate: () => randomBetween(-14, 14),
      duration: () => randomBetween(1, 1.9),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );

  loopTweens.push(
    gsap.to(buttonRef.value, {
      boxShadow: '0 0 0 26px rgba(255, 192, 89, 0.22)',
      scale: 1.08,
      duration: 1.05,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: 1
    })
  );

  const fire = confetti.create(confettiCanvas.value, { resize: true, useWorker: true });
  fire({
    particleCount: 180,
    spread: 124,
    startVelocity: 60,
    scalar: 1.18,
    origin: { x: 0.5, y: 0.72 },
    colors: ['#5ec8ff', '#ffd55d', '#ff8db6', '#7cde86', '#ffb347']
  });

  window.setTimeout(() => {
    fire({
      particleCount: 140,
      angle: 52,
      spread: 104,
      startVelocity: 56,
      scalar: 1.1,
      origin: { x: 0.1, y: 0.8 },
      colors: ['#5ec8ff', '#ffd55d', '#ff8db6']
    });
    fire({
      particleCount: 140,
      angle: 128,
      spread: 104,
      startVelocity: 56,
      scalar: 1.1,
      origin: { x: 0.9, y: 0.8 },
      colors: ['#7cde86', '#ffd55d', '#ff8db6']
    });
  }, 260);
});

onBeforeUnmount(() => {
  loopTweens.forEach((tween) => tween.kill());
});
</script>
