<template>
  <div v-if="open" ref="overlayRef" class="playback-overlay">
    <div ref="cardRef" class="playback-overlay-card">
      <div ref="glowRef" class="playback-overlay-glow"></div>
      <div class="playback-overlay-stage playback-radar-stage">
        <div ref="coreRef" class="playback-radar-core">
          <span class="playback-radar-grid"></span>
          <span ref="pulseRef" class="playback-radar-pulse"></span>
          <span ref="sweepRef" class="playback-radar-sweep"></span>
          <div ref="animalRef" class="playback-overlay-animal playback-radar-mascot">🐰</div>
        </div>
        <div class="playback-overlay-rings playback-radar-bars">
          <span ref="ringOneRef"></span>
          <span ref="ringTwoRef"></span>
          <span ref="ringThreeRef"></span>
        </div>
      </div>
      <p ref="wordRef" class="playback-overlay-word">{{ text || 'listening...' }}</p>
    </div>
  </div>
</template>

<script setup>
/* global defineProps */
import { gsap } from 'gsap';
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  kind: { type: String, default: 'listening' },
  text: { type: String, default: '' }
});

const overlayRef = ref(null);
const cardRef = ref(null);
const glowRef = ref(null);
const coreRef = ref(null);
const pulseRef = ref(null);
const sweepRef = ref(null);
const animalRef = ref(null);
const ringOneRef = ref(null);
const ringTwoRef = ref(null);
const ringThreeRef = ref(null);
const wordRef = ref(null);
const loopTweens = [];
let introTimeline = null;
const randomBetween = gsap.utils.random;

function stopLoops() {
  if (introTimeline) {
    introTimeline.kill();
    introTimeline = null;
  }
  loopTweens.splice(0).forEach((tween) => tween.kill());
}

function getAnimationTargets() {
  if (
    !overlayRef.value
    || !cardRef.value
    || !glowRef.value
    || !coreRef.value
    || !pulseRef.value
    || !sweepRef.value
    || !animalRef.value
    || !ringOneRef.value
    || !ringTwoRef.value
    || !ringThreeRef.value
    || !wordRef.value
  ) {
    return null;
  }

  return {
    overlay: overlayRef.value,
    card: cardRef.value,
    glow: glowRef.value,
    core: coreRef.value,
    pulse: pulseRef.value,
    sweep: sweepRef.value,
    animal: animalRef.value,
    rings: [ringOneRef.value, ringTwoRef.value, ringThreeRef.value],
    word: wordRef.value
  };
}

async function playOpenAnimation() {
  stopLoops();
  await nextTick();

  const targets = getAnimationTargets();
  if (!targets) {
    return;
  }

  gsap.set(targets.overlay, { opacity: 0 });
  gsap.set(targets.card, { opacity: 0, y: 72, scale: 0.76, rotate: -4 });
  gsap.set(targets.glow, { opacity: 0, scale: 0.36 });
  gsap.set(targets.core, { opacity: 0, scale: 0.45, y: 24 });
  gsap.set(targets.pulse, { opacity: 0, scale: 0.42 });
  gsap.set(targets.sweep, { opacity: 0, rotate: -120 });
  gsap.set(targets.animal, { y: 16, scale: 0.78, rotate: -12, x: 10 });
  gsap.set(targets.word, { opacity: 0, y: 34, scale: 0.86, filter: 'blur(8px)' });
  gsap.set(targets.rings, {
    opacity: 0,
    x: () => randomBetween(-22, 22),
    y: 18,
    scaleY: 0.24
  });

  introTimeline = gsap.timeline();
  introTimeline
    .to(targets.overlay, { opacity: 1, duration: 0.24 })
    .to(targets.card, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.78, ease: 'back.out(1.9)' }, 0)
    .to(targets.glow, { opacity: 0.96, scale: 1, duration: 0.92, ease: 'expo.out' }, 0.05)
    .to(targets.core, { opacity: 1, scale: 1, y: 0, duration: 0.92, ease: 'back.out(2)' }, 0.12)
    .to(targets.pulse, { opacity: 1, scale: 1, duration: 0.62, ease: 'power2.out' }, 0.24)
    .to(targets.sweep, { opacity: 0.9, rotate: 0, duration: 0.62, ease: 'power2.out' }, 0.28)
    .to(targets.animal, { y: 0, x: 0, scale: 1, rotate: 0, duration: 0.68, ease: 'back.out(2.2)' }, 0.34)
    .to(targets.word, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'back.out(1.8)' }, 0.42)
    .to(targets.rings, {
      opacity: 1,
      x: 0,
      y: 0,
      scaleY: 1,
      duration: 0.48,
      stagger: 0.08,
      ease: 'power2.out'
    }, 0.5);

  loopTweens.push(
    gsap.to(targets.sweep, {
      rotate: 360,
      duration: 1.45,
      repeat: -1,
      ease: 'none'
    })
  );

  loopTweens.push(
    gsap.fromTo(targets.pulse, {
      scale: 0.94,
      opacity: 0.54
    }, {
      scale: 1.46,
      opacity: 0,
      duration: 1.3,
      repeat: -1,
      ease: 'power1.out'
    })
  );

  loopTweens.push(
    gsap.to(targets.animal, {
      y: () => randomBetween(-10, -4),
      x: () => randomBetween(-5, 5),
      rotate: () => randomBetween(-7, 7),
      duration: () => randomBetween(0.9, 1.5),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );

  loopTweens.push(
    gsap.to(targets.word, {
      scale: () => randomBetween(1.02, 1.07),
      y: () => randomBetween(-4, 2),
      duration: () => randomBetween(0.95, 1.35),
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );

  loopTweens.push(
    gsap.to(targets.rings, {
      opacity: () => randomBetween(0.28, 0.9),
      scaleY: () => randomBetween(0.38, 1.28),
      y: () => randomBetween(-6, 6),
      duration: () => randomBetween(0.46, 0.9),
      stagger: 0.06,
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'power1.inOut'
    })
  );
}

watch(() => props.open, async (value) => {
  if (value) {
    await playOpenAnimation();
    return;
  }
  stopLoops();
}, { flush: 'post' });

onBeforeUnmount(() => {
  stopLoops();
});
</script>
