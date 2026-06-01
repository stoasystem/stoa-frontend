export function formatUploadFileSize(sizeBytes: number) {
  if (sizeBytes <= 0) return '0 KB'

  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

export function megabytesToBytes(sizeMb: number) {
  return sizeMb * 1024 * 1024
}
