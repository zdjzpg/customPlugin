export async function serializeBrowserFile(file, readAsDataUrl = defaultReadAsDataUrl) {
  const dataUrl = await readAsDataUrl(file);
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Failed to read file payload');
  }

  return {
    fileName: file.name,
    contentBase64: dataUrl.slice(commaIndex + 1)
  };
}

export function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

function defaultReadAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read file payload'));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file payload'));
    };
    reader.readAsDataURL(file);
  });
}
