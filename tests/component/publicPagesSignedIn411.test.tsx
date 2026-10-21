/**
 * #411, the public pages' two navigation faults:
 * - "Start learning" led to `/login?next=/chat`, so a student who signed in
 *   from it landed on Ask (full screen on a phone), not the star map; and a
 *   reader already signed in was offered it too.
 * - The 404 page always drew the marketing layout, so a signed-in reader who
 *   followed a dead address dropped out of the app shell.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import enCommon from '@/i18n/locales/en/common.json'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

// The bell's own data is not what this is about.
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))

function signIn(role: UserRole) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

function show(page: ReactNode, path = '/') {
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const startLearning = () => screen.queryByRole('link', { name: enCommon.navigation.startLearning })
const topBar = () => document.querySelector('[data-top-bar]')

beforeAll(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

describe('"Start learning" (#411)', () => {
  it('leads a visitor to the sign-in page, which sends each role to its own home', () => {
    show(<MarketingLayout>page</MarketingLayout>, '/privacy')

    expect(startLearning()).toHaveAttribute('href', '/login')
  })

  it.each(['student', 'parent', 'teacher', 'admin'] as const)('is not offered to a signed-in %s', (role) => {
    signIn(role)
    show(<MarketingLayout>page</MarketingLayout>, '/privacy')

    expect(startLearning()).toBeNull()
  })

  it('waits for the account before hiding: a token alone is not a reader', () => {
    useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
    show(<MarketingLayout>page</MarketingLayout>, '/privacy')

    expect(startLearning()).toHaveAttribute('href', '/login')
  })
})

describe('the 404 page (#411)', () => {
  it('is the public page for a visitor', () => {
    show(<NotFoundPage />, '/no-such-page')

    expect(screen.getByRole('heading', { level: 1, name: enCommon.errorPages.notFound.title })).toBeInTheDocument()
    expect(topBar()).toBeNull()
    expect(startLearning()).not.toBeNull()
  })

  it.each(['student', 'parent', 'teacher', 'admin'] as const)('keeps a signed-in %s inside the app shell', (role) => {
    signIn(role)
    show(<NotFoundPage />, '/no-such-page')

    expect(screen.getByRole('heading', { level: 1, name: enCommon.errorPages.notFound.title })).toBeInTheDocument()
    expect(topBar()).not.toBeNull()
    expect(screen.getByRole('button', { name: enCommon.notifications.openLabel })).toBeInTheDocument()
    expect(startLearning()).toBeNull()
    expect(screen.getByRole('link', { name: enCommon.errorPages.notFound.action })).toHaveAttribute('href', '/')
  })
})
