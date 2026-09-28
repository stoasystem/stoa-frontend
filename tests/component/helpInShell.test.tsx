/**
 * The avatar menu's Help (#46): signed in, /support stays inside the app
 * shell (bar, bell, avatar and its sign-out) and offers nothing that sends a
 * signed-in account to the marketing site; signed out it is the public page.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ManageBillingButton } from '@/components/billing/ManageBillingButton'
import { SupportPage } from '@/pages/support/SupportPage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => (options?.returnObjects ? [] : key),
    i18n: { resolvedLanguage: 'en', language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled', isLive: false }),
}))

afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

function renderSupport(role: UserRole | null) {
  useAuthStore.setState(
    role
      ? {
        user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role } as CurrentUser,
        accessToken: 'token',
        isAuthenticated: true,
      }
      : { user: null, accessToken: null, isAuthenticated: false },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/support']}>
        <SupportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const hrefs = () => Array.from(document.querySelectorAll('a')).map((link) => link.getAttribute('href'))

describe('Help, signed in', () => {
  it.each(['student', 'parent', 'teacher', 'admin', 'organization_admin'] as const)(
    'keeps a %s inside the app shell, with the avatar menu at hand',
    (role) => {
      renderSupport(role)

      expect(screen.getByText('support:title')).toBeInTheDocument()
      expect(document.querySelector('[data-top-bar]')).not.toBeNull()
      expect(screen.getByRole('button', { name: 'accountMenu.open' })).toBeInTheDocument()
      // Nothing that belongs to a visitor: no "Start learning" into /login, no public tour.
      expect(hrefs().filter((href) => href?.startsWith('/login') || href === '/onboarding')).toEqual([])
    },
  )
})

describe('Help, signed out', () => {
  it('is still the public page, with its way in', () => {
    renderSupport(null)

    expect(screen.getByText('support:title')).toBeInTheDocument()
    expect(document.querySelector('[data-top-bar]')).toBeNull()
    expect(hrefs()).toContain('/onboarding')
  })
})

// The parent's "Billing and payments" stays one menu item (#46): payment
// settings are reached from the billing page itself, not from the menu.
describe('payment settings', () => {
  it('are linked from the billing page', () => {
    render(
      <MemoryRouter>
        <ManageBillingButton />
      </MemoryRouter>,
    )
    expect(hrefs()).toEqual(['/billing/payment-settings'])
  })
})
