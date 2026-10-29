/**
 * A file's parts go straight to S3 (#516; ADR-004, stoa-backend#152).
 *
 * Through API Gateway and Lambda a 5 MiB part, base64-encoded, is past
 * Lambda's 6 MB request limit, so nothing over 5 MiB went up. Now the API only
 * signs a URL for each part -- `POST /files/{id}/parts/{n}` with the part's
 * length and SHA-256 -- and the browser PUTs the bytes to S3 itself, with the
 * headers the URL was signed with and without the student's `Authorization`.
 * The URL lasts 300 s, so each is asked for right before its PUT, and one S3
 * turns down (403 once expired) is asked for again.
 *
 * Only the edges are answered: `httpClient`, with the shapes the backend's
 * OpenAPI gives, and the global `fetch` that S3 would answer.
 */
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { problemFor } from '@/services/files/attachmentProblems'
import { UploadPartError, uploadFile } from '@/services/files/fileApi'

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const post = vi.mocked(httpClient.post)
const put = vi.mocked(httpClient.put)

const MiB = 1024 * 1024
const CHUNK_BYTES = 5 * MiB

/** What the S3 URL of a part looks like: the bucket, the staging key, the signature. */
const s3Url = (partNumber: number, round = 1) =>
  `https://stoa-images-123456789012.s3.eu-central-2.amazonaws.com/staging/ab12/up-1.png?partNumber=${partNumber}&uploadId=s3up&X-Amz-Signature=sig${round}`

/** Every request in the order it left: the API's by path, S3's by URL. */
let sent: string[]
let partUrlsAsked: Record<number, number>
const s3 = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()

function checksum(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex')
}

/** A photo just under the 10 MiB images may be: two parts, the second ~4.9 MiB. */
function nearlyTenMiB() {
  const bytes = new Uint8Array(10 * MiB - 64 * 1024)
  for (let index = 0; index < bytes.length; index += 4096) bytes[index] = index % 251
  return { bytes, file: new File([bytes], 'scan.png', { type: 'image/png' }) }
}

