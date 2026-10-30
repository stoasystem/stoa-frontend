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

/**
 * `UploadCodeResponse`: a fresh code for a phone to put one photo into a
 * conversation with (stoa-backend#146). `code` is in this response only; the
 * QR carries it, and nothing stores it.
 */
export type UploadCode = {
  codeId: string
  code: string
  expiresAt: string
}

/** `UploadCodeStatus`: how far the phone has got. */
export type UploadCodeStatus = 'waiting' | 'uploading' | 'ready' | 'failed' | 'expired'

/**
 * `UploadCodeStatusResponse`. `redeemedAt` is when a phone took the code;
 * `uploadId` comes only at `ready`, once the photo has passed. `expiresAt` is
 * the code's until a phone takes it, then the phone's upload token's.
 */
export type UploadCodeState = {
  codeId: string
  status: UploadCodeStatus
  expiresAt: string
  redeemedAt?: string | null
  uploadId?: string | null
}

/**
 * `UploadCodeRedeemResponse`: what the phone carries for the rest of its one
 * upload. The token, not the code, signs every part and the completion.
 */
export type UploadCodeRedemption = {
  uploadToken: string
  expiresAt: string
  maxBytes: number
  chunkBytes: number
  acceptedTypes: string[]
}
