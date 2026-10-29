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

/**
 * The photo as the browser shows it. EXIF orientation is applied, so a photo
 * taken upright stays upright once the EXIF is gone. HEIC is opened natively
 * where the browser can (Safari); elsewhere `heic-to` opens it, loaded only
 * then, since it carries a 3 MB decoder no other photo needs.
 */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    if (!isHeic(file)) throw new ImagePreparationError(`${file.name} could not be opened.`)
  }
  try {
    const { heicTo } = await import('heic-to')
    return await heicTo({ blob: file, type: 'bitmap' })
  } catch {
    throw new ImagePreparationError(`${file.name} could not be opened as HEIC.`)
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
