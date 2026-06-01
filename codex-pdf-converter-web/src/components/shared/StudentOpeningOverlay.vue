<template>
  <div ref="overlayRef" class="student-overlay student-overlay-opening">
    <div ref="frameRef" class="storybook-backdrop-frame">
      <div class="student-overlay-glow opening-glow left"></div>
      <div class="student-overlay-glow opening-glow right"></div>
      <div class="storybook-backdrop-ornaments">
        <div class="storybook-ornament storybook-ornament-star">★</div>
        <div class="storybook-ornament storybook-ornament-cloud"></div>
        <div class="storybook-ornament storybook-ornament-balloon"></div>
      </div>
    </div>

    <div ref="stageRef" class="storybook-stage">
      <div ref="backRef" class="storybook-shell storybook-back"></div>
      <div ref="shadowRef" class="storybook-shadow"></div>

      <div ref="frontRef" class="storybook-shell storybook-cover-front">
        <div class="storybook-spine"></div>
        <div class="storybook-corner"></div>

        <div class="student-sparkles storybook-dust">
          <span
            v-for="sparkle in sparkles"
            :key="sparkle.id"
            class="student-sparkle"
            :style="sparkle.style"
          >
            ✦
          </span>
        </div>

        <div class="storybook-cover-content">
          <h2 ref="titleRef" class="storybook-title">
            <span
              v-for="(char, index) in titleChars"
              :key="`${char}_${index}`"
              class="opening-title-char"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </h2>
          <p ref="subtitleRef" class="storybook-subtitle">准备好了吗？一起开始今天的英语小挑战吧。</p>
          <div ref="buttonWrapRef" class="storybook-button-wrap">
            <button ref="buttonRef" class="btn btn-primary student-overlay-cta" @click="$emit('enter')">进入测评</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { gsap } from 'gsap';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  title: { type: String, required: true }
});

defineEmits(['enter']);

const overlayRef = ref(null);
const frameRef = ref(null);
const stageRef = ref(null);
const backRef = ref(null);
const shadowRef = ref(null);
const frontRef = ref(null);
const titleRef = ref(null);
const subtitleRef = ref(null);
const buttonWrapRef = ref(null);
const buttonRef = ref(null);
const titleChars = computed(() => Array.from(props.title || ''));
const loopTweens = [];
const randomBetween = gsap.utils.random;

const sparkles = [
  { id: 's1', style: { top: '14%', left: '12%' } },
  { id: 's2', style: { top: '22%', right: '11%' } },
  { id: 's3', style: { top: '76%', left: '10%' } },
  { id: 's4', style: { top: '72%', right: '12%' } },
  { id: 's5', style: { top: '12%', left: '56%' } },
  { id: 's6', style: { top: '84%', left: '58%' } }
];

onMounted(() => {
  gsap.set(overlayRef.value, { opacity: 0 });
  gsap.set([subtitleRef.value, buttonWrapRef.value], { opacity: 0, y: 36 });
  gsap.set(backRef.value, { opacity: 0, scale: 0.76, rotate: -16, x: -180, y: 52 });
  gsap.set(shadowRef.value, { opacity: 0, scaleX: 0.38, scaleY: 0.64, y: 30 });
  gsap.set(frontRef.value, {
    opacity: 0,
    scale: 0.68,
    rotateY: -72,
    rotate: -12,
    x: 240,
    y: 86,
    transformOrigin: 'left center'
  });
  gsap.set(frameRef.value, { opacity: 0, scale: 0.84, y: 72, rotate: -2 });
  gsap.set('.opening-title-char', {
    opacity: 0,
    x: () => randomBetween(-120, 120),
    y: () => randomBetween(90, 200),
    rotate: () => randomBetween(-30, 30),
    scale: () => randomBetween(0.56, 1.26),
    filter: 'blur(10px)'
  });
  gsap.set('.storybook-dust .student-sparkle', {
    opacity: 0,
    x: () => randomBetween(-42, 42),
    y: () => randomBetween(20, 70),
    scale: () => randomBetween(0.2, 0.85),
    rotate: () => randomBetween(-26, 26)
  });
  gsap.set('.opening-glow', { opacity: 0, scale: 0.4 });
  gsap.set('.storybook-ornament', {
    opacity: 0,
    y: () => randomBetween(20, 80),
    rotate: () => randomBetween(-18, 18),
    scale: () => randomBetween(0.68, 1.12)
  });

  const timeline = gsap.timeline();
  timeline
    .to(overlayRef.value, { opacity: 1, duration: 0.26 })
    .to(frameRef.value, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 1.2, ease: 'expo.out' }, 0.04)
    .to('.opening-glow', { opacity: 1, scale: 1, duration: 1.45, ease: 'expo.out' }, 0)
    .to('.storybook-ornament', {
      opacity: 1,
      y: 0,
      rotate: 0,
      scale: 1,
      duration: 0.88,
      stagger: 0.12,
      ease: 'back.out(2.2)'
    }, 0.2)
    .to(backRef.value, { opacity: 1, scale: 1, rotate: -5, x: -46, y: 14, duration: 1.02, ease: 'expo.out' }, 0.14)
    .to(shadowRef.value, { opacity: 1, scaleX: 1, scaleY: 1, y: 0, duration: 0.98, ease: 'expo.out' }, 0.2)
    .to(frontRef.value, {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      rotate: 0,
      x: 0,
      y: 0,
      duration: 1.2,
      ease: 'expo.out'
    }, 0.24)
    .to('.storybook-dust .student-sparkle', {
      opacity: 1,
      x: 0,
      scale: 1,
      y: 0,
      rotate: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'back.out(2.4)'
    }, 0.46)
    .to('.opening-title-char', {
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.64,
      stagger: 0.04,
      ease: 'back.out(2.2)'
    }, 0.64)
    .to(subtitleRef.value, { opacity: 1, y: 0, duration: 0.54, ease: 'power3.out' }, 0.98)
    .to(buttonWrapRef.value, { opacity: 1, y: 0, duration: 0.62, ease: 'back.out(1.8)' }, 1.12);

  loopTweens.push(
    gsap.to(buttonRef.value, {
      boxShadow: '0 0 0 22px rgba(255, 196, 108, 0.22)',
      scale: 1.06,
      duration: 1.05,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: 1.6
    })
  );

  loopTweens.push(
    gsap.to('.storybook-dust .student-sparkle', {
      x: () => randomBetween(-18, 18),
      y: () => randomBetween(-26, -10),
      rotate: () => randomBetween(-20, 20),
      duration: () => randomBetween(1.2, 2.4),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      stagger: 0.1,
      ease: 'power1.inOut'
    })
  );

  loopTweens.push(
    gsap.to('.storybook-ornament-star', {
      y: () => randomBetween(-28, -14),
      x: () => randomBetween(-12, 12),
      rotate: () => randomBetween(-18, 18),
      duration: () => randomBetween(2, 3.4),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );

  loopTweens.push(
    gsap.to('.storybook-ornament-cloud', {
      x: () => randomBetween(40, 74),
      y: () => randomBetween(-14, 14),
      duration: () => randomBetween(5.6, 8.2),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );

  loopTweens.push(
    gsap.to('.storybook-ornament-balloon', {
      y: () => randomBetween(-40, -20),
      x: () => randomBetween(-10, 12),
      rotate: () => randomBetween(-8, 8),
      duration: () => randomBetween(2.8, 4.4),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );
});

onBeforeUnmount(() => {
  loopTweens.forEach((tween) => tween.kill());
});
</script>
