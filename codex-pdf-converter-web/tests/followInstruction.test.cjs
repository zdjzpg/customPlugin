const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createRectTarget,
  findTargetByPoint,
  normalizeInstructionQuestion,
  validateInstructionQuestion,
  SAMPLE_INSTRUCTION_IMAGE
} = require('../src/shared/followInstruction');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('createRectTarget stores rectangle coordinates as percentages of the image area', () => {
  const target = createRectTarget(
    { left: 120, top: 40, width: 240, height: 120 },
    { width: 600, height: 400 },
    2
  );

  assert.equal(target.id, 'target_2');
  assert.equal(target.x, 20);
  assert.equal(target.y, 10);
  assert.equal(target.width, 40);
  assert.equal(target.height, 30);
  assert.equal(target.label, 'region 2');
});

test('findTargetByPoint returns the matching target id for a point in percentage space', () => {
  const targets = [
    { id: 'eyes', x: 40, y: 18, width: 16, height: 10 },
    { id: 'mouth', x: 44, y: 36, width: 12, height: 8 }
  ];

  assert.equal(findTargetByPoint(targets, { x: 45, y: 22 }), 'eyes');
  assert.equal(findTargetByPoint(targets, { x: 49, y: 39 }), 'mouth');
  assert.equal(findTargetByPoint(targets, { x: 5, y: 5 }), '');
});

test('normalizeInstructionQuestion keeps imageUrl empty when teacher has not uploaded one', () => {
  const question = normalizeInstructionQuestion({
    id: 'q_demo',
    type: 'listen_follow_instruction',
    prompt: 'listen and tap',
    score: 10,
    instructionText: 'Touch your eyes',
    imageUrl: '',
    correctTargetId: 'eyes',
    targets: [
      { id: 'eyes', label: 'eyes', x: 40, y: 18, width: 16, height: 10 }
    ]
  });

  assert.equal(SAMPLE_INSTRUCTION_IMAGE, 'demo-boy');
  assert.equal(question.imageUrl, '');
  assert.equal(question.targets.length, 1);
  assert.equal(question.targets[0].label, 'eyes');
  assert.equal(question.correctTargetId, 'eyes');
});

test('normalizeInstructionQuestion provides drag object defaults and keeps tap mode for legacy data', () => {
  const question = normalizeInstructionQuestion({
    id: 'q_legacy',
    type: 'listen_follow_instruction',
    prompt: 'listen and tap',
    instructionText: 'Touch your eyes',
    imageUrl: '',
    targets: []
  });

  assert.equal(question.mode, 'tap');
  assert.deepEqual(question.draggableObject, {
    id: 'object_1',
    label: 'apple',
    imageUrl: '',
    startX: 14,
    startY: 70,
    size: 18
  });
});

test('normalizeInstructionQuestion keeps configured drag_place data', () => {
  const question = normalizeInstructionQuestion({
    id: 'q_drag',
    type: 'listen_follow_instruction',
    mode: 'drag_place',
    instructionText: 'Put the apple on the table',
    imageUrl: 'scene.png',
    correctTargetId: 'table_top',
    targets: [
      { id: 'table_top', label: 'table', x: 42, y: 54, width: 24, height: 14 }
    ],
    draggableObject: {
      id: 'obj_apple',
      label: 'apple',
      imageUrl: 'apple.png',
      startX: 10,
      startY: 66,
      size: 20
    }
  });

  assert.equal(question.mode, 'drag_place');
  assert.equal(question.correctTargetId, 'table_top');
  assert.equal(question.draggableObject.id, 'obj_apple');
  assert.equal(question.draggableObject.label, 'apple');
  assert.equal(question.draggableObject.imageUrl, 'apple.png');
  assert.equal(question.draggableObject.startX, 10);
  assert.equal(question.draggableObject.startY, 66);
  assert.equal(question.draggableObject.size, 20);
});

test('normalizeInstructionQuestion preserves explicit empty labels for hidden target badges', () => {
  const question = normalizeInstructionQuestion({
    id: 'q_hidden_label',
    type: 'listen_follow_instruction',
    targets: [
      { id: 'target_1', label: '', x: 10, y: 20, width: 30, height: 40 }
    ]
  });

  assert.equal(question.targets[0].label, '');
});

