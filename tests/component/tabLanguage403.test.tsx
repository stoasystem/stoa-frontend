/**
 * Each tab is read in its own language, and the account's stored one is the
 * last the reader chose (#403).
 *
 * Requests named their language from the stored key, which every tab of the
 * browser shares: a tab left in German fetched French star names, curriculum
 * titles and answers once another tab switched, and with storage blocked they
 * always went out in the browser's language. The preference write was fire
 * and forget: quick switches raced, and a failed one went unreported until
 * the next load switched back to what /auth/me still had stored.
 *
 * Other tabs are deliberately not switched along (no `storage` listener):
 * they keep the language they show, the stored key only picks the next load's.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { useChangeLanguage } from '@/hooks/i18n/useChangeLanguage'
import i18n from '@/i18n'
import { LANGUAGE_STORAGE_KEY, type SupportedLanguage } from '@/i18n/languages'
import deCommon from '@/i18n/locales/de/common.json'
import frCommon from '@/i18n/locales/fr/common.json'
import { httpClient } from '@/services/api/httpClient'
import { streamConversationMessage } from '@/services/chat/chatStreamApi'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

const PROBE = 'https://api.test/curriculum/probe'
const LOCALE = 'https://api.test/auth/me/preferences/locale'

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(async () => {
  vi.restoreAllMocks()
  queryClient.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  await i18n.changeLanguage('en')
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY)
})

/** The Accept-Language of each request the probe route sees. */
function probe() {
  const seen: (string | null)[] = []
  mswServer.use(
    http.get(PROBE, ({ request }) => {
      seen.push(request.headers.get('accept-language'))
      return HttpResponse.json({})
    }),
  )
  return seen
}

/** Another tab switching to `language`: it writes the shared key, and this tab is told. */
function anotherTabSwitchesTo(language: SupportedLanguage) {
  const oldValue = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: LANGUAGE_STORAGE_KEY,
      oldValue,
      newValue: language,
      storageArea: window.localStorage,
    }),
  )
}

/** The headers the next chat send goes out with; the send itself is refused. */
async function chatSendHeaders() {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }))
  await streamConversationMessage({
    conversationId: 'c-1',
    payload: { content: 'Was ist ein Bruch?', idempotencyKey: 'k-1' },
    onEvent: () => {},
  }).catch(() => {})
  return new Headers(fetchSpy.mock.calls[0][1]?.headers)
}

describe('the language a request asks for', () => {
  it("stays this tab's after another tab switches", async () => {
    const seen = probe()
    await act(() => i18n.changeLanguage('de'))

    anotherTabSwitchesTo('fr')
    await httpClient.get(PROBE)

    expect(seen).toEqual(['de'])
    expect(i18n.language).toBe('de')
    expect((await chatSendHeaders()).get('accept-language')).toBe('de')
  })

  it('follows this tab when it switches', async () => {
    const seen = probe()
    anotherTabSwitchesTo('fr')

    await act(() => i18n.changeLanguage('it'))
    await httpClient.get(PROBE)

    expect(seen).toEqual(['it'])
    expect((await chatSendHeaders()).get('accept-language')).toBe('it')
  })
})

describe('with site storage blocked', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!
  beforeEach(() => {
    vi.resetModules()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      },
    })
  })
  afterEach(() => {
    Object.defineProperty(window, 'localStorage', original)
  })

  it('asks for the language on screen, not the browser one', async () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('de-CH')
    const seen = probe()
    const { default: freshI18n } = await import('@/i18n')
    const { httpClient: freshClient } = await import('@/services/api/httpClient')
    expect(freshI18n.language).toBe('de')

    await freshI18n.changeLanguage('it')
    await freshClient.get(PROBE)

    expect(seen).toEqual(['it'])
  })
})

