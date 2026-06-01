const SAMPLE_INSTRUCTION_IMAGE = 'demo-boy';
const INSTRUCTION_MODE_TAP = 'tap';
const INSTRUCTION_MODE_DRAG_PLACE = 'drag_place';
const DEFAULT_DRAGGABLE_OBJECT = Object.freeze({
  id: 'object_1',
  label: 'apple',
  imageUrl: '',
  startX: 14,
  startY: 70,
  size: 18
});

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function normalizeInstructionMode(mode) {
  return mode === INSTRUCTION_MODE_DRAG_PLACE ? INSTRUCTION_MODE_DRAG_PLACE : INSTRUCTION_MODE_TAP;
}

function normalizeDraggableObject(draggableObject = {}) {
  return {
    id: String(draggableObject.id || DEFAULT_DRAGGABLE_OBJECT.id).trim() || DEFAULT_DRAGGABLE_OBJECT.id,
    label: String(draggableObject.label || DEFAULT_DRAGGABLE_OBJECT.label).trim() || DEFAULT_DRAGGABLE_OBJECT.label,
    imageUrl: String(draggableObject.imageUrl || '').trim(),
    startX: clampPercent(toNumber(draggableObject.startX, DEFAULT_DRAGGABLE_OBJECT.startX)),
    startY: clampPercent(toNumber(draggableObject.startY, DEFAULT_DRAGGABLE_OBJECT.startY)),
    size: clampPercent(toNumber(draggableObject.size, DEFAULT_DRAGGABLE_OBJECT.size))
  };
}

function normalizeTarget(target = {}, index = 0) {
  const hasLabel = Object.prototype.hasOwnProperty.call(target, 'label');
  return {
    id: target.id || `target_${index + 1}`,
    label: hasLabel ? String(target.label ?? '').trim() : `region ${index + 1}`,
    x: clampPercent(toNumber(target.x)),
    y: clampPercent(toNumber(target.y)),
    width: clampPercent(toNumber(target.width)),
    height: clampPercent(toNumber(target.height))
  };
}

function parseTargets(targets) {
  let parsedTargets = targets;
  if (typeof parsedTargets === 'string') {
    try {
      parsedTargets = JSON.parse(parsedTargets);
    } catch (error) {
      parsedTargets = [];
    }
  }

  return Array.isArray(parsedTargets)
    ? parsedTargets.map((target, index) => normalizeTarget(target, index))
    : [];
}

function createRectTarget(rect, bounds, index) {
  const width = Math.max(1, toNumber(bounds?.width, 1));
  const height = Math.max(1, toNumber(bounds?.height, 1));
  return normalizeTarget({
    id: `target_${index}`,
    label: `region ${index}`,
    x: (toNumber(rect?.left) / width) * 100,
    y: (toNumber(rect?.top) / height) * 100,
    width: (toNumber(rect?.width) / width) * 100,
    height: (toNumber(rect?.height) / height) * 100
  }, index - 1);
}

function pointInTarget(target, point) {
  const x = toNumber(point?.x, -1);
  const y = toNumber(point?.y, -1);
  return x >= target.x
    && y >= target.y
    && x <= target.x + target.width
    && y <= target.y + target.height;
}

function findTargetByPoint(targets, point) {
  const list = parseTargets(targets);
  const matched = list.find((target) => pointInTarget(target, point));
  return matched ? matched.id : '';
}

function normalizeInstructionQuestion(question = {}) {
  const targets = parseTargets(question.targets);
  return {
    id: question.id,
    type: question.type,
    score: toNumber(question.score),
    prompt: question.prompt || '',
    instructionText: question.instructionText || '',
    imageUrl: (question.imageUrl || '').trim(),
    mode: normalizeInstructionMode(question.mode),
    draggableObject: normalizeDraggableObject(question.draggableObject),
    autoPlay: question.autoPlay !== false,
    targets,
    correctTargetId: question.correctTargetId || (targets[0] ? targets[0].id : '')
  };
}

function createValidationResult(isValid, message = '') {
  return { isValid, message };
}

function validateInstructionQuestion(question = {}, index = 0) {
  if (question.type !== 'listen_follow_instruction') {
    return createValidationResult(true);
  }

  const normalized = normalizeInstructionQuestion(question);
  const questionPrefix = `第 ${Number(index) + 1} 题“听音做指令”`;
  const hasTargets = normalized.targets.length > 0;
  const rawCorrectTargetId = String(question.correctTargetId || '').trim();
  const hasCorrectTarget = Boolean(rawCorrectTargetId)
    && normalized.targets.some((target) => target.id === rawCorrectTargetId);

  if (!normalized.imageUrl) {
    return createValidationResult(false, `${questionPrefix}还没有上传场景图，不能保存。`);
  }

  if (!hasTargets) {
    return createValidationResult(false, `${questionPrefix}还没有设置目标区域，不能保存。`);
  }

  if (!hasCorrectTarget) {
    return createValidationResult(false, `${questionPrefix}还没有设置正确答案，不能保存。`);
  }

  return createValidationResult(true);
}

module.exports = {
  DEFAULT_DRAGGABLE_OBJECT,
  INSTRUCTION_MODE_DRAG_PLACE,
  INSTRUCTION_MODE_TAP,
  SAMPLE_INSTRUCTION_IMAGE,
  createRectTarget,
  parseTargets,
  normalizeDraggableObject,
  normalizeInstructionMode,
  normalizeInstructionQuestion,
  validateInstructionQuestion,
  findTargetByPoint
};