test('validateInstructionQuestion rejects drag mode when the scene image is missing', () => {
  const result = validateInstructionQuestion({
    id: 'q_drag_missing_scene',
    type: 'listen_follow_instruction',
    mode: 'drag_place',
    imageUrl: '',
    correctTargetId: '',
    targets: []
  }, 1);

  assert.equal(result.isValid, false);
  assert.match(result.message, /第 2 题/);
  assert.match(result.message, /场景图/);
});

test('validateInstructionQuestion rejects drag mode when no target region or correct answer is configured', () => {
  const noTargetResult = validateInstructionQuestion({
    id: 'q_drag_no_targets',
    type: 'listen_follow_instruction',
    mode: 'drag_place',
    imageUrl: 'scene.png',
    correctTargetId: '',
    targets: []
  }, 0);
  assert.equal(noTargetResult.isValid, false);
  assert.match(noTargetResult.message, /目标区域/);

  const noCorrectAnswerResult = validateInstructionQuestion({
    id: 'q_drag_no_answer',
    type: 'listen_follow_instruction',
    mode: 'drag_place',
    imageUrl: 'scene.png',
    correctTargetId: '',
    targets: [
      { id: 'target_1', label: 'table', x: 20, y: 30, width: 10, height: 12 }
    ]
  }, 0);
  assert.equal(noCorrectAnswerResult.isValid, false);
  assert.match(noCorrectAnswerResult.message, /正确答案/);
});

test('listen follow instruction defaults no longer prefill demo image in new paper', () => {
  const contentSource = read('src/utils/content.js');
  assert.match(contentSource, /if \(type === 'listen_follow_instruction'\)/);
  assert.match(contentSource, /imageUrl:\s*''/);
  assert.match(contentSource, /mode:\s*'drag_place'/);
  assert.match(contentSource, /draggableObject:\s*\{/);
  assert.doesNotMatch(contentSource, /imageUrl:\s*SAMPLE_INSTRUCTION_IMAGE/);
});

test('follow instruction editor and student view use the reorganized top config area and keep image-free fallbacks', () => {
  const editorSource = read('src/components/editors/FollowInstructionEditor.vue');
  const questionSource = read('src/components/questions/ListenFollowInstruction.vue');
  const stylesSource = read('src/styles.css');

  assert.match(editorSource, /instruction-empty-state/);
  assert.match(editorSource, /a-modal/);
  assert.match(editorSource, /isRegionModalOpen/);
  assert.match(editorSource, /instruction-config-guide/);
  assert.match(editorSource, /instruction-config-panel/);
  assert.match(editorSource, /instruction-config-card/);
  assert.match(editorSource, /instruction-config-fields/);
  assert.match(editorSource, /button-text="上传场景图"[\s\S]*replace-text="更换场景图"[\s\S]*compact/);
  assert.match(editorSource, /instruction-config-card-title">拖拽物图片</);
  assert.doesNotMatch(editorSource, /instruction-modal-scene-field/);
  assert.doesNotMatch(editorSource, /instruction-modal-object-grid/);

  assert.match(questionSource, /student-instruction-empty-state/);
  assert.match(questionSource, /student-drag-object/);
  assert.match(questionSource, /handleImageLoad/);
  assert.match(questionSource, /calculateContainBox/);
  assert.match(questionSource, /stageViewportRef/);
  assert.match(questionSource, /sceneFrameStyle/);
  assert.match(questionSource, /student-instruction-scene/);
  assert.match(questionSource, /@load="handleImageLoad"/);
  assert.match(questionSource, /:style="sceneFrameStyle"/);
  assert.match(questionSource, /<span v-if="target\.label">/);
  assert.doesNotMatch(questionSource, /target\.label \|\| target\.id/);
  assert.doesNotMatch(questionSource, /class="muted tiny"/);

  assert.match(stylesSource, /\.instruction-empty-state\s*\{/);
  assert.match(stylesSource, /\.instruction-config-panel\s*\{/);
  assert.match(stylesSource, /\.instruction-config-card\s*\{/);
  assert.match(stylesSource, /\.instruction-config-fields\s*\{/);
  assert.match(stylesSource, /\.student-instruction-empty-state\s*\{/);
  assert.match(stylesSource, /\.student-drag-object\s*\{/);
  assert.match(stylesSource, /\.student-instruction-stage\s*\{[\s\S]*height:\s*clamp\(/);
  assert.match(stylesSource, /\.student-instruction-scene\s*\{[\s\S]*position:\s*relative;/);
  assert.match(stylesSource, /\.student-instruction-image\s*\{[\s\S]*height:\s*100%;[\s\S]*object-fit:\s*contain;/);
});
