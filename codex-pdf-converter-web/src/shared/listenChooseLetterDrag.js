function createEmptyDragState() {
  return {
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
  };
}

function normalizeRect(rect = {}) {
  return {
    left: Number(rect.left) || 0,
    top: Number(rect.top) || 0,
    width: Number(rect.width) || 0,
    height: Number(rect.height) || 0
  };
}

function buildDragState({ item, clientX, clientY, rect }) {
  const safeRect = normalizeRect(rect);

  return {
    ...createEmptyDragState(),
    id: item?.id || '',
    letter: item?.letter || '',
    startX: clientX,
    startY: clientY,
    pointerX: clientX,
    pointerY: clientY,
    pointerOffsetX: clientX - safeRect.left,
    pointerOffsetY: clientY - safeRect.top
  };
}

function getDragGhostPosition(dragState = createEmptyDragState()) {
  return {
    left: dragState.pointerX - dragState.pointerOffsetX,
    top: dragState.pointerY - dragState.pointerOffsetY
  };
}

module.exports = {
  createEmptyDragState,
  buildDragState,
  getDragGhostPosition
};
