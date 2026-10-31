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
import {
  HEIC_DECODE_LIMIT_MS,
  IMAGE_LONG_EDGE,
  ImagePreparationError,
  prepareImage,
  shownSize,
} from '@/services/files/prepareImage'

vi.mock('heic-to/csp', () => ({ heicTo: vi.fn() }))

import { heicTo } from 'heic-to/csp'

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

/**
 * A JPEG's header as a camera writes it: an EXIF block holding the
 * Orientation tag, then the frame header with the stored width and height.
 */
function cameraJpeg(width: number, height: number, orientation: number, little = true) {
  const u16 = (value: number) => (little ? [value & 0xff, value >> 8] : [value >> 8, value & 0xff])
  const u32 = (value: number) => (little ? [...u16(value & 0xffff), ...u16(value >>> 16)] : [...u16(value >>> 16), ...u16(value & 0xffff)])
  const tiff = [
    ...(little ? [0x49, 0x49] : [0x4d, 0x4d]),
    ...u16(42),
    ...u32(8),
    ...u16(1),
    ...u16(0x0112),
    ...u16(3),
    ...u32(1),
    ...u16(orientation),
    0,
    0,
    ...u32(0),
  ]
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  const sof = [8, height >> 8, height & 0xff, width >> 8, width & 0xff, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]
  return new File(
    [
      new Uint8Array([
        0xff, 0xd8,
        0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 0xff, ...app1,
        0xff, 0xc0, (sof.length + 2) >> 8, (sof.length + 2) & 0xff, ...sof,
      ]),
      new Uint8Array(256),
    ],
    'IMG_0004.jpg',
    { type: 'image/jpeg' },
  )
}

function pngOf(width: number, height: number) {
  const bytes = new Uint8Array(64)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  new DataView(bytes.buffer).setUint32(16, width)
  new DataView(bytes.buffer).setUint32(20, height)
  return new File([bytes], 'shot.png', { type: 'image/png' })
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

describe('a photo decoded at the size it goes up at', () => {
  it('reads a camera JPEG’s size from its header, turned as its EXIF says', async () => {
    expect(await shownSize(cameraJpeg(4032, 3024, 1))).toEqual({ width: 4032, height: 3024 })
    expect(await shownSize(cameraJpeg(4032, 3024, 6))).toEqual({ width: 3024, height: 4032 })
    expect(await shownSize(cameraJpeg(4032, 3024, 8, false))).toEqual({ width: 3024, height: 4032 })
    expect(await shownSize(cameraJpeg(4032, 3024, 3))).toEqual({ width: 4032, height: 3024 })
    expect(await shownSize(pngOf(2400, 1080))).toEqual({ width: 2400, height: 1080 })
    expect(await shownSize(new File([new Uint8Array(64)], 'x.jpg'))).toBeNull()
  })

  it('asks the browser for 1568 px on the long edge, never the whole 12 MP', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(1176, 1568))
    const file = cameraJpeg(4032, 3024, 6)

    await prepareImage(file)

    expect(createImageBitmapMock).toHaveBeenCalledWith(file, {
      imageOrientation: 'from-image',
      resizeWidth: 1176,
      resizeQuality: 'high',
    })
    expect([drawn.width, drawn.height]).toEqual([1176, 1568])
  })

  it('names the width a screenshot keeps its shape by', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(1568, 706))

    await prepareImage(pngOf(2400, 1080))

    expect(createImageBitmapMock.mock.calls[0][1]).toMatchObject({ resizeWidth: 1568 })
  })

  it('decodes a small one as it is (the negative control)', async () => {
    createImageBitmapMock.mockResolvedValue(bitmap(800, 600))

    await prepareImage(pngOf(800, 600))

    expect(createImageBitmapMock.mock.calls[0][1]).toEqual({ imageOrientation: 'from-image' })
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

  it('is given up on when the decoder never answers, rather than left adding forever', async () => {
    vi.useFakeTimers()
    try {
      createImageBitmapMock.mockRejectedValue(new Error('no'))
      heicToMock.mockReturnValue(new Promise(() => {}))

      const refused = prepareImage(heic()).catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(HEIC_DECODE_LIMIT_MS)

      expect(await refused).toBeInstanceOf(ImagePreparationError)
      expect(problemFor(await refused)).toBe('unreadable')
    } finally {
      vi.useRealTimers()
    }
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
