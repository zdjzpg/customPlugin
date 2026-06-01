<template>
  <div class="login-shell">
    <div class="login-card">
      <div>
        <div class="tag">学生答题入口</div>
        <h1 class="hero-title" style="color:#2f6ac0; margin-top: 12px;">输入 6 位分享码</h1>
        <p class="hero-subtitle" style="color:#5c7fab; margin-top: 10px;">老师可以把分享链接发给家长，也可以直接把 6 位数字分享码告诉家长手动输入。</p>
      </div>

      <div class="field-grid" style="margin-top: 18px;">
        <div class="field">
          <label>分享码</label>
          <input v-model="shareCode" maxlength="6" placeholder="请输入 6 位数字" @input="onInput" @keyup.enter="submit" />
        </div>
      </div>

      <div v-if="errorText" class="form-error" style="margin-top: 12px;">{{ errorText }}</div>

      <div class="footer-actions" style="margin-top: 20px;">
        <span class="muted tiny">示例：482931</span>
        <button class="btn btn-primary" :disabled="shareCode.length !== 6" @click="submit">进入答题</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import shareCodeUtils from '../shared/shareCode';

const { normalizeShareCode } = shareCodeUtils;
const route = useRoute();
const router = useRouter();
const shareCode = ref(normalizeShareCode(route.query.code || ''));
const attempted = ref(false);

const errorText = computed(() => {
  if (route.query.invalid === '1') {
    return '分享码不存在或已失效，请检查后重新输入。';
  }
  if (!attempted.value || shareCode.value.length === 6) {
    return '';
  }
  return '请输入完整的 6 位数字分享码。';
});

watch(() => route.query.code, (value) => {
  const code = normalizeShareCode(value || '');
  shareCode.value = code;
  if (code.length === 6 && route.query.invalid !== '1') {
    submit();
  }
}, { immediate: true });

function onInput(event) {
  shareCode.value = normalizeShareCode(event.target.value);
}

function submit() {
  attempted.value = true;
  if (shareCode.value.length !== 6) {
    return;
  }
  router.push({ name: 'paper', params: { shareCode: shareCode.value } });
}
</script>
