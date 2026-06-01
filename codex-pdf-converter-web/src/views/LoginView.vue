<template>
  <div class="login-shell">
    <div class="login-card">
      <div>
        <div class="tag">账号登录</div>
        <h1 class="hero-title" style="color:#2f6ac0; margin-top: 12px;">员工卷子管理后台</h1>
        <p class="hero-subtitle" style="color:#5c7fab; margin-top: 10px;">员工登录后只看自己的卷子和记录；管理员可进入员工管理。</p>
      </div>

      <form class="field-grid" style="margin-top: 18px;" @submit.prevent="submit">
        <div class="field">
          <label>账号</label>
          <input v-model="username" autocomplete="username" placeholder="请输入账号" @keyup.enter="submit" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" @keyup.enter="submit" />
        </div>
      </form>

      <div v-if="state.apiError" class="form-error" style="margin-top: 12px;">{{ state.apiError }}</div>

      <div class="footer-actions" style="margin-top: 20px; justify-content: flex-end;">
        <button class="btn btn-primary" :disabled="!username.trim() || !password" @click="submit">登录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useExamStore } from '../store/examStore';

const route = useRoute();
const router = useRouter();
const { login, state } = useExamStore();
const username = ref('admin');
const password = ref('123456');

async function submit() {
  try {
    await login(username.value.trim(), password.value);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect
      ? route.query.redirect
      : '';
    if (redirect) {
      router.push(redirect);
      return;
    }
    router.push({ name: 'papers' });
  } catch (error) {
    // store has already captured the user-facing error message
  }
}
</script>
