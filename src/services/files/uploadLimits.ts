/**
 * What the upload API accepts, read off the backend rather than guessed (#125).
 *
 * Sources, all in `stoa-backend`:
 *   docs/api/openapi.json          UploadIntentRequest / CompleteUploadRequest /
 *                                  SendMessageRequest.attachmentIds (maxItems 8)
 *   src/stoa/config.py             IMAGE_MAX_BYTES 10 MiB, DOCUMENT_MAX_BYTES 50 MiB
 *   src/stoa/services/attachment_service.py  UPLOAD_CHUNK_BYTES 5 MiB,
 *                                  create_upload_intent: the limit is by extension
 *   src/stoa/services/file_validation_service.py  MIME_BY_EXTENSION
 *
 * The intent response repeats `maxBytes`, `chunkBytes` and `acceptedTypes`, and
 * `uploadFile` holds the file against those; these are the same numbers used
 * before the first request, so a file that cannot be sent is refused on the
 * spot instead of after a round trip.
 */

/** `SendMessageRequest.attachmentIds`: at most 8 per message. */
export const ATTACHMENTS_PER_MESSAGE = 8

/** `CompleteUploadRequest.partCount` is capped at 10 parts of `UPLOAD_CHUNK_BYTES`. */
export const UPLOAD_CHUNK_BYTES = 5 * 1024 * 1024
export const UPLOAD_MAX_PARTS = 10

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const DOCUMENT_MAX_BYTES = 50 * 1024 * 1024

/** The extensions `MIME_BY_EXTENSION` knows, and the media type each must declare. */
export const MIME_BY_EXTENSION: Readonly<Record<string, readonly string[]>> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/plain'],
}

/** The images, which carry the smaller limit. */
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const

/** For the file chooser's `accept`, so the picker offers only what can be sent. */
export const ACCEPT_ATTRIBUTE = Object.keys(MIME_BY_EXTENSION)
  .map((extension) => `.${extension}`)
  .join(',')

export function extensionOf(filename: string) {
  return filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : ''
}

/** The size the backend would allow this file, by its extension. */
export function maxBytesFor(filename: string) {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(extensionOf(filename))
    ? IMAGE_MAX_BYTES
    : DOCUMENT_MAX_BYTES
}

/** Why this file cannot go out, before anything is sent; `null` when it can. */
export function rejectionFor(file: File): 'unsupported' | 'tooLarge' | 'empty' | null {
  const allowed = MIME_BY_EXTENSION[extensionOf(file.name)]
  if (!allowed) return 'unsupported'
  // `create_upload_intent` refuses a type that does not match the extension.
  // A browser that names no type at all leaves the check to the server.
  if (file.type && !allowed.includes(file.type)) return 'unsupported'
  if (file.size <= 0) return 'empty'
  if (file.size > maxBytesFor(file.name)) return 'tooLarge'
  return null
}

/** A limit written the way a sentence wants it: "10 MB". */
export function megabytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}
