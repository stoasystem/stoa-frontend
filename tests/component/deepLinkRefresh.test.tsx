/**
 * A deep link survives a refresh: the whole app mounts cold at the address,
 * with nothing but the stored token, waits for /auth/me, and then shows the
 * page for that address -- not the sign-in page, not the planet's front, and
 * with every route parameter intact.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRouter } from '@/app/router/AppRouter'
import i18n from '@/i18n'
import { getCurrentUser } from '@/services/auth/authApi'
import { TOKEN_KEY, useAuthStore, type CurrentUser } from '@/store/authStore'

vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  getCurrentUser: vi.fn(),
}))
// The bell polls the backend; it has nothing to do with where a link lands.
vi.mock('@/components/notifications/NotificationCenter', () => ({ NotificationCenter: () => null }))

const student = {
  id: 'u-1',
  name: 'Ada',
  email: 'ada@example.com',
  role: 'student',
  mustChangePassword: false,
} as CurrentUser

function refreshAt(path: string) {
  window.history.replaceState(null, '', path)
  // What survives a reload: the stored token, and no account in memory.
  localStorage.setItem(TOKEN_KEY, 'token')
  useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <AppRouter />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('a deep link refreshed in the browser', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.mocked(getCurrentUser).mockResolvedValue(student)
  })

  afterEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it.each([
    ['/planet/math/fractions/u-7', 'Knowledge point', ['math', 'fractions', 'u-7']],
    ['/chapter/u-7/l-3', 'Lesson', ['u-7', 'l-3']],
    ['/ask/c-42', 'Ask', ['c-42']],
  ])('reopens %s once the account is back', async (path, title, params) => {
    refreshAt(path)

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    expect(window.location.pathname).toBe(path)
    const shown = screen.getByTestId('route-params').textContent ?? ''
    for (const value of params) expect(shown).toContain(value)
  })

  it('reopens /me in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    refreshAt('/me')

    expect(await screen.findByRole('heading', { name: 'Dein Konto' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/me')
  })

  it('still sends a signed-out refresh to sign in', async () => {
    window.history.replaceState(null, '', '/planet/math')
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <AppRouter />
        </QueryClientProvider>
      </I18nextProvider>,
    )

    await vi.waitFor(() => expect(window.location.pathname).toBe('/login'))
  })
})
