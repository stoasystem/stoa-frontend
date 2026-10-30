import type { Page } from '@playwright/test'
import type { MockBackend, Reply } from './backend'
import { API_ORIGIN, WEB_ORIGIN } from './origins'
import type { UploadDesk } from './uploads'

const MiB = 1024 * 1024

/** How the backend refuses any code or token: wrong, spent, expired alike. */
export const codeRefused = (): Reply => ({
  status: 404,
  body: { detail: { code: 'upload_code_invalid', message: 'This upload code is not valid.', correlationId: 'e2e-correlation' } },
})

/**
 * A photo sent from the phone by QR (#514), answered as stoa-backend#146 does.
 *
 * The computer, signed in, makes one code for a conversation and reads how far
 * the phone has got. The phone, with no session, spends the code once on
 * `redeem` and is handed an upload token; the parts and the completion are
 * taken with that token only. A second redemption, or the code where the token
 * belongs, is `404 upload_code_invalid`, as the backend answers every refused
 * code alike. The parts go to S3 through `desk`, which keeps S3's own check.
 */
export class PhoneUploadDesk {
  /** `<codeId>.<secret>`, the shape the backend makes: 32 hex, then 43 url-safe characters. */
  readonly codeId = 'e2e0c0de'.repeat(4)
  readonly code = `${this.codeId}.${'s'.repeat(43)}`
  readonly token = `${this.codeId}.${'t'.repeat(43)}`
  redeemedAt: string | null = null
  uploadId: string | null = null
  completed = false
  /** Answered by `redeem` in place of spending the code: an expired one, say. */
  redeemRefusal: Reply | null = null

  constructor(
    private readonly backend: MockBackend,
    private readonly desk: UploadDesk,
  ) {}

  /** The address the QR shows. */
  get phoneUrl() {
    return `${WEB_ORIGIN}/upload#${this.code}`
  }

  install() {
    const b = this.backend
    b.on('POST', '/conversations/{conv_id}/upload-codes', () => ({
      status: 200,
      body: { codeId: this.codeId, code: this.code, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() },
    }))
    b.on('GET', '/conversations/{conv_id}/upload-codes/{code_id}', () => ({
      status: 200,
      body: {
        codeId: this.codeId,
        status: this.completed ? 'ready' : this.redeemedAt ? 'uploading' : 'waiting',
        expiresAt: new Date(Date.now() + 9 * 60 * 1000).toISOString(),
        redeemedAt: this.redeemedAt,
        uploadId: this.completed ? this.uploadId : null,
      },
    }))
    b.on('POST', '/upload-codes/redeem', ({ body }) => {
      if (this.redeemRefusal) return this.redeemRefusal
      const { code, contentType } = body as { code: string; contentType: string }
      if (code !== this.code || this.redeemedAt) return codeRefused()
      this.redeemedAt = new Date().toISOString()
      this.uploadId = this.desk.open(contentType)
      return {
        status: 200,
        body: {
          uploadToken: this.token,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          maxBytes: 10 * MiB,
          chunkBytes: 5 * MiB,
          acceptedTypes: ['image/jpeg', 'image/png'],
        },
      }
    })
    b.on('POST', '/upload-codes/parts/{part_number}', ({ pathname, body }) => {
      const { uploadToken, checksumSha256 } = body as { uploadToken: string; checksumSha256: string }
      if (uploadToken !== this.token || !this.uploadId) return codeRefused()
      return { status: 200, body: this.desk.signPart(this.uploadId, Number(pathname.split('/').pop()), checksumSha256) }
    })
    b.on('POST', '/upload-codes/complete', ({ body }) => {
      const { uploadToken, partCount } = body as { uploadToken: string; partCount: number }
      if (uploadToken !== this.token || !this.uploadId) return codeRefused()
      if (!this.desk.arrived(this.uploadId, partCount)) {
        return { status: 404, body: { detail: { code: 'upload_not_found', message: 'Not found.', correlationId: 'e2e-correlation' } } }
      }
      this.completed = true
      return { status: 200, body: { status: 'validated' } }
    })
  }

  /**
   * The photo for the computer to show before it is added: the JPEG the phone
   * sent, as bytes. The contract's mock answers JSON only, so this route is
   * answered here, over it (Playwright tries the route added last first).
   */
  readonly previews: Array<{ authorization?: string }> = []
  async answerPreview(page: Page) {
    await page.route(`${API_ORIGIN}/conversations/*/upload-codes/*/content`, async (route) => {
      const request = route.request()
      const cors = {
        'access-control-allow-origin': WEB_ORIGIN,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*',
      }
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: cors })
        return
      }
      this.previews.push({ authorization: request.headers().authorization })
      const sent = this.desk.puts.find((put) => put.uploadId === this.uploadId)
      if (!this.completed || !sent) {
        await route.fulfill({ status: 404, headers: cors, json: codeRefused().body })
        return
      }
      await route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'image/jpeg' }, body: sent.bytes })
    })
  }
}
