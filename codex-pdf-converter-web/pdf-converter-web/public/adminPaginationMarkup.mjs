export function createAdminPaginationMarkup(input) {
  const {
    sectionKey,
    currentPage = 1,
    totalPages = 1,
    totalItems = 0
  } = input || {};

  const safeCurrentPage = Math.max(1, currentPage);
  const safeTotalPages = Math.max(1, totalPages);
  const pageButtons = buildVisiblePageNumbers(safeCurrentPage, safeTotalPages)
    .map((pageNumber) => `
      <button
        class="admin-pagination-number ${pageNumber === safeCurrentPage ? 'admin-pagination-number-active' : ''}"
        type="button"
        data-admin-page-section="${escapeHtml(sectionKey || '')}"
        data-admin-page-number="${pageNumber}"
      >
        ${pageNumber}
      </button>
    `)
    .join('');

  return `
    <div class="admin-pagination" data-admin-pagination="${escapeHtml(sectionKey || '')}">
      <div class="admin-pagination-summary">
        <span>共 ${escapeHtml(totalItems)} 条</span>
        <span>第 ${escapeHtml(safeCurrentPage)} / ${escapeHtml(safeTotalPages)} 页</span>
      </div>
      <div class="admin-pagination-actions">
        <button
          class="admin-pagination-button"
          type="button"
          data-admin-page-section="${escapeHtml(sectionKey || '')}"
          data-admin-page-action="prev"
          ${safeCurrentPage <= 1 ? 'disabled' : ''}
        >
          上一页
        </button>
        ${pageButtons}
        <button
          class="admin-pagination-button"
          type="button"
          data-admin-page-section="${escapeHtml(sectionKey || '')}"
          data-admin-page-action="next"
          ${safeCurrentPage >= safeTotalPages ? 'disabled' : ''}
        >
          下一页
        </button>
      </div>
    </div>
  `;
}

function buildVisiblePageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_item, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_item, index) => start + index);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
