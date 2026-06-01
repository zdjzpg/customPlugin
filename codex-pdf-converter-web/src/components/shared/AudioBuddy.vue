<template>
  <div class="audio-buddy" :class="[`is-${mode}`, compact ? 'compact' : 'full']">
    <div class="audio-buddy-stage">
      <div class="audio-buddy-aura"></div>
      <div class="audio-buddy-bear">
        <div class="audio-buddy-ear left"></div>
        <div class="audio-buddy-ear right"></div>
        <div class="audio-buddy-face">
          <span class="eye left"></span>
          <span class="eye right"></span>
          <span class="nose"></span>
          <span class="mouth"></span>
          <span class="cheek left"></span>
          <span class="cheek right"></span>
        </div>
        <div class="audio-buddy-listen-ring" v-if="mode === 'listening' || mode === 'demo_playing'">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="audio-buddy-mic" v-if="showMic">
        <span>{{ mode === 'recording' ? '🎙' : '🎤' }}</span>
      </div>
      <div class="audio-buddy-wave" v-if="showWave">
        <span v-for="index in 5" :key="index"></span>
      </div>
    </div>
    <div v-if="showCaption && resolvedCaption" class="audio-buddy-caption">{{ resolvedCaption }}</div>
  </div>
</template>

<script setup>
/* global defineProps */
import { computed } from 'vue';

const props = defineProps({
  mode: { type: String, default: 'idle' },
  caption: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  showCaption: { type: Boolean, default: true }
});

const defaultCaptionMap = {
  idle: '准备好后，跟着小熊老师一起读。',
  listening: '小熊老师在认真听。',
  demo_playing: '我先读一遍给你听。',
  recording: '轮到你说啦，小熊老师正在听。',
  scored: '太棒啦，小熊老师听到了。'
};

const resolvedCaption = computed(() => props.caption || defaultCaptionMap[props.mode] || defaultCaptionMap.idle);
const showMic = computed(() => ['recording', 'scored'].includes(props.mode));
const showWave = computed(() => ['listening', 'demo_playing', 'recording'].includes(props.mode));
</script>
