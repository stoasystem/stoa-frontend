/**
 * Sign-in timing, handed over by the route manifest (#45 to #47): ChatPage
 * and LearnPage no longer have routes, so the planet a student lands on ends
 * the clock, once its first frame is drawn.
 */
import { act, render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { PlanetHomePage } from '@/pages/planet/PlanetPages'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useAuthStore } from '@/store/authStore'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/components/notifications/NotificationCenter', () => ({ NotificationCenter: () => null }))

const frames: FrameRequestCallback[] = []

beforeEach(async () => {
  vi.mocked(trackEvent).mockClear()
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false } as never,
    accessToken: 'token',
    isAuthenticated: true,
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
  } as DOMRect)
  // jsdom has no 2D canvas; the planet falls back to a renderer that draws nothing.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  frames.length = 0
  sessionStorage.clear()
})

function landOnPlanet() {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<PlanetHomePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  act(() => {
    for (const frame of frames.splice(0)) frame(performance.now())
  })
}

describe('the planet ends the sign-in clock', () => {
  it('marks the first screen ready at / once the planet is drawn', () => {
    sessionStorage.setItem('stoa.login.submittedAt', String(Date.now() - 1200))
    landOnPlanet()
    expect(trackEvent).toHaveBeenCalledWith(
      'login_first_screen_ready',
      expect.objectContaining({ route: '/', msSinceSubmit: expect.any(Number) }),
    )
    expect(sessionStorage.getItem('stoa.login.submittedAt')).toBeNull()
  })

  it('marks nothing when no sign-in started the clock', () => {
    landOnPlanet()
    expect(trackEvent).not.toHaveBeenCalledWith('login_first_screen_ready', expect.anything())
  })
})
