const PAGE_META = {
  papers: {
    eyebrow: 'Teacher Console',
    title: '卷子列表',
    description: '管理卷子、分享入口与答题情况。'
  },
  'paper-new': {
    eyebrow: 'Teacher Console',
    title: '编辑卷子',
    description: '维护题目、分享信息与学生端预览入口。'
  },
  answers: {
    eyebrow: 'Teacher Console',
    title: '答题记录',
    description: '查看当前卷子的提交结果与明细表现。'
  },
  users: {
    eyebrow: 'Teacher Console',
    title: '员工管理',
    description: '维护老师账号、角色与可用状态。'
  },
  'users-new': {
    eyebrow: 'Teacher Console',
    title: '新增员工',
    description: '在独立页面创建老师账号，再返回员工列表继续管理。'
  }
};

function isTeacherRoute(route) {
  return Boolean(route && route.meta && route.meta.requiresAuth);
}

function buildTeacherNavItems({ routeName = '', routeFullPath = '', paperId = '', isAdmin = false } = {}) {
  const activeGroup = routeName === 'paper-new'
    ? 'papers'
    : (routeName === 'users-new' ? 'users' : routeName);
  const items = [
    {
      key: 'papers',
      label: '卷子列表',
      to: { name: 'papers' },
      active: activeGroup === 'papers'
    }
  ];

  if (activeGroup === 'answers' && paperId) {
    items.push({
      key: 'answers',
      label: '答题记录',
      to: routeFullPath || { name: 'answers', query: { paperId } },
      active: true
    });
  }

  if (isAdmin) {
    items.push({
      key: 'users',
      label: '员工管理',
      to: { name: 'users' },
      active: activeGroup === 'users'
    });
  }

  return items;
}

function getTeacherPageMeta(routeName = '') {
  return PAGE_META[routeName] || {
    eyebrow: 'Teacher Console',
    title: '后台管理',
    description: '保持老师端界面简洁、稳定、易扩展。'
  };
}

module.exports = {
  isTeacherRoute,
  buildTeacherNavItems,
  getTeacherPageMeta
};
