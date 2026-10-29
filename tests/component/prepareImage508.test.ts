/**
 * A photo as it goes up (#508): shrunk to 1568 px on its long edge, written
 * again as a JPEG -- which drops the EXIF, the place it was taken among it --
 * and an iPhone's HEIC opened first, by the browser where it can and by
 * `heic-to` where it cannot.
 *
 * jsdom has neither a decoder nor a canvas that draws, so both are stood in
 * for at the browser's own seams, `createImageBitmap` and the canvas, and what
 * is asserted is what `prepareImage` asks of them and what it hands back.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { problemFor } from '@/services/files/attachmentProblems'
import { IMAGE_LONG_EDGE, ImagePreparationError, prepareImage } from '@/services/files/prepareImage'

vi.mock('heic-to', () => ({ heicTo: vi.fn() }))

import { heicTo } from 'heic-to'

const heicToMock = vi.mocked(heicTo) as unknown as ReturnType<typeof vi.fn>

/** What the canvas writes: bytes of its own, never the photo's. */
const CANVAS_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3, 0xff, 0xd9])

/** A JPEG as a phone writes one: an EXIF block, with GPS in it, before the picture. */
function phoneJpeg(name = 'IMG_0001.jpg') {
  const exif = new TextEncoder().encode('Exif\0\0GPSLatitude 47.3769 GPSLongitude 8.5417')
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe1]), exif, new Uint8Array(1024)], name, {
    type: 'image/jpeg',
  })
}

const bitmap = (width: number, height: number) => ({ width, height, close: vi.fn() }) as unknown as ImageBitmap

let drawn: { width: number; height: number; drawImage: unknown[]; toBlob: unknown[] }
const createImageBitmapMock = vi.fn()

beforeEach(() => {
  drawn = { width: 0, height: 0, drawImage: [], toBlob: [] }
  vi.stubGlobal('createImageBitmap', createImageBitmapMock)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return {
      canvas: this,
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage(this: { canvas: HTMLCanvasElement }, ...args: unknown[]) {
        drawn.width = this.canvas.width
        drawn.height = this.canvas.height
        drawn.drawImage = args
      },
    } as unknown as CanvasRenderingContext2D
  } as never)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, ...args) => {
    drawn.toBlob = args
    callback(new Blob([CANVAS_JPEG], { type: 'image/jpeg' }))
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  heicToMock.mockReset()
  createImageBitmapMock.mockReset()
})

const bytesOf = async (file: Blob) => new Uint8Array(await file.arrayBuffer())

describe('a photo from a phone', () => {
  it('is shrunk to 1568 px on its long edge, keeping its shape', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(4032, 3024))

    await prepareImage(phoneJpeg())

    expect(IMAGE_LONG_EDGE).toBe(1568)
    expect([drawn.width, drawn.height]).toEqual([1568, 1176])
    expect(drawn.drawImage.slice(1)).toEqual([0, 0, 1568, 1176])
  })

  it('upright too', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(3024, 4032))

    await prepareImage(phoneJpeg())

    expect([drawn.width, drawn.height]).toEqual([1176, 1568])
  })

  it('is opened the way it was taken, so it stays upright without its EXIF', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(4032, 3024))
    const file = phoneJpeg()

    await prepareImage(file)

    expect(createImageBitmapMock).toHaveBeenCalledWith(file, { imageOrientation: 'from-image' })
  })

  it('goes up as a JPEG the canvas wrote, with nothing of the EXIF in it', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(4032, 3024))
    const file = phoneJpeg()
    expect(new TextDecoder().decode(await bytesOf(file))).toContain('GPSLatitude')

    const prepared = await prepareImage(file)

    expect(prepared).toMatchObject({ name: 'IMG_0001.jpg', type: 'image/jpeg' })
    expect(drawn.toBlob).toEqual(['image/jpeg', 0.85])
    expect(await bytesOf(prepared)).toEqual(CANVAS_JPEG)
    expect(new TextDecoder().decode(await bytesOf(prepared))).not.toContain('Exif')
  })

  it('is not made larger when it is small already (the negative control)', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(800, 600))

    await prepareImage(new File([new Uint8Array(64)], 'shot.png', { type: 'image/png' }))

    expect([drawn.width, drawn.height]).toEqual([800, 600])
  })

  it('lets the decoded picture go once drawn', async () => {
    const decoded = bitmap(800, 600)
    createImageBitmapMock.mockResolvedValue(decoded)

    await prepareImage(phoneJpeg())

    expect(decoded.close).toHaveBeenCalled()
  })
})

describe('an iPhone’s HEIC', () => {
  const heic = () => new File([new Uint8Array(2048)], 'IMG_0002.HEIC', { type: 'image/heic' })

  it('is opened by heic-to where the browser cannot, and goes up as a JPEG', async () => {
    createImageBitmapMock.mockRejectedValue(new DOMException('The source image could not be decoded.', 'InvalidStateError'))
    heicToMock.mockResolvedValue(bitmap(4032, 3024))
    const file = heic()

    const prepared = await prepareImage(file)

    expect(heicToMock).toHaveBeenCalledWith({ blob: file, type: 'bitmap' })
    expect([drawn.width, drawn.height]).toEqual([1568, 1176])
    expect(prepared).toMatchObject({ name: 'IMG_0002.jpg', type: 'image/jpeg' })
  })

  it('is opened by the browser itself where it can, without loading heic-to', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(4032, 3024))

    await prepareImage(heic())

    expect(heicToMock).not.toHaveBeenCalled()
  })

  it('is known by its name when the browser gives no type', async () => {
    createImageBitmapMock.mockRejectedValue(new Error('no'))
    heicToMock.mockResolvedValue(bitmap(100, 100))

    await prepareImage(new File([new Uint8Array(8)], 'IMG_0003.heif'))

    expect(heicToMock).toHaveBeenCalledTimes(1)
  })

  it('that cannot be opened at all is a problem the student can read', async () => {
    createImageBitmapMock.mockRejectedValue(new Error('no'))
    heicToMock.mockRejectedValue(new Error('ERR_LIBHEIF format not supported'))

    const refused = await prepareImage(heic()).catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(ImagePreparationError)
    expect(problemFor(refused)).toBe('unreadable')
  })
})

describe('a photo the browser cannot open', () => {
  it('is a problem the student can read, and heic-to is not tried for a JPEG', async () => {
    createImageBitmapMock.mockRejectedValue(new DOMException('The source image could not be decoded.', 'InvalidStateError'))

    const refused = await prepareImage(phoneJpeg()).catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(ImagePreparationError)
    expect(problemFor(refused)).toBe('unreadable')
    expect(heicToMock).not.toHaveBeenCalled()
  })

  it('nor one the canvas cannot write', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(800, 600))
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null))

    await expect(prepareImage(phoneJpeg())).rejects.toBeInstanceOf(ImagePreparationError)
  })
})
