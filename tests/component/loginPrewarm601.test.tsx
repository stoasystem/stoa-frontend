/**
 * The sign-in page wakes the backend as it opens (#601).
 *
 * A cold Lambda start (4-5 s, stoa-backend#306) used to fall on the sign-in
 * itself. The page now asks for `GET /health` when it mounts, so the start
 * happens while the visitor types. Held here: the request is a CORS simple
 * request (GET, no header of ours, no credentials: no preflight); one tab asks
 * once in five minutes, however often it comes back to the page; and a wake-up
 * that fails changes nothing about signing in.
 *
 * The dev server does not send it (`import.meta.env.DEV`); these tests stand in
 * for a build by stubbing DEV to false.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

type Prewarm = typeof import('@/services/api/backendPrewarm')

const HEALTH = 'https://api.test/health'
let fetchMock: ReturnType<typeof vi.fn>

// The module keeps its last wake-up in memory as well as in the session store,
// so each test takes a fresh copy of it, and of the page that imports it.
async function freshPrewarm(): Promise<Prewarm> {
  vi.resetModules()
  return import('@/services/api/backendPrewarm')
}

function healthCalls() {
  return fetchMock.mock.calls.filter(([url]) => String(url) === HEALTH)
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterAll(() => mswServer.close())
beforeEach(async () => {
  vi.stubEnv('DEV', false)
  fetchMock = vi.fn(() => Promise.resolve(new Response('{"status":"ok"}', { status: 200 })))
  vi.stubGlobal('fetch', fetchMock)
  sessionStorage.clear()
  await i18n.changeLanguage('en')
  useAuthStore.getState().clearAuth()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  mswServer.resetHandlers()
  useAuthStore.getState().clearAuth()
  sessionStorage.clear()
  localStorage.clear()
})

describe('prewarmBackend', () => {
  it('asks for /health once, as a simple request: GET, no headers, no credentials', async () => {
    const { prewarmBackend } = await freshPrewarm()

    expect(prewarmBackend(1_000)).toBe(true)

    expect(healthCalls()).toHaveLength(1)
    const [, init] = healthCalls()[0] as [string, RequestInit | undefined]
    // Anything beyond these could make the browser send a preflight first.
    expect(Object.keys(init ?? {}).sort()).toEqual(['cache', 'credentials'])
    expect(init?.method ?? 'GET').toBe('GET')
    expect(init?.headers).toBeUndefined()
    expect(init?.body).toBeUndefined()
    expect(init?.credentials).toBe('omit')
  })

  it('does not ask again in the same tab within five minutes, and does after', async () => {
    const { prewarmBackend, PREWARM_INTERVAL_MS } = await freshPrewarm()

    expect(prewarmBackend(10_000)).toBe(true)
    expect(prewarmBackend(10_000 + 1)).toBe(false)
    expect(prewarmBackend(10_000 + PREWARM_INTERVAL_MS - 1)).toBe(false)
    expect(healthCalls()).toHaveLength(1)

    expect(prewarmBackend(10_000 + PREWARM_INTERVAL_MS)).toBe(true)
    expect(healthCalls()).toHaveLength(2)
  })

  it('remembers the wake-up across a reload of the tab (the session store)', async () => {
    const first = await freshPrewarm()
    first.prewarmBackend(50_000)

    const afterReload = await freshPrewarm()
    expect(afterReload.prewarmBackend(50_000 + 60_000)).toBe(false)
    expect(healthCalls()).toHaveLength(1)
  })

  it('still asks only once when the session store is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { prewarmBackend } = await freshPrewarm()

    expect(prewarmBackend(1_000)).toBe(true)
    expect(prewarmBackend(2_000)).toBe(false)
    expect(healthCalls()).toHaveLength(1)
  })

  it('swallows a failed request and does not retry it', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))
    const { prewarmBackend } = await freshPrewarm()

    expect(() => prewarmBackend(1_000)).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(prewarmBackend(2_000)).toBe(false)

    expect(healthCalls()).toHaveLength(1)
    expect(unhandled).not.toHaveBeenCalled()
    process.off('unhandledRejection', unhandled)
  })

  it('is silent when fetch throws before it starts', async () => {
    fetchMock.mockImplementation(() => {
      throw new TypeError('no fetch')
    })
    const { prewarmBackend } = await freshPrewarm()

    expect(() => prewarmBackend(1_000)).not.toThrow()
  })

  it('does not ask on the dev server', async () => {
    vi.stubEnv('DEV', true)
    const { prewarmBackend } = await freshPrewarm()

    expect(prewarmBackend(1_000)).toBe(false)
    expect(healthCalls()).toHaveLength(0)
  })
})

describe('the sign-in page', () => {
  async function renderLogin() {
    const { EntryPage } = await import('@/pages/entry/EntryPage')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    return render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<EntryPage />} />
              <Route path="/" element={<p>student home</p>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
  }

  it('wakes the backend once as it opens, and not again when the visitor comes back', async () => {
    await freshPrewarm()
    const first = await renderLogin()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(healthCalls()).toHaveLength(1)

    // Off to another page and back: the page mounts again, the tab already asked.
    first.unmount()
    await renderLogin()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(healthCalls()).toHaveLength(1)
  })

  it('signs in as before when the wake-up fails', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))
    mswServer.use(
      http.post('https://api.test/auth/login', () =>
        HttpResponse.json({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false },
        }),
      ),
    )
    await freshPrewarm()
    await renderLogin()
    expect(healthCalls()).toHaveLength(1)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('student home')).toBeInTheDocument()
  })
})
