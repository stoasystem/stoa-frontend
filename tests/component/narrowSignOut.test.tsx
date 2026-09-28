import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/layouts/AppLayout'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en', changeLanguage: vi.fn() },
  }),
}))

// The layout must reach the one shared sign-out, not a copy of it; what that
// hook does is covered by useSignOut.test.tsx and logout.test.tsx.
const { signOut } = vi.hoisted(() => ({ signOut: vi.fn(async () => {}) }))
vi.mock('@/hooks/auth/useSignOut', () => ({
  useSignOut: () => ({ signOut, isSigningOut: false }),
}))

// jsdom applies no stylesheet, so "visible at 375px" is read off the Tailwind
// classes on the button and every ancestor, with Tailwind's default min-width
// breakpoints (src/index.css does not override them). A display or visibility
// utility behind any other variant is refused rather than guessed at.
const BREAKPOINTS: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
const SHOWN = new Set([
  'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid',
  'contents', 'table', 'flow-root', 'list-item', 'not-sr-only',
])
const HIDDEN = new Set(['hidden', 'sr-only'])

function shownByOwnClassesAt(element: Element, width: number): boolean {
  const channels = { display: { shown: true, from: -1 }, visibility: { shown: true, from: -1 } }
  for (const cls of Array.from(element.classList)) {
    const parts = cls.split(':')
    const utility = parts[parts.length - 1]
    const channel =
      SHOWN.has(utility) || HIDDEN.has(utility)
        ? channels.display
        : utility === 'invisible' || utility === 'visible'
          ? channels.visibility
          : null
    if (!channel) continue
    if (parts.length > 2 || (parts.length === 2 && !(parts[0] in BREAKPOINTS))) {
      throw new Error(`the width model does not know "${cls}"; extend it before trusting this test`)
    }
    const from = parts.length === 2 ? BREAKPOINTS[parts[0]] : 0
    if (from > width || from < channel.from) continue
    channel.from = from
    channel.shown = !(HIDDEN.has(utility) || utility === 'invisible')
  }
  return channels.display.shown && channels.visibility.shown
}

function shownAt(element: Element, width: number): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (!shownByOwnClassesAt(node, width)) return false
  }
  return true
}

function signOutButtonsShownAt(width: number) {
  return screen
    .getAllByRole('button', { name: 'actions.logOut' })
    .filter((button) => shownAt(button, width) && !button.hasAttribute('disabled'))
}

function renderShellAs(role: UserRole) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada Lovelace', email: 'ada@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[getDefaultRouteForRole(role)]}>
        <AppLayout>
          <p>page</p>
        </AppLayout>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const ROLES: UserRole[] = ['student', 'parent', 'teacher', 'admin']

// Below 640px both sign-out buttons used to be hidden, the sidebar's below
// `md` and the top bar's below `sm`, so a phone could not sign out at all
// (stoasystem/stoa-frontend#2).
describe('signing out on a narrow screen', () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
  afterEach(() => mswServer.resetHandlers())
  afterAll(() => mswServer.close())
  beforeEach(() => {
    signOut.mockClear()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  })

  describe.each([375, 632])('at %ipx', (width) => {
    it.each(ROLES)('offers a %s a visible sign-out that uses the shared sign-out', async (role) => {
      renderShellAs(role)

      const shown = signOutButtonsShownAt(width)
      expect(shown, `no sign-out a ${role} can see at ${width}px`).toHaveLength(1)

      await userEvent.click(shown[0])
      expect(signOut).toHaveBeenCalledOnce()
    })
  })

  // Desktop keeps what it had: one sign-out in the sidebar, one in the top bar.
  it.each(ROLES)('leaves a %s both desktop sign-outs at 1280px', (role) => {
    renderShellAs(role)

    expect(signOutButtonsShownAt(1280)).toHaveLength(2)
  })
})
