/**
 * The phone's side of a photo sent by QR (#514; the backend's stoa-backend#146).
 *
 * The QR opens `/upload#<code>` on the phone. The page takes one photo, spends
 * the code on it once (`POST /upload-codes/redeem`), and sends the photo with
 * the upload token that redemption handed back: each part's URL
 * (`POST /upload-codes/parts/{n}`), the part straight to S3, then
 * `POST /upload-codes/complete`. The backend's review asked for four things,
 * each held here: the code stays after the `#`, it is redeemed once and the
 * token carries every later call, retries included, the gateway's 429 without
 * a code is still said, and an expired or used code is said in four languages.
 *
 * Only the edges are answered: `httpClient` with the shapes of the backend's
 * OpenAPI, and the `fetch` S3 would answer. `prepareImage` is answered too:
 * jsdom draws nothing, and what a photo becomes is prepareImage508's.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { PhoneUploadPage } from '@/pages/upload/PhoneUploadPage'
import { ApiError, apiErrorFromBody, httpClient } from '@/services/api/httpClient'

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/services/files/prepareImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(),
}))

import { prepareImage } from '@/services/files/prepareImage'

const post = vi.mocked(httpClient.post)
const prepareMock = vi.mocked(prepareImage)

/** A code as the backend makes one: `<codeId>.<secret>`. */
const CODE = `${'a1'.repeat(16)}.${'s'.repeat(43)}`
const TOKEN = `${'a1'.repeat(16)}.${'t'.repeat(43)}`

/** Each call to the API, in the order it left. */
let sent: Array<{ url: string; body: Record<string, unknown> }>
/** Answers that replace the usual one for a path, first in first out. */
let instead: Map<string, Array<() => never>>
const s3 = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()

function refuse(url: string, error: ApiError) {
  const queue = instead.get(url) ?? []
  queue.push(() => {
    throw error
  })
  instead.set(url, queue)
}

const urls = () => sent.map((call) => call.url)
const redemptions = () => sent.filter((call) => call.url === '/upload-codes/redeem')

