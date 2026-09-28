/**
 * The router, generated from the route manifest.
 *
 * Nothing here names a path. Every entry in `pageRoutes` and
 * `legacyRedirects` is placed behind the guard its `access` asks for:
 * `public` at the top level, `signedIn` inside ProtectedRoute, and a role list
 * inside ProtectedRoute and a RoleRoute for exactly those roles.
 */
import type { ReactNode } from 'react'
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

function accessKey(access: RouteAccess): string {
  if (access.kind === 'roles') return `roles:${access.roles.join(',')}`
  return access.kind
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
 * screen it can use.
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
  const forcedChange =
    Boolean(user?.mustChangePassword) && location.pathname === CHANGE_PASSWORD_PATH

  if (applies && !forcedChange) return <Navigate replace to={to} state={state} />
  return children
}

/**
 * For a route with a `refusedPage`: a visitor the route admits goes on
 * through the real guards; anyone else is shown the refused page instead.
 */
function RefusedPageSwitch({ access, refused }: { access: RouteAccess; refused: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const admitted =
    isAuthenticated &&
    user !== null &&
    (access.kind !== 'roles' || access.roles.includes(user.role))

  return admitted ? <Outlet /> : refused
}

function pageElement(route: PageRoute): ReactNode {
  const Page = route.page
  const props = route.titleKey ? { ...route.props, titleKey: route.titleKey } : route.props
  const page = <Page {...props} />
  const shown = route.demoSurface ? <DemoSurfaceRoute>{page}</DemoSurfaceRoute> : page
  const redirect = legacyRedirects.find(
    (candidate) => candidate.from === route.path && candidate.onlyFor,
  )
  return redirect ? <RoleScopedRedirect redirect={redirect}>{shown}</RoleScopedRedirect> : shown
}

function guarded(access: RouteAccess, key: string, children: ReactNode[]): ReactNode {
  if (access.kind === 'public') return children
  const inner =
    access.kind === 'roles' ? (
      <Route element={<RoleRoute allowedRoles={[...access.roles]} />} key={`${key}:role`}>
        {children}
      </Route>
    ) : (
      children
    )
  return (
    <Route element={<ProtectedRoute />} key={key}>
      {inner}
    </Route>
  )
}

function buildRoutes(): ReactNode[] {
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

  for (const route of pageRoutes) {
    if (route.refusedPage) {
      const Refused = route.refusedPage
      topLevel.push(
        <Route
          element={<RefusedPageSwitch access={route.access} refused={<Refused />} />}
          key={`refused:${route.path}`}
          path={route.path}
        >
          {guarded(route.access, `refused:${route.path}:guard`, [
            <Route element={pageElement(route)} index key={route.path} />,
          ])}
        </Route>,
      )
      continue
    }
    group(route.access).push(
      <Route element={pageElement(route)} key={route.path} path={route.path} />,
    )
  }

  for (const redirect of legacyRedirects) {
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
