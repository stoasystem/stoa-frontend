export type UploadedFileStatus = 'uploaded' | 'processing' | 'parsed' | 'failed'

/** `help_reply_image` is a teacher's, and only a teacher's (stoa-backend#145). */
export type UploadPurpose = 'question_image' | 'conversation_attachment' | 'help_reply_image'

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

/**
 * `UploadPartUrlResponse`: where one part's bytes go, on S3, and the headers
 * the PUT must carry. The URL is signed for this part's exact length and
 * SHA-256, and lasts 300 s (stoa-backend#152, ADR-004).
 */
export type UploadPartUrlResponse = {
  uploadId: string
  partNumber: number
  url: string
  method: 'PUT'
  headers: Record<string, string>
  expiresAt: string
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
  /** Always `null` from `complete`: the attachment is made when a message carries the upload. */
  attachment?: AttachmentSummary | null
}

/**
 * A file that went up whole and passed the server's checks, not yet an
 * attachment of anything. `complete` answers `validated` with no attachment;
 * the attachment is made when a message carries `{uploadId}` (#507).
 */
export type ValidatedUpload = {
  uploadId: string
  /**
   * When the upload stops being one a message may carry: the intent's
   * `expiresAt`, validated or not (`UPLOAD_INTENT_TTL_SECONDS`, 30 minutes).
   */
  expiresAt: string
  filename: string
  mimeType: string
  sizeBytes: number
}

/**
 * `AttachmentReference` in the backend's OpenAPI: one entry of a message's
 * `attachmentIds`, naming a validated upload or a saved attachment -- exactly
 * one of the two, or the backend answers 422.
 */
export type AttachmentReference = { uploadId: string } | { attachmentId: string }

/** `ReplyImageReference`: a teacher's reply names only its own validated uploads (stoa-backend#145). */
export type ReplyImageReference = { uploadId: string }
