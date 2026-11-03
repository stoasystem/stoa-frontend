import { extensionOf } from '@/services/files/uploadLimits'

/**
 * The long edge a photo goes up at (#495, #508). The model shrinks anything
 * larger to this before it reads it, so more is only bytes on a phone's
 * connection, and it keeps the photo under the backend's 4096 px and the
 * upload's part size.
 */
export const IMAGE_LONG_EDGE = 1568

const JPEG_QUALITY = 0.85

/** The browser could not open the photo, or could not write it again. */
export class ImagePreparationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImagePreparationError'
  }
}

const isHeic = (file: File) =>
  ['heic', 'heif'].includes(extensionOf(file.name)) || /^image\/hei[cf]/.test(file.type)

/** heic-to decodes in a worker that a phone short of memory may kill without a word. */
export const HEIC_DECODE_LIMIT_MS = 60_000

/** How much of a JPEG is read for its size: past its EXIF and thumbnail. */
const HEADER_BYTES = 512 * 1024

/**
 * A photo's size as it is shown, read from its header without decoding it:
 * PNG's IHDR, or a JPEG's frame header with its EXIF orientation applied
 * (5 to 8 turn it a quarter, so width and height trade places). `null` when
 * the header is not one of those, or not read as expected.
 */
export async function shownSize(file: Blob): Promise<{ width: number; height: number } | null> {
  const bytes = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer())
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (png.every((byte, index) => bytes[index] === byte) && bytes.length >= 24) {
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let orientation = 1
  let at = 2
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) return null
    const marker = bytes[at + 1]
    const length = view.getUint16(at + 2)
    if (marker === 0xe1 && at + 10 <= bytes.length && view.getUint32(at + 4) === 0x45786966) {
      orientation = exifOrientation(view, at + 10) ?? orientation
    }
    // Start of frame, other than DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      if (at + 9 > bytes.length) return null
      const height = view.getUint16(at + 5)
      const width = view.getUint16(at + 7)
      return orientation >= 5 && orientation <= 8 ? { width: height, height: width } : { width, height }
    }
    at += 2 + length
  }
  return null
}

/** The Orientation tag (0x0112) of the TIFF block an EXIF APP1 holds at `tiff`. */
function exifOrientation(view: DataView, tiff: number): number | null {
  if (tiff + 8 > view.byteLength) return null
  const little = view.getUint16(tiff) === 0x4949
  const ifd = tiff + view.getUint32(tiff + 4, little)
  if (ifd + 2 > view.byteLength) return null
  const entries = view.getUint16(ifd, little)
  for (let index = 0; index < entries; index += 1) {
    const entry = ifd + 2 + index * 12
    if (entry + 12 > view.byteLength) return null
    if (view.getUint16(entry, little) === 0x0112) return view.getUint16(entry + 8, little)
  }
  return null
}

/**
 * The photo as the browser shows it. EXIF orientation is applied, so a photo
 * taken upright stays upright once the EXIF is gone.
 *
 * Decoded at the size it goes up at where the header gives its size: a 48 MP
 * photo decoded whole is some 190 MB of pixels, on a phone. Only the width is
 * named, so the height follows it and the photo keeps its shape whichever way
 * a browser reads the width; one that ignores the option decodes it whole,
 * and the canvas shrinks it as before.
 *
 * HEIC is opened natively where the browser can (Safari); elsewhere `heic-to`
 * opens it, loaded only then, since it carries a 3 MB decoder no other photo
 * needs -- and given `HEIC_DECODE_LIMIT_MS`, so a decoder that died does not
 * leave the file adding forever.
 */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    const size = await shownSize(file)
    const scale = size ? IMAGE_LONG_EDGE / Math.max(size.width, size.height) : 1
    return await createImageBitmap(file, {
      imageOrientation: 'from-image',
      ...(size && scale < 1 ? { resizeWidth: Math.max(1, Math.round(size.width * scale)), resizeQuality: 'high' } : {}),
    })
  } catch {
    if (!isHeic(file)) throw new ImagePreparationError(`${file.name} could not be opened.`)
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    // The build that needs no `unsafe-eval` under the content security policy (#533).
    const { heicTo } = await import('heic-to/csp')
    const timedOut = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('HEIC decoding took too long.')), HEIC_DECODE_LIMIT_MS)
    })
    return await Promise.race([heicTo({ blob: file, type: 'bitmap' }), timedOut])
  } catch {
    throw new ImagePreparationError(`${file.name} could not be opened as HEIC.`)
  } finally {
    clearTimeout(timer)
  }
}

function jpegName(filename: string) {
  const dot = filename.lastIndexOf('.')
  return `${dot > 0 ? filename.slice(0, dot) : filename}.jpg`
}

/**
 * A photo as it goes up (#508): drawn again at no more than `IMAGE_LONG_EDGE`
 * a side and written as a JPEG. Drawing it again is what drops the EXIF --
 * the place it was taken, the phone, the time -- since a canvas keeps pixels
 * only. Transparency is laid on white, as JPEG has none.
 */
export async function prepareImage(file: File): Promise<File> {
  const bitmap = await decode(file)
  try {
    const scale = Math.min(1, IMAGE_LONG_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new ImagePreparationError('No canvas to draw on.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) throw new ImagePreparationError(`${file.name} could not be written as JPEG.`)
    return new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: file.lastModified })
  } finally {
    bitmap.close()
  }
}
