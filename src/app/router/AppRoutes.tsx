/**
 * The router, generated from the route manifest.
 *
 * Nothing here names a path. Every entry in `pageRoutes` and
 * `legacyRedirects` is placed behind the guard its `access` asks for:
 * `public` at the top level, `signedIn` inside ProtectedRoute, and a role list
 * inside ProtectedRoute and a RoleRoute for exactly those roles.
 */
import { useState, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { DemoSurfaceRoute } from '@/app/router/DemoSurfaceRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleRoute } from '@/app/router/RoleRoute'
import {
  CHANGE_PASSWORD_PATH,
  legacyRedirects,
  pageRoutes,
  type LegacyRedirect,
  type PageRoute,
  type RouteAccess,
} from '@/app/router/routeManifest'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

/*
 * Each of these fails closed: an `access` whose kind is not one of the three
 * (a typo that got past the types, a cast) throws while the router is built,
 * rather than quietly falling through to "any signed-in account".
 */
function unknownAccess(access: never): never {
  throw new Error(`route manifest: unknown access ${JSON.stringify(access)}`)
}

export function accessKey(access: RouteAccess): string {
  switch (access.kind) {
    case 'public':
    case 'signedIn':
      return access.kind
    case 'roles':
      return `roles:${access.roles.join(',')}`
    default:
      return unknownAccess(access)
  }
}

/** Whether the signed-in account (if any) may open a route with `access`. */
export function isAdmitted(
  access: RouteAccess,
  user: { role: UserRole } | null,
  isAuthenticated: boolean,
): boolean {
  switch (access.kind) {
    case 'public':
      return true
    case 'signedIn':
      return isAuthenticated && user !== null
    case 'roles':
      return isAuthenticated && user !== null && access.roles.includes(user.role)
    default:
      return unknownAccess(access)
  }
}

/** Where a legacy link lands, with its context carried when the entry asks. */
function useRedirectTarget(redirect: LegacyRedirect) {
  const params = useParams()
  const location = useLocation()
  const search = new URLSearchParams(location.search)
  const pathname =
    typeof redirect.to === 'string' ? redirect.to : redirect.to({ params, search })

  if (!redirect.carryContext) return { to: pathname, state: undefined }

  for (const consumed of redirect.consumes ?? []) search.delete(consumed)
  const query = search.toString()
  return {
    to: { pathname, search: query ? `?${query}` : '', hash: location.hash },
    state: location.state,
  }
}

function LegacyRedirectElement({ redirect }: { redirect: LegacyRedirect }) {
  const { to, state } = useRedirectTarget(redirect)
  return <Navigate replace to={to} state={state} />
}

/**
 * A redirect for some roles on a path that is still a page for the others.
 * An account under a forced password change is never led away from the one
 * screen it can use -- not even the moment the change goes through, which
 * clears the flag while the page is still saying so (#46). Once the page has
 * been shown for a forced change, it stays until the visitor leaves it.
 */
function RoleScopedRedirect({
  redirect,
  children,
}: {
  redirect: LegacyRedirect
  children: ReactNode
}) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const { to, state } = useRedirectTarget(redirect)
  const applies = Boolean(user && redirect.onlyFor?.includes(user.role))
  const forcedNow = Boolean(user?.mustChangePassword) && location.pathname === CHANGE_PASSWORD_PATH
  // Remembered from an earlier render (React's "adjust state while
  // rendering"), so the render that clears the flag still finds it.
  const [wasForced, setWasForced] = useState(false)
  if (forcedNow && !wasForced) setWasForced(true)

  if (applies && !forcedNow && !wasForced) return <Navigate replace to={to} state={state} />
  return children
}

/**
 * For a route with a `refusedPage`: a visitor the route admits goes on
 * through the real guards; anyone else is shown the refused page instead.
 */
function RefusedPageSwitch({ access, refused }: { access: RouteAccess; refused: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return isAdmitted(access, user, isAuthenticated) ? <Outlet /> : refused
}

function pageElement(route: PageRoute, redirects: readonly LegacyRedirect[]): ReactNode {
  const Page = route.page
  const props = route.titleKey ? { ...route.props, titleKey: route.titleKey } : route.props
  const page = <Page {...props} />
  const shown = route.demoSurface ? <DemoSurfaceRoute>{page}</DemoSurfaceRoute> : page
  const redirect = redirects.find(
    (candidate) => candidate.from === route.path && candidate.onlyFor,
  )
  return redirect ? <RoleScopedRedirect redirect={redirect}>{shown}</RoleScopedRedirect> : shown
}

function guarded(access: RouteAccess, key: string, children: ReactNode[]): ReactNode {
  switch (access.kind) {
    case 'public':
      return children
    case 'signedIn':
      return (
        <Route element={<ProtectedRoute />} key={key}>
          {children}
        </Route>
      )
    case 'roles':
      return (
        <Route element={<ProtectedRoute />} key={key}>
          <Route element={<RoleRoute allowedRoles={[...access.roles]} />} key={`${key}:role`}>
            {children}
          </Route>
        </Route>
      )
    default:
      return unknownAccess(access)
  }
}

export function buildRoutes(
  pages: readonly PageRoute[] = pageRoutes,
  redirects: readonly LegacyRedirect[] = legacyRedirects,
): ReactNode[] {
  const groups = new Map<string, { access: RouteAccess; children: ReactNode[] }>()
  const group = (access: RouteAccess) => {
    const key = accessKey(access)
    let found = groups.get(key)
    if (!found) {
      found = { access, children: [] }
      groups.set(key, found)
    }
    return found.children
  }
  const topLevel: ReactNode[] = []

  for (const route of pages) {
    if (route.refusedPage) {
      const Refused = route.refusedPage
      topLevel.push(
        <Route
          element={<RefusedPageSwitch access={route.access} refused={<Refused />} />}
          key={`refused:${route.path}`}
          path={route.path}
        >
          {guarded(route.access, `refused:${route.path}:guard`, [
            <Route element={pageElement(route, redirects)} index key={route.path} />,
          ])}
        </Route>,
      )
      continue
    }
    group(route.access).push(
      <Route element={pageElement(route, redirects)} key={route.path} path={route.path} />,
    )
  }

  for (const redirect of redirects) {
    // A role-scoped redirect rides on the page at the same path.
    if (redirect.onlyFor) continue
    group(redirect.access).push(
      <Route
        element={<LegacyRedirectElement redirect={redirect} />}
        key={`redirect:${redirect.from}`}
        path={redirect.from}
      />,
    )
  }

  return [
    ...topLevel,
    ...[...groups.entries()].flatMap(([key, { access, children }]) => guarded(access, key, children)),
  ]
}

const routes = buildRoutes()

export function AppRoutes() {
  return <Routes>{routes}</Routes>
}
