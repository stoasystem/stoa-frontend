/**
 * The review of a knowledge point sits inside the app shell like every other
 * student page. It stood alone on app.stoaedu.ch (2026-10-10): no bar, no
 * bell, no account menu, so the way back was only its own button.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import i18n from '@/i18n'
import enCommon from '@/i18n/locales/en/common.json'
import enPractice from '@/i18n/locales/en/practice.json'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'bypass' })
  // A lazy page: load it before the first findBy, as the /me tests do (#94).
  await import('@/pages/review/ReviewPage')
})
beforeEach(async () => {
  await i18n.changeLanguage('en')
  mswServer.use(
    http.get('https://api.test/practice/review/due', () =>
      HttpResponse.json({ items: [], dueCount: 0, generatedAt: '2026-10-10T10:00:00+00:00' }),
    ),
    http.get('https://api.test/notifications', () => HttpResponse.json({ items: [], count: 0 })),
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('/review/:unitId', () => {
  it('opens inside the app shell, with the account menu', async () => {
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter initialEntries={['/review/brueche-u1']}>
            <Suspense fallback={null}>
              <AppRoutes />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )

    expect(await screen.findByRole('heading', { name: enPractice.review.title })).toBeInTheDocument()
    expect(document.querySelector('[data-top-bar]')).not.toBeNull()
    expect(screen.getByRole('button', { name: enCommon.accountMenu.open })).toBeInTheDocument()
  })
})
