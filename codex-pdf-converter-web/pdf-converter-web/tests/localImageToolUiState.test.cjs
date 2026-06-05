const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('local image tool wiring includes annotation canvas actions and the new local image tool keys', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  assert.match(script, /image_add_border_frame/);
  assert.match(script, /image_platform_cover_template/);
  assert.match(script, /image_annotate_canvas/);
  assert.match(script, /data-local-image-undo/);
  assert.match(script, /data-local-image-clear/);
  assert.match(script, /image_flip_mirror/);
  assert.match(script, /image_metadata_view_clear/);
  assert.match(script, /image_blur_redact/);
  assert.match(script, /image_rotate_adjust/);
  assert.match(script, /image_object_erase_light/);
});

test('local image tool wiring includes platform template batch export hooks', () => {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'app.js'),
    'utf8'
  );

  assert.match(script, /handleLocalImageBatchExport/);
  assert.match(script, /data-image-batch-template-option/);
  assert.match(script, /批量导出 ZIP/);
});