function signIn(role: UserRole = 'student') {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role, preferredLocale: 'en' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function localeAnswer(locale: string) {
  return HttpResponse.json({
    preferredLocale: locale,
    effectiveLocale: locale,
    supportedLocales: ['de', 'en', 'fr', 'it'],
    updatedAt: '2026-10-20T10:00:00Z',
  })
}

describe('saving the choice to the account', () => {
  // A toast that closes (on its own, or on Try again) is removed by a timer of
  // sonner's that unmounting does not clear. Left to the clock, it could fire
  // after this file's environment was gone: React then read `window` and the
  // run failed with an unhandled error, though every test passed. The timers
  // are run here, while there is still a window, and none may be left behind.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })

  it('sends one write at a time, in order, so the last choice is the one stored', async () => {
    signIn()
    let stored = 'en'
    let inFlight = 0
    let mostAtOnce = 0
    const received: string[] = []
    // The first write is the slowest: sent all at once, it would land last.
    const delays: Record<string, number> = { de: 60, fr: 30, it: 0 }
    mswServer.use(
      http.patch(LOCALE, async ({ request }) => {
        const { preferredLocale } = (await request.json()) as { preferredLocale: string }
        received.push(preferredLocale)
        inFlight += 1
        mostAtOnce = Math.max(mostAtOnce, inFlight)
        await new Promise((resolve) => setTimeout(resolve, delays[preferredLocale]))
        inFlight -= 1
        stored = preferredLocale
        return localeAnswer(preferredLocale)
      }),
    )
    const { result } = renderHook(() => useChangeLanguage(), { wrapper })

    for (const language of ['de', 'fr', 'it'] as const) {
      act(() => result.current.changeLanguage(language))
    }

    await waitFor(() => expect(received).toHaveLength(3))
    await waitFor(() => expect(queryClient.isMutating()).toBe(0))
    expect(stored).toBe('it')
    expect(received).toEqual(['de', 'fr', 'it'])
    expect(mostAtOnce).toBe(1)
    expect(useAuthStore.getState().user?.preferredLocale).toBe('it')
    expect(i18n.language).toBe('it')
  })

  function renderSwitch() {
    render(<Toaster />)
    return renderHook(() => useChangeLanguage(), { wrapper })
  }

  it('says so when the write fails, in the new language, and saves it on Try again', async () => {
    signIn()
    const received: string[] = []
    mswServer.use(
      http.patch(LOCALE, async ({ request }) => {
        const { preferredLocale } = (await request.json()) as { preferredLocale: string }
        received.push(preferredLocale)
        return received.length === 1 ? HttpResponse.json({ detail: 'down' }, { status: 503 }) : localeAnswer(preferredLocale)
      }),
    )
    const { result } = renderSwitch()

    act(() => result.current.changeLanguage('de'))

    expect(await screen.findByText(deCommon.language.saveFailed)).toBeInTheDocument()
    expect(i18n.language).toBe('de')

    // A plain click: sonner captures the pointer on pointerdown, which jsdom lacks.
    fireEvent.click(screen.getByRole('button', { name: deCommon.actions.tryAgain }))
    await waitFor(() => expect(useAuthStore.getState().user?.preferredLocale).toBe('de'))
    expect(received).toEqual(['de', 'de'])
  })

  it('speaks formally to staff and parents', async () => {
    signIn('teacher')
    mswServer.use(http.patch(LOCALE, () => HttpResponse.json({ detail: 'down' }, { status: 503 })))
    const { result } = renderSwitch()

    act(() => result.current.changeLanguage('fr'))

    expect(await screen.findByText(frCommon.language.saveFailed_formal)).toBeInTheDocument()
  })

  it('leaves a failed write unreported when a later choice was stored after it', async () => {
    signIn()
    const received: string[] = []
    mswServer.use(
      http.patch(LOCALE, async ({ request }) => {
        const { preferredLocale } = (await request.json()) as { preferredLocale: string }
        received.push(preferredLocale)
        return preferredLocale === 'de' ? HttpResponse.json({ detail: 'down' }, { status: 503 }) : localeAnswer(preferredLocale)
      }),
    )
    const { result } = renderSwitch()

    act(() => result.current.changeLanguage('de'))
    act(() => result.current.changeLanguage('fr'))

    await waitFor(() => expect(useAuthStore.getState().user?.preferredLocale).toBe('fr'))
    expect(received).toEqual(['de', 'fr'])
    expect(screen.queryByText(deCommon.language.saveFailed)).toBeNull()
    expect(screen.queryByText(frCommon.language.saveFailed)).toBeNull()
  })
})
