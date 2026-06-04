let pdfjsPromise = null;

export async function loadPdfPagePreviews(file) {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.25 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    pages.push({
      pageNumber,
      previewDataUrl: canvas.toDataURL('image/png')
    });
  }

  return pages;
}

export function createDeleteThumbnailMarkup(pages, selectedPageNumbers) {
  return pages
    .map((page) => `
      <button
        class="thumbnail-card ${selectedPageNumbers.has(page.pageNumber) ? 'thumbnail-card-selected' : ''}"
        type="button"
        data-thumbnail-page="${page.pageNumber}"
      >
        <img src="${page.previewDataUrl}" alt="第 ${page.pageNumber} 页缩略图" />
        <span>第 ${page.pageNumber} 页</span>
      </button>
    `)
    .join('');
}

export function createReorderThumbnailMarkup(pages) {
  return pages
    .map((page, index) => `
      <div
        class="thumbnail-card thumbnail-reorder-card"
        draggable="true"
        data-reorder-page="${page.pageNumber}"
        data-reorder-index="${index}"
      >
        <img src="${page.previewDataUrl}" alt="第 ${page.pageNumber} 页缩略图" />
        <span>第 ${page.pageNumber} 页</span>
        <div class="thumbnail-reorder-actions">
          <button class="table-action-button" type="button" data-thumbnail-move="${page.pageNumber}" data-thumbnail-offset="-1" ${index === 0 ? 'disabled' : ''}>上移</button>
          <button class="table-action-button" type="button" data-thumbnail-move="${page.pageNumber}" data-thumbnail-offset="1" ${index === pages.length - 1 ? 'disabled' : ''}>下移</button>
        </div>
      </div>
    `)
    .join('');
}

async function getPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.mjs').then((module) => {
      module.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.mjs';
      return module;
    });
  }

  return pdfjsPromise;
}
