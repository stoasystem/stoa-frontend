/**
 * What the map route shows while the sky is not drawn (#329). Before, the
 * read model's source gave the empty sky while loading, after a failure, and
 * for a sky that came back empty alike, so all three said "your star map is
 * on its way", and the sign-in clock stopped on that placeholder.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { KnowledgeMapSourceProvider } from '@/features/starmap/readModelSource'
import i18n from '@/i18n'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse } from '@/types/practice'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
}))

const mockedGet = vi.mocked(getKnowledgeMap)

const emptySky: KnowledgeMapResponse = {
  subjectId: 'math',
  galaxies: [],
  nebulae: [],
  stars: [],
  prerequisites: [],
  summary: { lit: 0, total: 0, streakDays: 0, score: 0 },
}

beforeEach(async () => {
  mockedGet.mockReset()
  vi.mocked(trackEvent).mockClear()
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false } as never,
    accessToken: 'token',
    isAuthenticated: true,
  })
  sessionStorage.setItem('stoa.login.submittedAt', String(Date.now() - 1200))
})

afterEach(() => {
  sessionStorage.clear()
})

function openMap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <KnowledgeMapSourceProvider>
          <MemoryRouter initialEntries={['/map/math']}>
            <Routes>
              <Route path="/map/:subjectId" element={<StarMapRoute />} />
            </Routes>
          </MemoryRouter>
        </KnowledgeMapSourceProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const stopped = () => vi.mocked(trackEvent).mock.calls.some(([name]) => name === 'login_first_screen_ready')

describe('the map route before the sky is drawn (#329)', () => {
  it('shows a skeleton while the sky is on the wire, and keeps the sign-in clock running', async () => {
    mockedGet.mockReturnValue(new Promise(() => {}))
    const { container } = openMap()

    expect(container.querySelector('[data-starmap-loading]')).not.toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your star map…')
    expect(screen.queryByText('Your star map is on its way')).toBeNull()
    await act(async () => {})
    expect(stopped()).toBe(false)
    expect(sessionStorage.getItem('stoa.login.submittedAt')).not.toBeNull()
  })

  it('says the sky could not be read, and asks for it again on retry', async () => {
    mockedGet.mockRejectedValue(new Error('offline'))
    openMap()

    // The source tries once more on its own before it gives up.
    expect(await screen.findByRole('heading', { name: 'Your star map didn’t load' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByText('Your star map is on its way')).toBeNull()
    expect(stopped()).toBe(false)

    const asked = mockedGet.mock.calls.length
    mockedGet.mockResolvedValue(emptySky)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Your star map is on its way' })).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledTimes(asked + 1)
  }, 15_000)

  it('says the star map is on its way only for a sky that came back empty, and stops the clock there', async () => {
    mockedGet.mockResolvedValue(emptySky)
    openMap()

    expect(await screen.findByRole('heading', { name: 'Your star map is on its way' })).toBeInTheDocument()
    expect(stopped()).toBe(true)
  })

  it('has the new words in every language', async () => {
    for (const language of ['de', 'fr', 'it']) {
      const t = i18n.getFixedT(language, 'starmap')
      for (const key of ['loadingSky', 'skyError.title', 'skyError.body', 'skyError.retry']) {
        expect(t(key), `${language} ${key}`).not.toBe(i18n.getFixedT('en', 'starmap')(key))
        expect(t(key), `${language} ${key}`).not.toBe(key)
      }
    }
  })
})
