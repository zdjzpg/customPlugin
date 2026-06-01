<template>
  <div v-if="open" class="student-notice-overlay" @click.self="$emit('close')">
    <div class="student-notice-card">
      <div class="student-notice-mascot">{{ emoji || '🐥' }}</div>
      <div class="student-notice-bubble">
        <div class="student-notice-label">温柔提醒</div>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
      </div>
      <button class="student-notice-btn" @click="$emit('close')">
        {{ actionLabel || '知道啦' }}
      </button>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  emoji: { type: String, default: '🐥' },
  actionLabel: { type: String, default: '知道啦' }
});

defineEmits(['close']);
</script>

<style scoped>
.student-notice-overlay {
  position: fixed;
  inset: 0;
  z-index: 2250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(125, 169, 202, 0.18);
  backdrop-filter: blur(10px);
}

.student-notice-card {
  width: min(520px, 100%);
  padding: 24px 22px 22px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, rgba(255, 253, 236, 0.98), rgba(255, 245, 206, 0.98));
  box-shadow: 0 28px 70px rgba(77, 123, 158, 0.18);
  border: 2px solid rgba(255, 235, 173, 0.95);
}

.student-notice-mascot {
  width: 92px;
  height: 92px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  background: radial-gradient(circle at 30% 30%, #fff7d5, #ffd976);
  box-shadow: 0 14px 30px rgba(255, 188, 74, 0.28);
}

.student-notice-bubble {
  position: relative;
  padding: 18px 18px 16px;
  border-radius: 26px;
  background: #ffffff;
  border: 2px solid #cde9ff;
  color: #356487;
}

.student-notice-bubble::before {
  content: '';
  position: absolute;
  left: 28px;
  top: -10px;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-top: 2px solid #cde9ff;
  border-left: 2px solid #cde9ff;
  transform: rotate(45deg);
}

.student-notice-label {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #e7f7ff 0%, #f6fdff 100%);
  color: #5d86aa;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.student-notice-bubble h3 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  color: #295c83;
}

.student-notice-bubble p {
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 1.65;
  color: #5b7fa0;
}

.student-notice-btn {
  margin-top: 16px;
  width: 100%;
  min-height: 52px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #7fd5ff 0%, #58b7f0 100%);
  color: #134b75;
  font-size: 18px;
  font-weight: 900;
  box-shadow: 0 12px 0 rgba(78, 157, 204, 0.22);
  cursor: pointer;
}
</style>
