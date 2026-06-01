<template>
  <div v-if="open" class="report-generating-overlay">
    <div class="report-generating-card">
      <div class="report-generating-stars">✨ ✨ ✨</div>
      <h3>生成报告中...</h3>
      <p>正在为这份跟读作答统一评分，请稍等一下。</p>
      <div class="report-generating-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  open: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.report-generating-overlay {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(255, 247, 196, 0.92), rgba(255, 231, 186, 0.88)),
    rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
}

.report-generating-card {
  width: min(460px, 100%);
  padding: 28px 24px;
  text-align: center;
  border-radius: 28px;
  background: linear-gradient(180deg, #fffdf4 0%, #fff4d9 100%);
  box-shadow: 0 24px 60px rgba(217, 142, 64, 0.24);
  color: #7d4d11;
}

.report-generating-stars {
  margin-bottom: 10px;
  font-size: 26px;
  letter-spacing: 6px;
}

.report-generating-card h3 {
  margin: 0;
  font-size: 28px;
}

.report-generating-card p {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.6;
}

.report-generating-dots {
  display: inline-flex;
  gap: 10px;
  margin-top: 22px;
}

.report-generating-dots span {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #ffb347;
  animation: report-dot-bounce 1s ease-in-out infinite;
}

.report-generating-dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.report-generating-dots span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes report-dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-8px);
    opacity: 1;
  }
}
</style>
