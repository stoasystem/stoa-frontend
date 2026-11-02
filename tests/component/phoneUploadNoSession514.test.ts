/**
 * The phone's calls go out as the code's, never as a session (#514).
 *
 * `/upload-codes/redeem`, `/parts/{n}` and `/complete` are public routes: the
 * code, then its upload token, are the credential (stoa-backend#146). A phone
 * signed in to STOA as someone -- a parent's, say -- must not send that
 * session with them, and a refusal there is no reason to renew or end it.
 * This goes through the real `httpClient`, so what is asserted is what leaves
 * the browser and how a real answer is read, the gateway's codeless 429 too.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/api/httpClient'
import { phoneUploadProblemFor } from '@/services/files/attachmentProblems'
import { readUploadCode, redeemUploadCode, sendWithUploadToken } from '@/services/files/uploadCodeApi'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const API = 'https://api.test'
const CODE = `${'a1'.repeat(16)}.${'s'.repeat(43)}`
const TOKEN = `${'a1'.repeat(16)}.${'t'.repeat(43)}`
const parent = { id: 'u-p', name: 'Pia', email: 'pia@example.com', role: 'parent' } as CurrentUser

const redemption = {
  uploadToken: TOKEN,
  expiresAt: '2026-10-30T10:20:00Z',
  maxBytes: 10 * 1024 * 1024,
  chunkBytes: 5 * 1024 * 1024,
  acceptedTypes: ['image/jpeg'],
}
const photo = () => new File([new Uint8Array(2048)], 'IMG_0001.jpg', { type: 'image/jpeg' })

/** The `Authorization` each request carried, by path; null when none. */
let carried: Record<string, string | null>
const refreshes = vi.fn()

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  carried = {}
  sessionStorage.setItem(TOKEN_KEY, 'token-p')
  useAuthStore.setState({ user: parent, accessToken: 'token-p', isAuthenticated: true })
  const note = (request: Request) => {
    carried[new URL(request.url).pathname] = request.headers.get('authorization')
  }
  mswServer.use(
    http.post(`${API}/auth/refresh`, () => {
      refreshes()
      return HttpResponse.json({ detail: 'no' }, { status: 401 })
    }),
    http.post(`${API}/upload-codes/redeem`, ({ request }) => {
      note(request)
      return HttpResponse.json(redemption)
    }),
    http.post(`${API}/upload-codes/parts/1`, ({ request }) => {
      note(request)
      return HttpResponse.json({
        partNumber: 1,
        url: 'https://s3.test/up.jpg?partNumber=1',
        method: 'PUT',
        headers: {},
        expiresAt: '2026-10-30T10:15:00Z',
      })
    }),
    http.post(`${API}/upload-codes/complete`, ({ request }) => {
      note(request)
      return HttpResponse.json({ status: 'validated' })
    }),
    http.get(`${API}/conversations/c1/upload-codes/code-1`, ({ request }) => {
      note(request)
      return HttpResponse.json({ codeId: 'code-1', status: 'waiting', expiresAt: '2026-10-30T10:10:00Z' })
    }),
  )
  // The part's PUT goes to S3 by `fetch`; the API's calls go by XHR, which msw answers.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  refreshes.mockClear()
})
afterAll(() => mswServer.close())

describe('a photo sent from the phone', () => {
  it('sends no session with the phone’s calls, though the phone is signed in', async () => {
    const redeemed = await redeemUploadCode(CODE, photo())
    await sendWithUploadToken(redeemed, photo())

    expect(carried).toEqual({
      '/upload-codes/redeem': null,
      '/upload-codes/parts/1': null,
      '/upload-codes/complete': null,
    })
  })

  it('still sends the session with the computer’s own calls', async () => {
    await readUploadCode('c1', 'code-1')
    expect(carried['/conversations/c1/upload-codes/code-1']).toBe('Bearer token-p')
  })

  it('reads the gateway’s 429, which has no code, as "wait"', async () => {
    mswServer.use(
      http.post(`${API}/upload-codes/redeem`, () =>
        HttpResponse.json({ message: 'Too Many Requests' }, { status: 429 }),
      ),
    )
    const error = await redeemUploadCode(CODE, photo()).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBeUndefined()
    expect(phoneUploadProblemFor(error)).toBe('rateLimited')
  })

  it('reads an expired or used code as such', async () => {
    mswServer.use(
      http.post(`${API}/upload-codes/redeem`, () =>
        HttpResponse.json({ detail: { code: 'upload_code_invalid', message: 'The code is not valid.' } }, { status: 404 }),
      ),
    )
    const error = await redeemUploadCode(CODE, photo()).catch((caught: unknown) => caught)

    expect(phoneUploadProblemFor(error)).toBe('codeInvalid')
  })

  it('neither renews nor ends a session over a 401 there', async () => {
    mswServer.use(
      http.post(`${API}/upload-codes/complete`, () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
    )
    const error = await sendWithUploadToken(redemption, photo()).catch((caught: unknown) => caught)

    expect((error as ApiError).status).toBe(401)
    expect(refreshes).not.toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBe('token-p')
  })
})
