import { useEffect } from 'react'
import { matchRoutes, useLocation } from 'react-router-dom'
import type { LazyPage } from '@/app/router/lazyPage'
import { isAdmitted } from '@/app/router/routeAccess'
import { legacyRedirects, pageRoutes, type PageRoute } from '@/app/router/routeManifest'
import { readTabAccount } from '@/lib/tabAccount'
import { normalizeUserRole, useAuthStore } from '@/store/authStore'

/*
 * A page that waits for the tab's account starts loading while it waits (#415).
 *
 * A role route shows AccountLoadStatus until /auth/me answers (#250, #274), so
 * after a reload or in a new tab its page's code was not even asked for until
 * then: the star map's, about 77 kB gzip, only once a reply that takes 1-3 s
 * on a cold start had come. Now, while the account is read, the page this
 * address shows a student starts loading, when the tab was a student's or does
 * not remember whose it was (`readTabAccount`).
 *
 * Nothing here decides what is shown. The guards still wait for the account,
 * and a tab that turns out to be someone else's has fetched code it never runs.
 */

const STUDENT = { role: 'student' } as const

// Every path the router has, so an address matches here what it matches there.
const routes: { path: string; page?: PageRoute }[] = [
  ...pageRoutes.map((page) => ({ path: page.path, page })),
  ...legacyRedirects.filter((redirect) => !redirect.onlyFor).map((redirect) => ({ path: redirect.from })),
]

/** The page to load while the account is read, given the role the tab remembers, if any. */
export function pageToPreload(pathname: string, rememberedRole: string | undefined): LazyPage | null {
  if (rememberedRole && normalizeUserRole(rememberedRole) !== 'student') return null
  const matches = matchRoutes(routes, pathname) ?? []
  const matched = matches[matches.length - 1]?.route.page
  // Only a role route waits for the account; every other page loads at once.
  if (!matched || matched.access.kind !== 'roles' || !isAdmitted(matched.access, STUDENT, true)) return null
  return matched.page
}

export function usePreloadWhileAccountLoads() {
  const { pathname } = useLocation()
  const accountLoading = useAuthStore((state) => Boolean(state.accessToken) && state.user === null)

  useEffect(() => {
    if (accountLoading) pageToPreload(pathname, readTabAccount()?.role)?.preload()
  }, [accountLoading, pathname])
}
