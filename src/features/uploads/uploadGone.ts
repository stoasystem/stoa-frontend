import { ApiError } from '@/services/api/httpClient'

/**
 * The codes a message or a reply is refused with when an upload it carries is
 * no longer there to make an attachment of: past its 30 minutes, or already
 * sent, or gone. Sending it again cannot help; choosing the file again can
 * (#507, #513). `attachmentProblems.ts` says both as `expired`.
 */
export const UPLOAD_GONE_CODES = ['upload_expired', 'upload_not_found'] as const

const GONE: ReadonlySet<string> = new Set(UPLOAD_GONE_CODES)

/**
 * The server would not take the uploads a message carried, and so took none of
 * it. Not a request's own 404: that one names no upload. Read here once, for a
 * student's question and a teacher's reply alike (#561).
 */
export function isUploadGone(error: unknown): boolean {
  return error instanceof ApiError && error.code !== undefined && GONE.has(error.code)
}
