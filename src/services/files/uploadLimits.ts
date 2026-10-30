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

/**
 * The photos the browser turns into a JPEG of its own before anything goes up
 * (#508): the backend's images, and an iPhone's HEIC, which the backend never
 * sees. The media types each may declare; a browser that names none leaves it
 * to the decoder.
 */
export const PREPARED_IMAGE_TYPES: Readonly<Record<string, readonly string[]>> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  heic: ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'],
  heif: ['image/heif', 'image/heic', 'image/heif-sequence', 'image/heic-sequence'],
}

/**
 * A photo as chosen, before it is shrunk. What goes up is a JPEG of at most
 * 1568 px a side, far under `IMAGE_MAX_BYTES`; this only keeps the browser
 * from decoding a file no phone or screenshot comes near.
 */
export const IMAGE_SOURCE_MAX_BYTES = 30 * 1024 * 1024

/** For the file chooser's `accept`, so the picker offers only what can be sent. */
export const ACCEPT_ATTRIBUTE = [...new Set([...Object.keys(MIME_BY_EXTENSION), ...Object.keys(PREPARED_IMAGE_TYPES)])]
  .map((extension) => `.${extension}`)
  .join(',')

/**
 * For the camera's `accept` (#509). With `capture`, a phone opens the camera
 * for an image type; what it takes is a JPEG (a HEIC on some iPhones), which
 * `PREPARED_IMAGE_TYPES` covers. Anything else `rejectionFor` refuses as it
 * would from the chooser.
 */
export const CAMERA_ACCEPT_ATTRIBUTE = 'image/*'

/**
 * For a chooser that offers photos only: the phone's page a QR opens (#514),
 * which sends nothing else.
 */
export const PHOTO_ACCEPT_ATTRIBUTE = Object.keys(PREPARED_IMAGE_TYPES)
  .map((extension) => `.${extension}`)
  .join(',')

/** A photo the browser prepares before it goes up (#508). */
export function isPreparedImage(filename: string) {
  return Object.prototype.hasOwnProperty.call(PREPARED_IMAGE_TYPES, extensionOf(filename))
}

export function extensionOf(filename: string) {
  return filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : ''
}

/** The size the backend would allow this file, by its extension. */
export function maxBytesFor(filename: string) {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(extensionOf(filename))
    ? IMAGE_MAX_BYTES
    : DOCUMENT_MAX_BYTES
}

/**
 * Why this file cannot go out, before anything is sent; `null` when it can. A
 * photo is held against what the browser can prepare; what it prepares is held
 * against the backend's own limits again before it goes up.
 */
export function rejectionFor(file: File): 'unsupported' | 'tooLarge' | 'empty' | null {
  if (isPreparedImage(file.name)) {
    if (file.type && !PREPARED_IMAGE_TYPES[extensionOf(file.name)].includes(file.type)) return 'unsupported'
    if (file.size <= 0) return 'empty'
    if (file.size > IMAGE_SOURCE_MAX_BYTES) return 'tooLarge'
    return null
  }
  return uploadRejectionFor(file)
}

/** Why the backend would refuse this file as it is, by its own table; `null` when it would not. */
export function uploadRejectionFor(file: File): 'unsupported' | 'tooLarge' | 'empty' | null {
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