beforeEach(async () => {
  await i18n.changeLanguage('en')
  sent = []
  instead = new Map()
  post.mockImplementation(async (url: string, body?: unknown) => {
    sent.push({ url, body: body as Record<string, unknown> })
    const override = instead.get(url)?.shift()
    if (override) override()
    if (url === '/upload-codes/redeem') {
      return {
        data: {
          uploadToken: TOKEN,
          expiresAt: '2026-10-30T10:20:00Z',
          maxBytes: 10 * 1024 * 1024,
          chunkBytes: 5 * 1024 * 1024,
          acceptedTypes: ['image/jpeg', 'image/png'],
        },
      }
    }
    const part = url.match(/^\/upload-codes\/parts\/(\d+)$/)
    if (part) {
      return {
        data: {
          partNumber: Number(part[1]),
          url: `https://stoa-images.s3.eu-central-2.amazonaws.com/staging/up.jpg?partNumber=${part[1]}&X-Amz-Signature=sig`,
          method: 'PUT',
          headers: { 'x-amz-checksum-sha256': 'abc' },
          expiresAt: '2026-10-30T10:15:00Z',
        },
      }
    }
    if (url === '/upload-codes/complete') return { data: { status: 'validated' } }
    throw new Error(`unexpected POST ${url}`)
  })
  s3.mockResolvedValue(new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', s3)
  prepareMock.mockImplementation(
    async () => new File([new Uint8Array(4096)], 'IMG_0001.jpg', { type: 'image/jpeg' }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/')
})

/** The page as the QR opens it, with `hash` after its address. */
function openPage(hash = `#${CODE}`) {
  window.history.replaceState(null, '', `/upload${hash}`)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/upload']}>
          <PhoneUploadPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const picker = () => document.querySelector<HTMLInputElement>('input[data-phone-picker]')!
const camera = () => document.querySelector<HTMLInputElement>('input[data-phone-camera]')!
const photo = (name = 'IMG_0001.HEIC', type = 'image/heic') => new File([new Uint8Array(2048)], name, { type })
// The chooser's `accept` is the browser's to apply; a phone may still hand over anything.
const user = () => userEvent.setup({ applyAccept: false })

describe('the page a QR opens on the phone', () => {
  it('takes the code from after the # and leaves it out of the address', async () => {
    openPage()

    await waitFor(() => expect(window.location.hash).toBe(''))
    expect(window.location.pathname).toBe('/upload')

    await user().upload(picker(), photo())
    await screen.findByText(/Done! Go back to your computer/)
    expect(redemptions()[0].body.code).toBe(CODE)
  })

  it('redeems the code once and sends every part and the completion with its token, never the code', async () => {
    openPage()

    expect(camera().getAttribute('capture')).toBe('environment')
    await user().upload(camera(), photo())

    expect(await screen.findByText('Done! Go back to your computer: your photo is waiting there for you to add it.')).toBeInTheDocument()
    expect(urls()).toEqual(['/upload-codes/redeem', '/upload-codes/parts/1', '/upload-codes/complete'])
    // Redeemed for the JPEG the phone made of the photo, which is what goes up.
    expect(redemptions()[0].body).toEqual({ code: CODE, filename: 'IMG_0001.jpg', contentType: 'image/jpeg', sizeBytes: 4096 })
    for (const later of sent.slice(1)) {
      expect(later.body.uploadToken).toBe(TOKEN)
      expect(later.body).not.toHaveProperty('code')
    }
    expect(sent[2].body.partCount).toBe(1)
    // The part went to S3 itself, with no session of any kind.
    expect(s3).toHaveBeenCalledTimes(1)
    expect(s3.mock.calls[0][1]).toMatchObject({ method: 'PUT', credentials: 'omit' })
  })

  it('tries a failed part again with the same token and redeems nothing more', async () => {
    // The API could not answer, twice: once and its one quiet retry.
    refuse('/upload-codes/parts/1', new ApiError('down', { status: 503 }))
    refuse('/upload-codes/parts/1', new ApiError('down', { status: 503 }))
    openPage()

    await user().upload(picker(), photo())
    expect(await screen.findByText("That didn't work. Check your connection and try again.")).toBeInTheDocument()
    expect(redemptions()).toHaveLength(1)

    await user().click(screen.getByRole('button', { name: 'Try again' }))

    await screen.findByText(/Done! Go back to your computer/)
    expect(redemptions()).toHaveLength(1)
    expect(sent.filter((call) => call.url === '/upload-codes/complete')[0].body.uploadToken).toBe(TOKEN)
  })

  it('says to wait at the gateway’s 429, which has no code, and goes on with the same token', async () => {
    // API Gateway's throttle (stoa-infra#10): `{"message":"Too Many Requests"}`, no code.
    refuse('/upload-codes/complete', apiErrorFromBody({ message: 'Too Many Requests' }, { status: 429, fallback: 'x' }))
    openPage()

    await user().upload(picker(), photo())
    expect(await screen.findByText('Too many tries right now. Wait a moment, then try again.')).toBeInTheDocument()

    await user().click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText(/Done! Go back to your computer/)
    expect(redemptions()).toHaveLength(1)
  })

  it('says to wait at the backend’s own upload_code_rate_limited too', async () => {
    refuse(
      '/upload-codes/redeem',
      apiErrorFromBody({ detail: { code: 'upload_code_rate_limited', message: 'Too many.' } }, { status: 429, fallback: 'x' }),
    )
    openPage()

    await user().upload(picker(), photo())

    expect(await screen.findByText('Too many tries right now. Wait a moment, then try again.')).toBeInTheDocument()
  })

  it.each([
    ['en', 'This code has expired or has already been used. Make a new one on your computer.'],
    ['de', 'Dieser Code ist abgelaufen oder wurde schon benutzt. Erstell auf deinem Computer einen neuen.'],
    ['fr', 'Ce code a expiré ou a déjà été utilisé. Crées-en un nouveau sur ton ordinateur.'],
    ['it', 'Questo codice è scaduto o è già stato usato. Creane uno nuovo sul computer.'],
  ])('says in %s that a code is expired or used, and offers nothing more here', async (language, sentence) => {
    await i18n.changeLanguage(language)
    // Expired, used, wrong: the backend answers all of them alike (stoa-backend#146).
    refuse(
      '/upload-codes/redeem',
      apiErrorFromBody({ detail: { code: 'upload_code_invalid', message: 'The code is not valid.' } }, { status: 404, fallback: 'x' }),
    )
    openPage()

    await user().upload(picker(), photo())

    expect(await screen.findByText(sentence)).toBeInTheDocument()
    expect(within(screen.getByRole('region')).queryByRole('button')).toBeNull()
  })

  it('says the code ran out when the token is refused part-way', async () => {
    refuse(
      '/upload-codes/complete',
      apiErrorFromBody({ detail: { code: 'upload_code_invalid', message: 'The code is not valid.' } }, { status: 404, fallback: 'x' }),
    )
    openPage()

    await user().upload(picker(), photo())

    expect(await screen.findByText(/This code has expired or has already been used/)).toBeInTheDocument()
  })

  it('says a picture moderation refused cannot be sent, and offers no retry', async () => {
    refuse(
      '/upload-codes/complete',
      apiErrorFromBody({ detail: { code: 'upload_content_blocked', message: 'Blocked.' } }, { status: 422, fallback: 'x' }),
    )
    openPage()

    await user().upload(picker(), photo())

    expect(await screen.findByText(/This picture can't be sent\. Make a new code on your computer/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('refuses a file that is not a photo before the code is spent, and lets another be chosen', async () => {
    openPage()

    await user().upload(picker(), new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' }))

    expect(await screen.findByText('Only photos can be sent from here. Choose a photo.')).toBeInTheDocument()
    expect(sent).toEqual([])
    await user().upload(picker(), photo())
    await screen.findByText(/Done! Go back to your computer/)
  })

  it('says to scan again when the address has no code', async () => {
    openPage('')

    expect(await screen.findByText('This link has no code. Scan the QR code on your computer again.')).toBeInTheDocument()
    expect(picker()).toBeNull()
  })
})
