const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('buyer login page includes lamp stage markup and GSAP draggable asset', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'index.html'),
    'utf8'
  );

  assert.match(html, /data-lamp-login-stage/);
  assert.match(html, /data-lamp-rope-handle/);
  assert.match(html, /data-login-lamp-form/);
  assert.match(html, /vendor\/gsap\/Draggable\.min\.js/);
  assert.match(html, /欢迎回来/);
});

test('buyer login experience source uses a 50px pull threshold and theme variables', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'buyerLoginExperience.mjs'),
    'utf8'
  );

  assert.match(source, /PULL_THRESHOLD\s*=\s*50/);
  assert.match(source, /--shade-hue/);
  assert.match(source, /--on/);
  assert.match(source, /Draggable/);
  assert.match(source, /playLampClick/);
});
