const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createEmptyDragState,
  buildDragState,
  getDragGhostPosition
} = require('../src/shared/listenChooseLetterDrag');

test('createEmptyDragState returns a fully reset drag payload', () => {
  assert.deepEqual(createEmptyDragState(), {
    id: '',
    letter: '',
    startX: 0,
    startY: 0,
    pointerX: 0,
    pointerY: 0,
    offsetX: 0,
    offsetY: 0,
    pointerOffsetX: 0,
    pointerOffsetY: 0
  });
});

test('buildDragState preserves the pointer offset inside the dragged letter', () => {
  const state = buildDragState({
    item: { id: 'c-0', letter: 'c' },
    clientX: 228,
    clientY: 336,
    rect: { left: 180, top: 300, width: 88, height: 88 }
  });

  assert.equal(state.pointerOffsetX, 48);
  assert.equal(state.pointerOffsetY, 36);
  assert.equal(state.pointerX, 228);
  assert.equal(state.pointerY, 336);
});

test('getDragGhostPosition keeps the original grab point under the cursor while dragging', () => {
  const state = buildDragState({
    item: { id: 'c-0', letter: 'c' },
    clientX: 228,
    clientY: 336,
    rect: { left: 180, top: 300, width: 88, height: 88 }
  });

  assert.deepEqual(getDragGhostPosition(state), { left: 180, top: 300 });

  const movedState = {
    ...state,
    pointerX: 274,
    pointerY: 362
  };

  assert.deepEqual(getDragGhostPosition(movedState), { left: 226, top: 326 });
});
