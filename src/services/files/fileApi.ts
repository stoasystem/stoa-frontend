import { apiPath } from '@/services/api/apiPath'
import { ApiError, httpClient } from '@/services/api/httpClient'
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

async function createUploadIntent(file: File, purpose: UploadPurpose, signal?: AbortSignal) {
  const response = await httpClient.post<UploadIntentResponse>(
    '/files/intents',
    {
      purpose,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    },
    { signal },
  )
  return response.data
}

/** A part's SHA-256, as the parts route takes it: lower-case hex. */
async function sha256Hex(chunk: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await chunk.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** The API could not answer, rather than refused: a dropped line or a 5xx. */
const mayAskAgain = (error: unknown) =>
  !(error instanceof ApiError) || error.status === undefined || error.status >= 500

/** Where one part's bytes go: the URL the API signed and the headers it was signed with. */
export type SignedPart = Pick<UploadPartUrlResponse, 'url' | 'headers'>

/**
 * Asks the API to sign one part's URL for its exact length and SHA-256: under
 * the student's session for `/files` here, under the phone's upload token for
 * `/upload-codes` (#514).
 */
export type PartSigner = (
  partNumber: number,
  part: { sizeBytes: number; checksumSha256: string },
  signal?: AbortSignal,
) => Promise<SignedPart>

/**
 * A part's URL, asked for again once when the API could not answer. A refusal
 * -- `409 upload_chunk_conflict`, a 422 -- is the answer, and is thrown.
 */
async function requestPartUrl(
  sign: PartSigner,
  partNumber: number,
  part: { sizeBytes: number; checksumSha256: string },
  signal?: AbortSignal,
) {
  try {
    return await sign(partNumber, part, signal)
  } catch (error) {
    if (signal?.aborted || !mayAskAgain(error)) throw error
    return sign(partNumber, part, signal)
  }
}

/** A part of an upload this student's session opened, signed under that session. */
const signFilePart =
  (uploadId: string): PartSigner =>
  async (partNumber, part, signal) => {
    const response = await httpClient.post<UploadPartUrlResponse>(
      apiPath`/files/${uploadId}/parts/${partNumber}`,
      part,
      { signal },
    )
    return response.data
  }

/** A part S3 would not take, on the URL signed for it and on a fresh one. */
export class UploadPartError extends Error {
  constructor(partNumber: number, status: number | null) {
    super(`S3 did not take part ${partNumber}${status === null ? '' : ` (${status})`}.`)
    this.name = 'UploadPartError'
  }
}

/** Taken out of the tray: nothing more of it is sent. */
function stopIfTakenOut(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
}

/** Asked for once, and once more after S3 turned the first URL down. */
const PART_ATTEMPTS = 2

/**
 * How long one part's PUT may take: 5 MiB at about 0.4 Mbit/s, a poor mobile
 * line. Past it the PUT is let go and tried once more on a fresh URL, rather
 * than holding the file -- and the question -- at "adding" for good.
 */
export const PART_PUT_LIMIT_MS = 120_000

/**
 * One part, straight to S3 (#516; the backend's ADR-004, stoa-backend#152). Its
 * bytes never pass the API: through API Gateway and Lambda a 5 MiB part,
 * base64-encoded, is past Lambda's 6 MB request limit. The API only signs a
 * URL for this part's exact length and SHA-256.
 *
 * The URL lasts 300 s, so it is asked for right before its PUT, never all of
 * them up front: on a slow line the last of ten would be stale before it went.
 * The PUT is a bare `fetch`, not `httpClient`, which would add the API's base
 * path and the student's `Authorization` -- neither belongs on S3. It carries
 * exactly the headers the URL was signed with; the browser adds the length.
 * Asking again for the same bytes is safe, so a part S3 turns down (an expired
 * URL is a 403), or one that failed or took too long to go, is asked for once
 * more and sent again. `signal` lets it go at once, when the file is taken out.
 */
async function putPart(sign: PartSigner, partNumber: number, chunk: Blob, signal?: AbortSignal) {
  const checksumSha256 = await sha256Hex(chunk)
  let status: number | null = null
  for (let attempt = 1; attempt <= PART_ATTEMPTS; attempt += 1) {
    stopIfTakenOut(signal)
    const part = await requestPartUrl(sign, partNumber, { sizeBytes: chunk.size, checksumSha256 }, signal)
    const put = new AbortController()
    const letGo = () => put.abort()
    signal?.addEventListener('abort', letGo, { once: true })
    const timer = setTimeout(letGo, PART_PUT_LIMIT_MS)
    try {
      const response = await fetch(part.url, {
        method: 'PUT',
        headers: part.headers,
        body: chunk,
        credentials: 'omit',
        signal: put.signal,
      })
      if (response.ok) return
      status = response.status
    } catch {
      // The connection failed, or the PUT ran out of time; the next attempt
      // asks for a fresh URL too. Taken out is taken out: nothing more is sent.
      stopIfTakenOut(signal)
      status = null
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', letGo)
    }
  }
  throw new UploadPartError(partNumber, status)
}

/**
 * Every part of `file`, in order, `chunkBytes` each, straight to S3; the
 * number of parts sent, which `complete` is told.
 */
export async function putParts(file: Blob, chunkBytes: number, sign: PartSigner, signal?: AbortSignal) {
  const partCount = Math.max(1, Math.ceil(file.size / chunkBytes))
  for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
    const start = (partNumber - 1) * chunkBytes
    await putPart(sign, partNumber, file.slice(start, start + chunkBytes), signal)
  }
  return partCount
}

async function completeUpload(uploadId: string, partCount: number, signal?: AbortSignal) {
  const response = await httpClient.post<CompleteUploadResponse>(
    apiPath`/files/${uploadId}/complete`,
    { partCount },
    { signal },
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
 * done, and is thrown. `signal` stops it wherever it is, when the file is
 * taken out of the tray.
 */
export async function uploadFile({
  file,
  purpose = 'conversation_attachment',
  signal,
}: {
  file: File
  purpose?: UploadPurpose
  signal?: AbortSignal
}): Promise<ValidatedUpload> {
  const intent = await createUploadIntent(file, purpose, signal)

  if (file.size > intent.maxBytes) {
    throw new UploadRejectedError('too_large', `File exceeds ${intent.maxBytes} bytes.`)
  }
  if (intent.acceptedTypes.length > 0 && !intent.acceptedTypes.includes(file.type)) {
    throw new UploadRejectedError('unsupported_type', `${file.type || 'unknown'} is not accepted.`)
  }

  const partCount = await putParts(file, intent.chunkBytes, signFilePart(intent.uploadId), signal)

  // A file that does not pass is refused with a 422 and its code, not answered
  // with a status; anything but `validated` here is not done.
  const completed = await completeUpload(intent.uploadId, partCount, signal)
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
