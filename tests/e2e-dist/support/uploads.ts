import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import type { Page } from '@playwright/test'
import type { MockBackend } from './backend'
import { WEB_ORIGIN } from './origins'

/** Where the part URLs point: the images bucket, as the browser sees it. Answered here, like the API. */
export const S3_ORIGIN = 'https://stoa-images.s3.stoa-e2e.test'

const MiB = 1024 * 1024

type Put = { uploadId: string; partNumber: number; bytes: Buffer; headers: Record<string, string> }
type Upload = { uploadId: string; contentType: string; parts: Map<number, string> }

/**
 * The upload path a file in Ask takes (#507, #516): `POST /files/intents`, one
 * URL per part from `POST /files/{upload_id}/parts/{n}`, the part PUT straight
 * to S3, then `POST /files/{upload_id}/complete`. The API calls are checked
 * against the backend's OpenAPI document like every other; the PUTs never
 * reach the API, so they are answered here, and S3's own check is kept: a
 * body whose SHA-256 is not the one the URL was signed for is refused.
 *
 * `verdict` is what `complete` answers: the upload validated, or refused with
 * one of the backend's attachment error codes -- `upload_content_blocked` when
 * image moderation turns the picture down (stoa-backend#138).
 */
export class UploadDesk {
  readonly puts: Put[] = []
  verdict: 'validated' | 'upload_content_blocked' = 'validated'
  private readonly uploads = new Map<string, Upload>()
  private next = 1

  constructor(private readonly backend: MockBackend) {}

  async install(page: Page) {
    const b = this.backend
    b.on('POST', '/files/intents', ({ body }) => {
      const { contentType } = body as { contentType: string }
      const uploadId = `e2e-upload-${this.next++}`
      this.uploads.set(uploadId, { uploadId, contentType, parts: new Map() })
      return {
        status: 200,
        body: {
          uploadId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          maxBytes: 10 * MiB,
          chunkBytes: 5 * MiB,
          acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
          status: 'pending_upload',
        },
      }
    })
    b.on('POST', '/files/{upload_id}/parts/{part_number}', ({ pathname, body }) => {
      const [, , uploadId, , part] = pathname.split('/')
      const upload = this.uploads.get(uploadId)
      if (!upload) return notFound()
      const { checksumSha256 } = body as { checksumSha256: string }
      upload.parts.set(Number(part), checksumSha256)
      return {
        status: 200,
        body: {
          uploadId,
          partNumber: Number(part),
          url: `${S3_ORIGIN}/staging/${uploadId}/${part}?X-Amz-Signature=e2e`,
          method: 'PUT',
          headers: { 'x-amz-checksum-sha256': Buffer.from(checksumSha256, 'hex').toString('base64') },
          expiresAt: new Date(Date.now() + 300 * 1000).toISOString(),
        },
      }
    })
    b.on('POST', '/files/{upload_id}/complete', ({ pathname, body }) => {
      const uploadId = pathname.split('/')[2]
      const upload = this.uploads.get(uploadId)
      const { partCount } = body as { partCount: number }
      const arrived = this.puts.filter((put) => put.uploadId === uploadId).length
      if (!upload || arrived < partCount) return notFound()
      if (this.verdict !== 'validated') {
        // What `files.py::_raise_safe` raises: the public attachment error body under `detail`.
        return {
          status: 422,
          body: {
            detail: { code: this.verdict, message: 'This image cannot be sent.', correlationId: 'e2e-correlation' },
          },
        }
      }
      return { status: 200, body: { uploadId, status: 'validated', attachment: null } }
    })

    await page.route(`${S3_ORIGIN}/**`, async (route) => {
      const request = route.request()
      const cors = {
        'access-control-allow-origin': WEB_ORIGIN,
        'access-control-allow-methods': 'PUT',
        'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*',
      }
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: cors })
        return
      }
      const [, , uploadId, part] = new URL(request.url()).pathname.split('/')
      const bytes = request.postDataBuffer() ?? Buffer.alloc(0)
      const signedFor = this.uploads.get(uploadId)?.parts.get(Number(part))
      const sent = createHash('sha256').update(bytes).digest('hex')
      if (request.method() !== 'PUT' || signedFor !== sent) {
        this.backend.problems.push(`${request.method()} ${request.url()}: S3 would refuse this part`)
        await route.fulfill({ status: 403, headers: cors })
        return
      }
      this.puts.push({ uploadId, partNumber: Number(part), bytes, headers: request.headers() })
      await route.fulfill({ status: 200, headers: { ...cors, etag: `"${sent.slice(0, 32)}"` } })
    })
  }
}

function notFound() {
  return {
    status: 404,
    body: { detail: { code: 'upload_not_found', message: 'This upload is unavailable.', correlationId: 'e2e-correlation' } },
  }
}

/**
 * A real PNG the browser can open and write again as a JPEG (#508): a
 * `width` x `height` gradient, no file in the repository.
 */
export function photo(width = 320, height = 240): Buffer {
  const rows: Buffer[] = []
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3)
    for (let x = 0; x < width; x += 1) row.set([(x * 255) / width, (y * 255) / height, 128], 1 + x * 3)
    rows.push(row)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function crc32(bytes: Buffer) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}
