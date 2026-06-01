import type { UploadFileKind } from '@/features/uploads/types/uploads'

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp']

export function getUploadFileKind(mimeType: string): UploadFileKind {
  if (imageMimeTypes.includes(mimeType)) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType) return 'document'
  return 'unknown'
}

export function isPreviewableImage(mimeType: string) {
  return imageMimeTypes.includes(mimeType)
}

export function getUploadFileKindLabel(kind: UploadFileKind) {
  if (kind === 'image') return 'Image'
  if (kind === 'pdf') return 'PDF'
  if (kind === 'document') return 'Document'
  return 'File'
}
