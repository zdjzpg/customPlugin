function parsePageSelection(conversionKey, conversionOptions = {}) {
  if (conversionKey === 'pdf_extract_pages') {
    return {
      orderedPages: readExtractPages(conversionOptions)
    };
  }

  if (conversionKey === 'split_pdf') {
    return {
      outputs: readSplitOutputs(conversionOptions)
    };
  }

  return null;
}

function readExtractPages(conversionOptions) {
  const rangeText = readRangeText(conversionOptions);
  if (rangeText) {
    return parsePageExpression(rangeText, '页码范围格式不正确，请按 1,3,5-8 填写。');
  }

  const structuredRanges = readStructuredRanges(conversionOptions, '页码范围格式不正确，请检查起始页和结束页。');
  if (structuredRanges.length > 0) {
    return structuredRanges.flatMap((range) => expandRange(range.startPage, range.endPage));
  }

  throw createValidationError('请先填写要提取的页码范围。');
}

function readSplitOutputs(conversionOptions) {
  const rangeText = readRangeText(conversionOptions);
  if (rangeText) {
    const lines = rangeText
      .split(/\r?\n|;/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw createValidationError('请先填写要拆分的页码范围。');
    }

    return lines.map((line) =>
      parsePageExpression(line, '拆分范围格式不正确，请按每行一个范围填写，例如 1-3。')
    );
  }

  const structuredRanges = readStructuredRanges(
    conversionOptions,
    '拆分范围格式不正确，请检查起始页和结束页。'
  );
  if (structuredRanges.length > 0) {
    return structuredRanges.map((range) => expandRange(range.startPage, range.endPage));
  }

  throw createValidationError('请先填写要拆分的页码范围。');
}

function readRangeText(conversionOptions) {
  return typeof conversionOptions?.rangeText === 'string' ? conversionOptions.rangeText.trim() : '';
}

function readStructuredRanges(conversionOptions, errorMessage) {
  if (!Array.isArray(conversionOptions?.structuredRanges)) {
    return [];
  }

  return conversionOptions.structuredRanges.map((range) => {
    const startPage = toPositiveInteger(range?.startPage);
    const endPage = toPositiveInteger(range?.endPage ?? range?.startPage);

    if (!startPage || !endPage || startPage > endPage) {
      throw createValidationError(errorMessage);
    }

    return {
      startPage,
      endPage
    };
  });
}

function parsePageExpression(input, errorMessage) {
  const tokens = String(input)
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw createValidationError(errorMessage);
  }

  return tokens.flatMap((token) => parsePageToken(token, errorMessage));
}

function parsePageToken(token, errorMessage) {
  if (/^\d+$/.test(token)) {
    const pageNumber = toPositiveInteger(token);
    if (!pageNumber) {
      throw createValidationError(errorMessage);
    }
    return [pageNumber];
  }

  const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!rangeMatch) {
    throw createValidationError(errorMessage);
  }

  const startPage = toPositiveInteger(rangeMatch[1]);
  const endPage = toPositiveInteger(rangeMatch[2]);
  if (!startPage || !endPage || startPage > endPage) {
    throw createValidationError(errorMessage);
  }

  return expandRange(startPage, endPage);
}

function expandRange(startPage, endPage) {
  const pages = [];
  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }
  return pages;
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function createValidationError(message) {
  const error = new Error(message);
  error.reason = 'INVALID_PAGE_SELECTION';
  error.statusCode = 400;
  return error;
}

module.exports = {
  parsePageSelection
};
