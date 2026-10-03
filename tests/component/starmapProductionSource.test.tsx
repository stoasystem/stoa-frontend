/**
 * The application's star map carries no demo sky (#131). Opened through the
 * real router, with no star map source provided, `/map/math` is an empty sky:
 * the empty state, no Demo notice, no placeholder star, no canvas. The demo
 * sky only appears when something injects it through `StarMapSourceContext`
 * (the design preview, the bench, the tests that need it).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRouter } from '@/app/router/AppRouter'
import { DemoStarMapSource } from '@/dev/demo/sky/source'
import i18n from '@/i18n'
import { getCurrentUser } from '@/services/auth/authApi'
import { TOKEN_KEY, useAuthStore, type CurrentUser } from '@/store/authStore'

vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  getCurrentUser: vi.fn(),
}))
// The bell polls the backend; it has nothing to do with the map.
vi.mock('@/components/notifications/NotificationCenter', () => ({ NotificationCenter: () => null }))

const student = { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false } as CurrentUser

function openAt(path: string, wrap: (app: ReactNode) => ReactNode = (app) => app) {
  window.history.replaceState(null, '', path)
  localStorage.setItem(TOKEN_KEY, 'token')
  useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{wrap(<AppRouter />)}</QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('the star map in the application (#131)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.mocked(getCurrentUser).mockResolvedValue(student)
    // jsdom has no 2D canvas; the demo sky draws nothing but keeps its DOM.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('shows an empty sky on /map/math: no demo notice, no placeholder stars, no canvas', async () => {
    const { container } = openAt('/map/math')

    expect(await screen.findByRole('heading', { level: 1, name: 'Your star map is on its way' })).toBeInTheDocument()
    expect(screen.getByText('Your subjects and knowledge points will appear here as soon as they are ready.')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/map/math')
    expect(container.querySelector('[data-starmap-empty]')).not.toBeNull()
    expect(container.querySelector('canvas')).toBeNull()
    const text = container.textContent ?? ''
    for (const demo of ['Demo', 'Placeholder star', 'Sine and cosine', 'Trigonometry', 'demo.']) expect(text).not.toContain(demo)
  })

  it('has no demo words in its locale files (they live in src/dev/demo/sky/strings.ts)', () => {
    // Read from disk: importing the demo source above adds them to i18next's (and the imported JSON's) objects.
    for (const language of ['de', 'en', 'fr', 'it']) {
      const file = path.resolve(__dirname, `../../src/i18n/locales/${language}/starmap.json`)
      expect(JSON.parse(readFileSync(file, 'utf8')), language).not.toHaveProperty('demo')
    }
  })

  it('draws the demo sky once a source injects it (positive control)', async () => {
    const { container } = openAt('/map/math', (app) => <DemoStarMapSource>{app}</DemoStarMapSource>)

    expect(await screen.findByRole('heading', { name: 'Mathematics' })).toBeInTheDocument()
    expect(screen.getByText('Demo · Sample content and progress')).toBeInTheDocument()
    expect(container.querySelector('[data-starmap-empty]')).toBeNull()
  })
})
