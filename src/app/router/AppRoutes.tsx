/**
 * The router, generated from the route manifest.
 *
 * Nothing here names a path. Every entry in `pageRoutes` and
 * `legacyRedirects` is placed behind the guard its `access` asks for:
 * `public` at the top level, `signedIn` inside ProtectedRoute, and a role list
 * inside ProtectedRoute and a RoleRoute for exactly those roles.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { DemoSurfaceRoute } from '@/app/router/DemoSurfaceRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleRoute } from '@/app/router/RoleRoute'
import { isAdmitted, unknownAccess } from '@/app/router/routeAccess'
import {
  CHANGE_PASSWORD_PATH,
  legacyRedirects,
  pageRoutes,
  type LegacyRedirect,
  type PageRoute,
  type RouteAccess,
} from '@/app/router/routeManifest'
import { useAuthStore } from '@/store/authStore'

// Tests and the account menu read who a route admits from here too.
export { isAdmitted }

/*
 * Fails closed like isAdmitted: an `access` whose kind is not one of the three
 * throws while the router is built.
 */
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

/** Where a legacy link lands, with its context carried when the entry asks. */
function useRedirectTarget(redirect: LegacyRedirect) {
  const params = useParams()
  const location = useLocation()
  const role = useAuthStore((state) => state.user?.role)
  const search = new URLSearchParams(location.search)
  const pathname =
    typeof redirect.to === 'string' ? redirect.to : redirect.to({ params, search, pathname: location.pathname, role })

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
  // rendering"), so the render that clears the flag still finds it. It is
  // kept for the account that was forced: a different account in the store,
  // swapped in without leaving the page, gets no benefit of it.
  const [forcedFor, setForcedFor] = useState<string | null>(null)
  const userId = user?.id ?? null
  if (forcedNow && userId !== null && forcedFor !== userId) setForcedFor(userId)
  const wasForced = forcedFor !== null && forcedFor === userId

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

/**
 * Puts the page's name in the browser's title bar.
 *
 * Every route carries a `titleKey` (#103), and until this existed only two
 * pages ever reached `document.title`: a reader arriving anywhere else was
 * told the name of the site and nothing about where they were. A screen
 * reader announces this on arrival, so it is the first thing said.
 */
function PageTitle({ titleKey }: { titleKey: string }) {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const name = t(titleKey)
    document.title = name && name !== titleKey ? `${name} · STOA` : 'STOA'
  }, [t, titleKey, i18n.resolvedLanguage])

  return null
}

/** A page's own title key, or the name its navigation entry gives it. */
export function nameKeyOf(route: PageRoute): string | undefined {
  return route.titleKey ?? route.nav?.find((entry) => entry.labelKey)?.labelKey
}

function pageElement(route: PageRoute, redirects: readonly LegacyRedirect[]): ReactNode {
  const Page = route.page
  const props = route.titleKey ? { ...route.props, titleKey: route.titleKey } : route.props
  const nameKey = nameKeyOf(route)
  const page = (
    <>
      {nameKey && <PageTitle titleKey={nameKey} />}
      <Page {...props} />
    </>
  )
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
