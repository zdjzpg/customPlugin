<template>
  <div>
    <template v-if="showTeacherShell">
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <div class="admin-brand">
            <div class="admin-brand-mark">E</div>
            <div>
              <div class="admin-brand-name">英语测评后台</div>
              <div class="admin-brand-note">老师端管理中心</div>
            </div>
          </div>

          <a-menu
            mode="inline"
            theme="dark"
            class="admin-nav-menu"
            :selected-keys="selectedMenuKeys"
          >
            <a-menu-item
              v-for="item in navItems"
              :key="item.key"
              @click="navigate(item.to)"
            >
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </a-menu-item>
          </a-menu>
        </aside>

        <div class="admin-main-layout">
          <header class="admin-topbar">
            <div class="admin-topbar-main">
              <h1 class="admin-topbar-title">{{ pageMeta.title }}</h1>
              <a-space v-if="isPaperEditor" wrap class="paper-editor-top-actions">
                <a-button @click="router.push({ name: 'papers' })">返回卷子列表</a-button>
                <a-button :disabled="!state.editingPaper.shareCode" @click="previewPaper">预览学生页</a-button>
                <a-button :disabled="!state.editingPaperId" @click="openAnswers">答题情况</a-button>
                <a-button type="primary" :loading="state.loading" @click="savePaper">保存卷子</a-button>
              </a-space>
            </div>

            <a-space class="admin-session" :size="10">
              <div class="admin-user-chip">
                <a-avatar class="admin-user-avatar">{{ userInitial }}</a-avatar>
                <div>
                  <div class="admin-user-name">{{ state.authUser?.username || '-' }}</div>
                  <div class="admin-user-role">{{ state.authUser?.role === 'ADMIN' ? '管理员' : '员工' }}</div>
                </div>
              </div>
              <a-button class="admin-logout" @click="handleLogout">退出登录</a-button>
            </a-space>
          </header>

          <main class="admin-content">
            <router-view />
          </main>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="floating floating-star"></div>
      <div class="floating floating-cloud"></div>
      <div class="floating floating-balloon"></div>
      <div id="page-root" class="public-root">
        <router-view />
      </div>
    </template>
  </div>
</template>

<script setup>
import { message } from 'ant-design-vue';
import { FileTextOutlined, TeamOutlined } from '@ant-design/icons-vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useExamStore } from './store/examStore';
import adminLayoutUtils from './shared/adminLayout';

const { buildTeacherNavItems, getTeacherPageMeta, isTeacherRoute } = adminLayoutUtils;

const route = useRoute();
const router = useRouter();
const {
  state,
  logout,
  editingScoreSummary,
  editingCommentValidation,
  editingRewardValidation,
  editingInstructionValidation,
  saveEditingPaper
} = useExamStore();

const showTeacherShell = computed(() => isTeacherRoute(route));
const pageMeta = computed(() => getTeacherPageMeta(String(route.name || '')));
const isPaperEditor = computed(() => route.name === 'paper-new');
const navItems = computed(() => buildTeacherNavItems({
  routeName: String(route.name || ''),
  routeFullPath: route.fullPath,
  paperId: typeof route.query.paperId === 'string' ? route.query.paperId : '',
  isAdmin: state.authUser?.role === 'ADMIN'
}).map((item) => ({
  ...item,
  icon: item.key === 'users' ? TeamOutlined : FileTextOutlined
})));
const selectedMenuKeys = computed(() => navItems.value.filter((item) => item.active).map((item) => item.key));
const userInitial = computed(() => {
  const username = state.authUser?.username || 'T';
  return username.slice(0, 1).toUpperCase();
});

function navigate(target) {
  router.push(target);
}

async function savePaper() {
  if (!editingScoreSummary.value.isValid) {
    message.warning(editingScoreSummary.value.message || '卷子总分必须等于 100 分后才能保存。');
    return;
  }
  if (!editingCommentValidation.value.isValid) {
    message.warning(editingCommentValidation.value.message || '报告评语的分数段不能重复。');
    return;
  }
  if (!editingRewardValidation.value.isValid) {
    message.warning(editingRewardValidation.value.message || '转盘奖品概率配置不正确。');
    return;
  }
  if (!editingInstructionValidation.value.isValid) {
    message.warning(editingInstructionValidation.value.message || '听音做指令题还有未完成的区域配置。');
    return;
  }
  try {
    await saveEditingPaper();
    message.success('卷子已保存');
    router.push({ name: 'papers' });
  } catch (error) {
    // store already exposes the error state
  }
}

function previewPaper() {
  if (!state.editingPaper.shareCode) {
    return;
  }
  router.push({ name: 'paper', params: { shareCode: state.editingPaper.shareCode } });
}

function openAnswers() {
  if (!state.editingPaperId) {
    return;
  }
  router.push({ name: 'answers', query: { paperId: state.editingPaperId } });
}

async function handleLogout() {
  await logout();
  router.push({ name: 'login' });
}
</script>
