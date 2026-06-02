export function moveItemByOffset(items, index, offset) {
  const list = Array.from(items || []);
  const nextIndex = index + offset;
  if (index < 0 || index >= list.length || nextIndex < 0 || nextIndex >= list.length) {
    return list;
  }

  const nextList = list.slice();
  const [movedItem] = nextList.splice(index, 1);
  nextList.splice(nextIndex, 0, movedItem);
  return nextList;
}

export function createSelectedFileOrderMarkup(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return '<p class="field-tip">选择多个 PDF 后，可在这里调整合并顺序。</p>';
  }

  return `
    <div class="selected-file-order-list">
      ${files
        .map(
          (file, index) => `
            <div class="selected-file-order-item">
              <span class="selected-file-order-name">${file.name}</span>
              <div class="selected-file-order-actions">
                <button class="table-action-button" type="button" data-move-file-index="${index}" data-move-file-offset="-1" ${index === 0 ? 'disabled' : ''}>上移</button>
                <button class="table-action-button" type="button" data-move-file-index="${index}" data-move-file-offset="1" ${index === files.length - 1 ? 'disabled' : ''}>下移</button>
              </div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}