beforeEach(() => {
  sent = []
  partUrlsAsked = {}
  post.mockImplementation(async (url: string, body?: unknown) => {
    sent.push(`POST ${url}`)
    if (url === '/files/intents') {
      return {
        data: {
          uploadId: 'up-1',
          expiresAt: '2026-10-29T10:30:00Z',
          maxBytes: 10 * MiB,
          chunkBytes: CHUNK_BYTES,
          acceptedTypes: ['image/png'],
          status: 'pending_upload',
        },
      }
    }
    const part = url.match(/^\/files\/up-1\/parts\/(\d+)$/)
    if (part) {
      const partNumber = Number(part[1])
      partUrlsAsked[partNumber] = (partUrlsAsked[partNumber] ?? 0) + 1
      const { checksumSha256 } = body as { checksumSha256: string }
      return {
        data: {
          uploadId: 'up-1',
          partNumber,
          url: s3Url(partNumber, partUrlsAsked[partNumber]),
          method: 'PUT',
          headers: { 'x-amz-checksum-sha256': `b64-of-${checksumSha256.slice(0, 8)}` },
          expiresAt: '2026-10-29T10:05:00Z',
        },
      }
    }
    if (url === '/files/up-1/complete') return { data: { uploadId: 'up-1', status: 'validated', attachment: null } }
    throw new Error(`unexpected POST ${url}`)
  })
  s3.mockResolvedValue(new Response(null, { status: 200 }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      sent.push(`S3 ${new URL(url).searchParams.get('partNumber')}`)
      return s3(url, init)
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('a photo of nearly 10 MiB', () => {
  it('goes up in two parts, each URL asked for right before its PUT', async () => {
    const { file } = nearlyTenMiB()

    await expect(uploadFile({ file })).resolves.toMatchObject({ uploadId: 'up-1' })

    expect(sent).toEqual([
      'POST /files/intents',
      'POST /files/up-1/parts/1',
      'S3 1',
      'POST /files/up-1/parts/2',
      'S3 2',
      'POST /files/up-1/complete',
    ])
    expect(post).toHaveBeenLastCalledWith('/files/up-1/complete', { partCount: 2 })
  })

  it('asks for each URL with the part’s exact length and its SHA-256 in hex', async () => {
    const { bytes, file } = nearlyTenMiB()

    await uploadFile({ file })

    const first = bytes.subarray(0, CHUNK_BYTES)
    const second = bytes.subarray(CHUNK_BYTES)
    expect(post).toHaveBeenCalledWith('/files/up-1/parts/1', { sizeBytes: CHUNK_BYTES, checksumSha256: checksum(first) })
    expect(post).toHaveBeenCalledWith('/files/up-1/parts/2', {
      sizeBytes: second.length,
      checksumSha256: checksum(second),
    })
    expect(checksum(first)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('sends the bytes to S3 alone, never to the API', async () => {
    const { bytes, file } = nearlyTenMiB()

    await uploadFile({ file })

    // No part goes the old way, and nothing the API is sent is more than a few fields.
    expect(put).not.toHaveBeenCalled()
    expect(sent.some((request) => request.includes('/chunks/'))).toBe(false)
    for (const [, body] of post.mock.calls) expect(JSON.stringify(body ?? {}).length).toBeLessThan(200)

    const bodies = await Promise.all(s3.mock.calls.map(([, init]) => (init.body as Blob).arrayBuffer()))
    expect(bodies.map((body) => body.byteLength)).toEqual([CHUNK_BYTES, bytes.length - CHUNK_BYTES])
    expect(checksum(new Uint8Array(bodies[0]))).toBe(checksum(bytes.subarray(0, CHUNK_BYTES)))
    expect(checksum(new Uint8Array(bodies[1]))).toBe(checksum(bytes.subarray(CHUNK_BYTES)))
  })

  it('PUTs with exactly the signed headers, no Authorization and no cookies', async () => {
    const { file } = nearlyTenMiB()

    await uploadFile({ file })

    for (const [url, init] of s3.mock.calls) {
      expect(url).toMatch(/^https:\/\/stoa-images-123456789012\.s3\./)
      expect(init.method).toBe('PUT')
      expect(init.credentials).toBe('omit')
      expect(Object.keys(init.headers as Record<string, string>)).toEqual(['x-amz-checksum-sha256'])
      expect(new Headers(init.headers).has('authorization')).toBe(false)
    }
  })
})

describe('a part S3 turns down', () => {
  it('is asked for again after a 403, and sent on the fresh URL', async () => {
    s3.mockResolvedValueOnce(new Response('<Error><Code>AccessDenied</Code></Error>', { status: 403 }))

    await expect(uploadFile({ file: new File(['photo'], 'p.png', { type: 'image/png' }) })).resolves.toMatchObject({
      uploadId: 'up-1',
    })

    expect(sent).toEqual([
      'POST /files/intents',
      'POST /files/up-1/parts/1',
      'S3 1',
      'POST /files/up-1/parts/1',
      'S3 1',
      'POST /files/up-1/complete',
    ])
    expect(s3.mock.calls.map(([url]) => url)).toEqual([s3Url(1, 1), s3Url(1, 2)])
  })

  it('is asked for again after the connection failed', async () => {
    s3.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await uploadFile({ file: new File(['photo'], 'p.png', { type: 'image/png' }) })

    expect(partUrlsAsked[1]).toBe(2)
  })

  it('fails the file when the fresh URL is turned down too, and the upload is not completed', async () => {
    s3.mockResolvedValue(new Response(null, { status: 403 }))

    const failed = await uploadFile({ file: new File(['photo'], 'p.png', { type: 'image/png' }) }).catch(
      (error: unknown) => error,
    )

    expect(failed).toBeInstanceOf(UploadPartError)
    expect(problemFor(failed)).toBe('failed')
    expect(partUrlsAsked[1]).toBe(2)
    expect(sent).not.toContain('POST /files/up-1/complete')
  })

  it('is asked for only once when S3 takes it (the negative control)', async () => {
    await uploadFile({ file: new File(['photo'], 'p.png', { type: 'image/png' }) })

    expect(partUrlsAsked[1]).toBe(1)
  })
})

describe('a part the API will not sign', () => {
  it('is the conflict the backend names, in the tray’s words', async () => {
    const conflict = new ApiError('This upload changed.', { status: 409, code: 'upload_chunk_conflict' })
    post.mockImplementation(async (url: string) => {
      if (url === '/files/intents') {
        return { data: { uploadId: 'up-1', maxBytes: 10 * MiB, chunkBytes: CHUNK_BYTES, acceptedTypes: [] } }
      }
      throw conflict
    })

    const failed = await uploadFile({ file: new File(['photo'], 'p.png', { type: 'image/png' }) }).catch(
      (error: unknown) => error,
    )

    expect(failed).toBe(conflict)
    expect(problemFor(failed)).toBe('expired')
    expect(s3).not.toHaveBeenCalled()
  })
})
