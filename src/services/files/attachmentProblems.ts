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
  | 'failed'

const BY_CODE: Readonly<Record<string, AttachmentProblem>> = {
  upload_too_large: 'tooLarge',
  upload_type_not_supported: 'unsupported',
  upload_content_mismatch: 'unsupported',
  upload_invalid: 'unsupported',
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
