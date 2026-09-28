/**
 * Renders the router generated from the route manifest, with every page
 * replaced by a stub that prints its name. The guards, the redirects and the
 * route matching are the real ones; only what a page would fetch is left out.
 *
 * A test file opts in with
 *   vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))
 */
import { render } from '@testing-library/react'
import { MemoryRouter, useLocation, type InitialEntry } from 'react-router-dom'
import { AppRoutes } from '@/app/router/AppRoutes'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

export type Viewer = 'anonymous' | UserRole

export const ALL_VIEWERS: readonly Viewer[] = [
  'anonymous',
  'student',
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]

/** `pending`: a stored token whose account /auth/me has not returned yet. */
export function signInAs(viewer: Viewer | 'pending', options: { mustChangePassword?: boolean } = {}) {
  if (viewer === 'pending') {
    useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
    return
  }
  if (viewer === 'anonymous') {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    return
  }
  useAuthStore.setState({
    user: {
      id: `u-${viewer}`,
      name: 'Ada',
      email: 'ada@example.com',
      role: viewer,
      mustChangePassword: options.mustChangePassword ?? false,
    } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

type Probe = { pathname: string; search: string; state: unknown }

function LocationProbe({ onChange }: { onChange: (probe: Probe) => void }) {
  const location = useLocation()
  onChange({ pathname: location.pathname, search: location.search, state: location.state })
  return null
}

export type Outcome = { pathname: string; search: string; state: unknown; page: string | null; text: string }

/** Open `entry` as `viewer`, the way typing it into the address bar would. */
export function openAs(
  viewer: Viewer | 'pending',
  entry: InitialEntry,
  options: { mustChangePassword?: boolean } = {},
): Outcome {
  signInAs(viewer, options)
  let probe: Probe = { pathname: '', search: '', state: null }
  const view = render(
    <MemoryRouter initialEntries={[entry]}>
      <AppRoutes />
      <LocationProbe onChange={(next) => (probe = next)} />
    </MemoryRouter>,
  )
  const page = view.queryByTestId('page')?.textContent ?? null
  const text = view.container.textContent ?? ''
  view.unmount()
  return { ...probe, page, text }
}
