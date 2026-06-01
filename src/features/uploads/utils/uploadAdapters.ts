import type { UploadAttachment } from '@/features/uploads/types/uploads'
import type { UploadedFile, UploadedFileStatus } from '@/types/file'

function toUploadedFileStatus(status: UploadAttachment['status']): UploadedFileStatus {
  if (status === 'failed') return 'failed'
  if (status === 'uploading' || status === 'validating') return 'processing'
  return 'uploaded'
}

export function uploadAttachmentToUploadedFile(attachment: UploadAttachment): UploadedFile {
  return {
    id: attachment.id,
    filename: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.fileSize,
    status: toUploadedFileStatus(attachment.status),
    createdAt: attachment.createdAt,
  }
}
