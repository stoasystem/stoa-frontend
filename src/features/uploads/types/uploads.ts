export type UploadContext =
  | 'chat'
  | 'question_bank'
  | 'question_session'
  | 'practice_path'
  | 'support'
  | 'demo'

export type UploadFileKind = 'image' | 'pdf' | 'document' | 'unknown'

export type UploadStatus =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'rejected'

export type UploadAttachment = {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  kind: UploadFileKind
  status: UploadStatus
  previewUrl?: string
  uploadedUrl?: string
  errorMessage?: string
  createdAt: string
  context: UploadContext
  sourcePage?: string
  sourceEntityId?: string
}

export type UploadValidationError = {
  fileName: string
  code:
    | 'unsupported_type'
    | 'file_too_large'
    | 'too_many_files'
    | 'empty_file'
    | 'unknown'
  message: string
}

export type UploadConfig = {
  acceptedMimeTypes: string[]
  maxFileSizeMb: number
  maxFiles: number
  allowMultiple: boolean
}

export type UploadSourceOptions = {
  conversationId?: string
  sourcePage?: string
  sourceEntityId?: string
}
