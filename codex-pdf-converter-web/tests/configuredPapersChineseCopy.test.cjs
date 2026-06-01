const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('ConfiguredPapersView keeps admin Chinese copy readable', () => {
  const source = read('src/views/ConfiguredPapersView.vue');

  [
    '<span class="admin-kpi-label">卷子总数</span>',
    '<span class="admin-kpi-label">当前可见</span>',
    '<span class="admin-kpi-label">答题记录</span>',
    '<h2>卷子检索</h2>',
    'placeholder="输入卷子名称关键词"',
    '<label>题型筛选</label>',
    '<h2>卷子列表</h2>',
    '{{ record.questionCount }} 题 / {{ record.totalScore }} 分',
    '{{ record.submissionCount || 0 }} 条',
    '编辑卷子',
    '答题情况',
    '更多',
    '<a-menu-item key="copy">复制卷子</a-menu-item>',
    '<a-menu-item key="code">复制分享码</a-menu-item>',
    '<a-menu-item key="link">复制分享链接</a-menu-item>',
    '<a-menu-item key="preview">预览学生页</a-menu-item>',
    '没有匹配的卷子，换个关键词或筛选条件再看。',
    '全部题型',
    '卷子名称',
    '题型概览',
    '分享码',
    '题数 / 总分',
    '答题记录',
    '最近更新',
    '操作',
    '归属员工',
    '卷子已复制',
    '确认删除这张卷子吗？',
    '删除后不可恢复，学生端分享码也会失效。',
    '取消',
    '卷子已删除',
    '分享码 ${shareCode} 已复制',
    '请复制以下分享码：',
    '分享链接已复制',
    '请复制以下分享链接：',
    '未配置题型',
    '暂无卷子说明',
  ].forEach((snippet) => {
    assert.ok(source.includes(snippet), `expected source to include: ${snippet}`);
  });

  assert.doesNotMatch(source, /鍗峰瓙/);
  assert.doesNotMatch(source, /鍒嗕韩/);
  assert.doesNotMatch(source, /绛旈/);
  assert.doesNotMatch(source, /鏈厤缃鍨?/);
  assert.doesNotMatch(source, /鏆傛棤鍗峰瓙璇存槑/);
});
