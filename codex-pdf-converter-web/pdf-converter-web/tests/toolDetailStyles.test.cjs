const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('tool detail styles use elevated rounded panels and integrated section spacing', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'styles.css'),
    'utf8'
  );

  assert.match(styles, /\.tool-detail-card\s*\{[\s\S]*border-radius:\s*30px/);
  assert.match(styles, /\.tool-detail-card\s*\{[\s\S]*background:\s*linear-gradient/);
  assert.match(styles, /\.tool-detail-head\s*\{[\s\S]*gap:\s*14px/);
  assert.match(styles, /\.tool-form\s*\{[\s\S]*gap:\s*16px/);
});

test('tool detail result cards and progress cards follow the same light premium visual language', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'styles.css'),
    'utf8'
  );

  assert.match(styles, /\.text-tool-result-shell\s*\{[\s\S]*border-radius:\s*22px/);
  assert.match(styles, /\.upload-progress-card\s*\{[\s\S]*border-radius:\s*22px/);
  assert.match(styles, /\.result-card\s*\{[\s\S]*border-radius:\s*24px/);
  assert.match(styles, /\.result-download\s*\{[\s\S]*box-shadow:\s*0 14px 28px/);
});

test('mobile detail shell uses the refreshed premium surface styling', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'styles.css'),
    'utf8'
  );

  assert.match(styles, /\.mobile-detail-shell\s*\{[\s\S]*border-radius:\s*28px/);
  assert.match(styles, /\.mobile-detail-bar\s*\{[\s\S]*border-bottom:\s*1px solid/);
  assert.match(styles, /\.mobile-detail-content\s*\{[\s\S]*padding:\s*22px/);
});
