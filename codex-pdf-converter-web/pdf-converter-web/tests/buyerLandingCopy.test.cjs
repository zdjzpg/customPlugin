const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('buyer landing copy stays user-facing and does not expose internal status language', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'index.html'),
    'utf8'
  );

  assert.match(html, /文件转换工具/);
  assert.match(html, /输入卡密后即可使用 Word 转 PDF、PDF 转图片、图片转 PDF。/);
  assert.match(html, /请输入卖家提供的卡密/);

  assert.doesNotMatch(html, /后台卡密管理/);
  assert.doesNotMatch(html, /上传转换链路下一步接入/);
  assert.doesNotMatch(html, /上传前先登录卡密，登录后直接进功能页/);
  assert.doesNotMatch(html, /管理员后台/);
  assert.doesNotMatch(html, /<h2>功能页<\/h2>/);
  assert.doesNotMatch(html, /本次登录有效至/);
});

test('buyer dashboard source does not include customer-irrelevant status and session metadata', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  assert.doesNotMatch(script, /状态：/);
  assert.doesNotMatch(script, /转换目录/);
  assert.doesNotMatch(script, /本次登录有效至/);
  assert.doesNotMatch(script, /buyerSessionCopy/);
});
