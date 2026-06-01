export function validateSelectedFiles(files, accepts, limits = {}) {
  const normalizedAccepts = accepts.map((item) => item.toLowerCase());

  const invalidFile = files.find((file) => {
    const extension = getFileExtension(file.name);
    return normalizedAccepts.length > 0 && !normalizedAccepts.includes(extension);
  });

  if (invalidFile) {
    return `当前不支持 ${invalidFile.name} 这个文件格式。`;
  }

  if (limits.maxFileSizeMb) {
    const maxBytes = limits.maxFileSizeMb * 1024 * 1024;
    const tooLargeFile = files.find((file) => file.size > maxBytes);
    if (tooLargeFile) {
      return `${tooLargeFile.name} 超过 ${limits.maxFileSizeMb}MB，请压缩或拆分后再上传。`;
    }
  }

  if (limits.maxTotalFileSizeMb) {
    const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const maxTotalBytes = limits.maxTotalFileSizeMb * 1024 * 1024;
    if (totalBytes > maxTotalBytes) {
      return `本次上传总大小超过 ${limits.maxTotalFileSizeMb}MB，请减少文件数量或先压缩。`;
    }
  }

  return null;
}

function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}
