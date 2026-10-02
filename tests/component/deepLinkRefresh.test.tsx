/**
 * A deep link survives a refresh: the whole app mounts cold at the address,
 * with nothing but the stored token, waits for /auth/me, and then shows the
 * page for that address -- not the sign-in page, not the star map's front, and
 * with every route parameter intact.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRouter } from '@/app/router/AppRouter'
import i18n from '@/i18n'
import { getCurrentUser } from '@/services/auth/authApi'
import { getPracticeLesson } from '@/services/practice/practiceApi'
import { TOKEN_KEY, useAuthStore, type CurrentUser } from '@/store/authStore'

vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  getCurrentUser: vi.fn(),
}))
// The bell polls the backend; it has nothing to do with where a link lands.
vi.mock('@/components/notifications/NotificationCenter', () => ({ NotificationCenter: () => null }))
// The practice stage's lesson, and a catalog without the unit (the chapter strip then says less).
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getPracticeLesson: vi.fn(async (lessonId: string) => ({
    id: lessonId,
    unitId: 'u-7',
    subjectId: 'math',
    gradeLevel: '8',
    topicId: 'geometry',
    title: 'Measuring angles',
    topic: 'Angles',
    difficulty: 'intro',
    status: 'available',
    estimatedMinutes: 10,
    challenges: [],
  })),
  getCurriculumCatalog: vi.fn(async () => ({ subjects: [], topics: [], units: [], lessons: [], rolloutSubjects: [], includePreview: false, source: 'test' })),
}))

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

  it('reopens /chapter/u-7/l-3 on that lesson of that chapter once the account is back', async () => {
    refreshAt('/chapter/u-7/l-3')

    // The practice stage (#50): the lesson the path names, the way back to the chapter it names.
    expect(await screen.findByRole('heading', { level: 1, name: 'Measuring angles' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/chapter/u-7/l-3')
    expect(vi.mocked(getPracticeLesson)).toHaveBeenCalledWith('l-3')
    expect(screen.getByRole('link', { name: 'Back to Angles' })).toHaveAttribute('href', '/chapter/u-7')
  })

  it('reopens /ask/c-42 on that conversation once the account is back', async () => {
    refreshAt('/ask/c-42')

    // Ask opens over the home planet, on the conversation the path names (#49).
    expect(await screen.findByRole('heading', { name: 'Mathematics' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/ask/c-42')
    expect(document.querySelector('[data-ask-surface]')?.getAttribute('data-ask-conversation')).toBe('c-42')
  })

  it('reopens /me in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    refreshAt('/me')

    expect(await screen.findByRole('heading', { name: 'Dein Konto' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/me')
  })

  it('still sends a signed-out refresh to sign in', async () => {
    window.history.replaceState(null, '', '/map/math')
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

  it('reopens a star on the star map, at that star (#47, #72)', async () => {
    // jsdom has no 2D canvas; the map draws nothing but keeps its DOM.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    refreshAt('/map/math/numbers/numbers-5')

    expect(await screen.findByRole('heading', { level: 1, name: 'Numbers 5' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/map/math/numbers/numbers-5')
    expect(screen.getByRole('article', { name: 'Numbers 5' })).toBeInTheDocument()
    expect(screen.getByText('Placeholder star · demo content, no chapter.')).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
