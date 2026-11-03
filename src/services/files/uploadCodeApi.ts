import { PHONE_UPLOAD_PATH } from '@/app/router/routeManifest'
import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'
import { UploadRejectedError, putParts, type PartSigner, type SignedPart } from '@/services/files/fileApi'
import type { UploadCode, UploadCodeRedemption, UploadCodeState } from '@/types/file'

/**
 * A photo from the phone into Ask on the computer, by QR (#514; the backend's
 * stoa-backend#146).
 *
 * The computer, signed in, makes a one-time code and shows it as a QR. The
 * code is made for no conversation (stoa-backend#191, #554): a student about to
 * ask a new question photographs it first, and the photo goes with whichever
 * question it is added to, like a file chosen on the computer. The phone,
 * signed in or not, presents the code once to `redeem` and is handed an upload
 * token; that token, never the code again, signs each part and the completion.
 * The computer follows the code by the upload it reserved; once the photo has
 * passed, the computer shows it and the student chooses to add it.
 *
 * Both secrets travel in request bodies only. On the phone the code arrives
 * after the `#` of the QR's address, which no request carries (`phoneUploadUrl`).
 */

/**
 * The QR's address: the code after the `#`. A fragment stays in the browser,
 * so the code never reaches the server, CloudFront's logs or a `Referer`
 * (stoa-backend#171, audit item I6). Never a path segment or a query.
 */
export function phoneUploadUrl(code: string, origin = window.location.origin) {
  return `${origin}${PHONE_UPLOAD_PATH}#${code}`
}

// ---- the computer ----------------------------------------------------------

export async function createUploadCode() {
  const response = await httpClient.post<UploadCode>('/upload-codes')
  return response.data
}

/** How far the phone has got, by the upload the code reserved. */
export async function readUploadCode(uploadId: string, signal?: AbortSignal) {
  const response = await httpClient.get<UploadCodeState>(apiPath`/files/${uploadId}/phone-code`, { signal })
  return response.data
}

/**
 * The photo the phone sent, once it has passed, for the student to look at
 * before it is added. Whoever scans the QR first holds the code, so a `ready`
 * upload is never added unseen (stoa-backend#171, audit item M1). The route
 * wants the session's token, so it is read as a blob, not put in an `<img>`.
 */
export async function readUploadCodePhoto(uploadId: string, signal?: AbortSignal) {
  const response = await httpClient.get<Blob>(apiPath`/files/${uploadId}/phone-code/content`, {
    responseType: 'blob',
    signal,
  })
  return response.data
}

// ---- the phone -------------------------------------------------------------

/**
 * Spends the code on one upload of `file`. Called once per code: a second
 * redemption of the same code is refused as `upload_code_invalid`, so whoever
 * calls this keeps what it returns and sends every part and the completion
 * with it, through retries too (`sendWithUploadToken`).
 *
 * The backend checks the photo's name, type and size before it spends the
 * code, so a photo it would refuse costs nothing.
 */
export async function redeemUploadCode(code: string, file: File, signal?: AbortSignal) {
  const response = await httpClient.post<UploadCodeRedemption>(
    '/upload-codes/redeem',
    { code, filename: file.name, contentType: file.type, sizeBytes: file.size },
    { signal },
  )
  return response.data
}

/** Each part signed under the upload token, never the student's session. */
const signTokenPart =
  (uploadToken: string): PartSigner =>
  async (partNumber, part, signal) => {
    const response = await httpClient.post<SignedPart>(
      apiPath`/upload-codes/parts/${partNumber}`,
      { uploadToken, ...part },
      { signal },
    )
    return response.data
  }

/**
 * Sends the photo the code was redeemed for, straight to S3 like any upload
 * (#516), and completes it, which is where moderation reads it (#138). Safe to
 * call again with the same redemption and file after a part or the completion
 * failed: the parts are signed and sent again, and nothing is redeemed twice.
 */
export async function sendWithUploadToken(redemption: UploadCodeRedemption, file: File, signal?: AbortSignal) {
  if (file.size > redemption.maxBytes) {
    throw new UploadRejectedError('too_large', `File exceeds ${redemption.maxBytes} bytes.`)
  }
  if (!redemption.acceptedTypes.includes(file.type)) {
    throw new UploadRejectedError('unsupported_type', `${file.type || 'unknown'} is not accepted.`)
  }
  const partCount = await putParts(file, redemption.chunkBytes, signTokenPart(redemption.uploadToken), signal)
  const response = await httpClient.post<{ status: string }>(
    '/upload-codes/complete',
    { uploadToken: redemption.uploadToken, partCount },
    { signal },
  )
  if (response.data.status !== 'validated') {
    throw new Error(`Upload finished with status ${response.data.status}.`)
  }
}
