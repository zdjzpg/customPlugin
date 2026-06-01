const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isTeacherRoute,
  buildTeacherNavItems,
  getTeacherPageMeta
} = require('../src/shared/adminLayout');

test('isTeacherRoute matches routes guarded by auth', () => {
  assert.equal(isTeacherRoute({ meta: { requiresAuth: true } }), true);
  assert.equal(isTeacherRoute({ meta: { requiresAuth: false } }), false);
  assert.equal(isTeacherRoute({}), false);
});

test('buildTeacherNavItems keeps paper management active while editing', () => {
  const items = buildTeacherNavItems({
    routeName: 'paper-new',
    routeFullPath: '/papers/new?id=paper-1',
    paperId: '',
    isAdmin: false
  });

  assert.deepEqual(items.map((item) => item.key), ['papers']);
  assert.equal(items[0].active, true);
  assert.equal(items[0].to.name, 'papers');
});

test('buildTeacherNavItems adds current answers entry and admin users entry when needed', () => {
  const items = buildTeacherNavItems({
    routeName: 'answers',
    routeFullPath: '/answers?paperId=paper-7',
    paperId: 'paper-7',
    isAdmin: true
  });

  assert.deepEqual(items.map((item) => item.key), ['papers', 'answers', 'users']);
  assert.equal(items[1].label, '答题记录');
  assert.equal(items[1].to, '/answers?paperId=paper-7');
  assert.equal(items[1].active, true);
  assert.equal(items[2].to.name, 'users');
});

test('getTeacherPageMeta returns compact copy for teacher routes', () => {
  assert.deepEqual(getTeacherPageMeta('papers'), {
    eyebrow: 'Teacher Console',
    title: '卷子列表',
    description: '管理卷子、分享入口与答题情况。'
  });
  assert.equal(getTeacherPageMeta('paper-new').title, '编辑卷子');
});
