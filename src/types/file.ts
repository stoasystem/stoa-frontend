export type UploadedFileStatus = 'uploaded' | 'processing' | 'parsed' | 'failed'

export type UploadedFile = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  status: UploadedFileStatus
  createdAt: string
}
