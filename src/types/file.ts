export type UploadedFileStatus = 'uploaded' | 'processing' | 'parsed' | 'failed'

export type UploadPurpose = 'question_image' | 'conversation_attachment'

export type UploadedFile = {
  id: string
  uploadId?: string
  filename: string
  mimeType: string
  sizeBytes: number
  status: UploadedFileStatus
  createdAt: string
}

export type UploadIntentResponse = {
  uploadId: string
  expiresAt: string
  maxBytes: number
  chunkBytes: number
  acceptedTypes: string[]
  status: string
}

export type AttachmentSummary = {
  attachmentId: string
  filename: string
  mediaType: string
  sizeBytes: number
  status: 'active' | 'deleted'
  createdAt: string
}

export type CompleteUploadResponse = {
  uploadId: string
  status: string
  attachment?: AttachmentSummary | null
}
