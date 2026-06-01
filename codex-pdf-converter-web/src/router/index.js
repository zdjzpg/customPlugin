import { createRouter, createWebHashHistory } from 'vue-router';
import ConfiguredPapersView from '../views/ConfiguredPapersView.vue';
import NewPaperView from '../views/NewPaperView.vue';
import PaperView from '../views/PaperView.vue';
import AllAnswersView from '../views/AllAnswersView.vue';
import LoginView from '../views/LoginView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import UserCreateView from '../views/UserCreateView.vue';
import JoinPaperView from '../views/JoinPaperView.vue';
import { useExamStore } from '../store/examStore';

const routes = [
  { path: '/', redirect: '/papers' },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/join', name: 'join', component: JoinPaperView },
  { path: '/papers', name: 'papers', component: ConfiguredPapersView, meta: { requiresAuth: true } },
  { path: '/papers/new', name: 'paper-new', component: NewPaperView, meta: { requiresAuth: true } },
  { path: '/paper/:shareCode', name: 'paper', component: PaperView },
  { path: '/answers', name: 'answers', component: AllAnswersView, meta: { requiresAuth: true } },
  { path: '/users/new', name: 'users-new', component: UserCreateView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/users', name: 'users', component: UserManagementView, meta: { requiresAuth: true, requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const store = useExamStore();
  await store.ensureAuthLoaded();

  if (to.meta.guestOnly && store.state.authUser) {
    next({ name: 'papers' });
    return;
  }

  if (to.meta.requiresAuth && !store.state.authUser) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta.requiresAdmin && store.state.authUser?.role !== 'ADMIN') {
    next({ name: 'papers' });
    return;
  }

  if (to.name === 'paper') {
    const shareCode = typeof to.params.shareCode === 'string' ? to.params.shareCode : '';
    const reportToken = typeof to.query.report === 'string' ? to.query.report : '';
    if (reportToken) {
      if (!(await store.loadPublicSubmissionReport(shareCode, reportToken))) {
        next(store.state.authUser ? { name: 'papers' } : { name: 'join', query: { code: shareCode, invalid: '1' } });
        return;
      }
    } else if (!(await store.preparePaperSession(shareCode))) {
      next(store.state.authUser ? { name: 'papers' } : { name: 'join', query: { code: shareCode, invalid: '1' } });
      return;
    }
  }

  if (to.name === 'answers') {
    const paperId = typeof to.query.paperId === 'string' ? to.query.paperId : '';
    if (!paperId) {
      next({ name: 'papers' });
      return;
    }
  }

  next();
});

export default router;
