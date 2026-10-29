import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'
import type {
  CompleteUploadResponse,
  UploadIntentResponse,
  UploadPartUrlResponse,
  UploadPurpose,
  UploadedFile,
  ValidatedUpload,
} from '@/types/file'

export class UploadRejectedError extends Error {
  readonly reason: 'too_large' | 'unsupported_type'

  constructor(reason: 'too_large' | 'unsupported_type', message: string) {
    super(message)
    this.name = 'UploadRejectedError'
    this.reason = reason
  }
}

async function createUploadIntent(file: File, purpose: UploadPurpose) {
  const response = await httpClient.post<UploadIntentResponse>('/files/intents', {
    purpose,
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  })
  return response.data
}

/** A part's SHA-256, as the parts route takes it: lower-case hex. */
async function sha256Hex(chunk: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await chunk.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function requestPartUrl(uploadId: string, partNumber: number, sizeBytes: number, checksumSha256: string) {
  const response = await httpClient.post<UploadPartUrlResponse>(apiPath`/files/${uploadId}/parts/${partNumber}`, {
    sizeBytes,
    checksumSha256,
  })
  return response.data
}

/** A part S3 would not take, on the URL signed for it and on a fresh one. */
export class UploadPartError extends Error {
  constructor(partNumber: number, status: number | null) {
    super(`S3 did not take part ${partNumber}${status === null ? '' : ` (${status})`}.`)
    this.name = 'UploadPartError'
  }
}

/** Asked for once, and once more after S3 turned the first URL down. */
const PART_ATTEMPTS = 2

/**
 * One part, straight to S3 (#516; ADR-004, stoa-backend#152). Its bytes never
 * pass the API: through API Gateway and Lambda a 5 MiB part, base64-encoded,
 * is past Lambda's 6 MB request limit. The API only signs a URL for this
 * part's exact length and SHA-256.
 *
 * The URL lasts 300 s, so it is asked for right before its PUT, never all of
 * them up front: on a slow line the last of ten would be stale before it went.
 * The PUT is a bare `fetch`, not `httpClient`, which would add the API's base
 * path and the student's `Authorization` -- neither belongs on S3. It carries
 * exactly the headers the URL was signed with; the browser adds the length.
 * Asking again for the same bytes is safe, so a part S3 turns down (an expired
 * URL is a 403) is asked for once more and sent again.
 */
async function putPart(uploadId: string, partNumber: number, chunk: Blob) {
  const checksumSha256 = await sha256Hex(chunk)
  let status: number | null = null
  for (let attempt = 1; attempt <= PART_ATTEMPTS; attempt += 1) {
    const part = await requestPartUrl(uploadId, partNumber, chunk.size, checksumSha256)
    try {
      const response = await fetch(part.url, {
        method: 'PUT',
        headers: part.headers,
        body: chunk,
        credentials: 'omit',
      })
      if (response.ok) return
      status = response.status
    } catch {
      // The connection itself failed; the next attempt asks for a fresh URL too.
      status = null
    }
  }
  throw new UploadPartError(partNumber, status)
}

async function completeUpload(uploadId: string, partCount: number) {
  const response = await httpClient.post<CompleteUploadResponse>(
    apiPath`/files/${uploadId}/complete`,
    { partCount },
  )
  return response.data
}

/**
 * Upload one file through the intent, part and complete steps the API defines.
 *
 * What comes back is the upload, not an attachment: `complete` answers
 * `{"status":"validated","attachment":null}` by design, and the attachment is
 * made when a message carries `{uploadId}` (stoa-backend `complete_upload`,
 * `SendMessageRequest.attachmentIds`; #495, #507). Any other status is not
 * done, and is thrown.
 */
export async function uploadFile({
  file,
  purpose = 'conversation_attachment',
}: {
  file: File
  purpose?: UploadPurpose
}): Promise<ValidatedUpload> {
  const intent = await createUploadIntent(file, purpose)

  if (file.size > intent.maxBytes) {
    throw new UploadRejectedError('too_large', `File exceeds ${intent.maxBytes} bytes.`)
  }
  if (intent.acceptedTypes.length > 0 && !intent.acceptedTypes.includes(file.type)) {
    throw new UploadRejectedError('unsupported_type', `${file.type || 'unknown'} is not accepted.`)
  }

  const partCount = Math.max(1, Math.ceil(file.size / intent.chunkBytes))
  for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
    const start = (partNumber - 1) * intent.chunkBytes
    await putPart(intent.uploadId, partNumber, file.slice(start, start + intent.chunkBytes))
  }

  // A file that does not pass is refused with a 422 and its code, not answered
  // with a status; anything but `validated` here is not done.
  const completed = await completeUpload(intent.uploadId, partCount)
  if (completed.status !== 'validated') {
    throw new Error(`Upload finished with status ${completed.status}.`)
  }

  return {
    uploadId: completed.uploadId,
    expiresAt: intent.expiresAt,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  }
}

export async function getUploadedFile(attachmentId: string) {
  const response = await httpClient.get<UploadedFile>(apiPath`/files/attachments/${attachmentId}`)
  return response.data
}

export async function deleteUploadedFile(attachmentId: string) {
  await httpClient.delete(apiPath`/files/attachments/${attachmentId}`)
}
