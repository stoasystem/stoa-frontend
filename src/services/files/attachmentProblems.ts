import { ApiError } from '@/services/api/httpClient'
import { ImagePreparationError } from '@/services/files/prepareImage'
import { UploadRejectedError } from '@/services/files/fileApi'

/**
 * What went wrong with a file, in the few words a student can act on.
 *
 * The upload API answers with a closed set of stable codes beside its English
 * prose (`stoa-backend/src/stoa/security/attachment_errors.py`, raised under
 * `detail` by `files.py::_raise_safe`, so `ApiError.code` carries it). Only the
 * code is read: the server's sentence is written for whoever wrote the request
 * and never reaches the screen. A code nobody here knows falls back to
 * `failed`, which says the file was not added and to try again -- true of every
 * one of them.
 */
export type AttachmentProblem =
  | 'tooLarge'
  | 'unsupported'
  | 'empty'
  | 'expired'
  | 'quota'
  | 'unavailable'
  | 'tooMany'
  | 'unreadable'
  | 'blocked'
  | 'failed'

const BY_CODE: Readonly<Record<string, AttachmentProblem>> = {
  upload_too_large: 'tooLarge',
  upload_type_not_supported: 'unsupported',
  upload_content_mismatch: 'unsupported',
  // Also what `complete` answers when a part never reached S3 (#516): "this
  // kind cannot be sent" would be wrong there; "not added, try again" is true
  // of both.
  upload_invalid: 'failed',
  // Image moderation turned the picture down (stoa-backend#138). It is final --
  // there is no appeal, and sending it again is refused as `upload_not_found`
  // -- so the sentence offers another picture or words, never "try again".
  upload_content_blocked: 'blocked',
  upload_not_found: 'expired',
  upload_expired: 'expired',
  upload_chunk_conflict: 'expired',
  attachment_in_use: 'expired',
  storage_quota_exceeded: 'quota',
  upload_service_unavailable: 'unavailable',
}

export function problemFor(error: unknown): AttachmentProblem {
  // The browser could not open the photo to shrink it (#508).
  if (error instanceof ImagePreparationError) return 'unreadable'
  if (error instanceof UploadRejectedError) {
    return error.reason === 'too_large' ? 'tooLarge' : 'unsupported'
  }
  if (error instanceof ApiError) {
    const known = error.code ? BY_CODE[error.code] : undefined
    if (known) return known
    if (error.status === 503) return 'unavailable'
  }
  return 'failed'
}

/**
 * What stopped a photo sent by QR (#514): an attachment's problems, and two of
 * the code's own.
 *
 * Every refusal of a code or its upload token -- wrong, already used, past its
 * ten minutes, its account in deletion -- is the same `404
 * upload_code_invalid`, so a guesser learns nothing (stoa-backend#146): one
 * sentence covers expired and used. Too many refusals from one address is
 * `429 upload_code_rate_limited`; API Gateway's own throttle answers 429 too,
 * with `{"message":"Too Many Requests"}` and no code (stoa-infra#10), so the
 * status alone is read.
 */
export type PhoneUploadProblem = AttachmentProblem | 'codeInvalid' | 'rateLimited'

export function phoneUploadProblemFor(error: unknown): PhoneUploadProblem {
  if (error instanceof ApiError) {
    if (error.code === 'upload_code_invalid') return 'codeInvalid'
    if (error.status === 429 || error.code === 'upload_code_rate_limited') return 'rateLimited'
  }
  return problemFor(error)
}
