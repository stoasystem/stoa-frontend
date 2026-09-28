/**
 * What the avatar menu offers each role (#13 point 4, #46).
 *
 * Five fixed items for everybody: Profile, Language, Change password, Help,
 * Sign out. A role's extra items sit between Help and Sign out; today only the
 * parent has one, "Billing and payments". Every link must be a route the
 * manifest registers, and an entry whose route is not registered is left out:
 * billing is withdrawn (card 007), so the parent's extra stays hidden until
 * its routes come back.
 */
import { matchPath } from 'react-router-dom'
import { CHANGE_PASSWORD_PATH, pageRoutes, type AppNavArea } from '@/app/router/routeManifest'

export const HELP_PATH = '/support'

/*
 * Profile per role. The student's is /me (#46 builds it). A teacher has
 * /tutor/profile; a parent's account page is the account-operations page.
 * Administrators and the organisation roles have no profile page yet, so the
 * item is shown but cannot be chosen.
 */
const PROFILE_PATHS: Record<AppNavArea, string | null> = {
  student: '/me',
  teacher: '/tutor/profile',
  parent: '/parent/account-operations',
  admin: null,
  organization: null,
}

// Students change their password on /me (#13 point 2); /settings/password
// sends them there too, except under a forced change.
const PASSWORD_PATHS: Record<AppNavArea, string> = {
  student: '/me',
  teacher: CHANGE_PASSWORD_PATH,
  parent: CHANGE_PASSWORD_PATH,
  admin: CHANGE_PASSWORD_PATH,
  organization: CHANGE_PASSWORD_PATH,
}

export type AccountMenuExtra = { key: string; labelKey: string; to: string }

const EXTRAS: Record<AppNavArea, readonly AccountMenuExtra[]> = {
  student: [],
  teacher: [],
  parent: [{ key: 'billing', labelKey: 'accountMenu.billing', to: '/billing' }],
  admin: [],
  organization: [],
}

/** Whether the router answers `path` with a page of its own (not the catch-all). */
export function isRegisteredPage(path: string): boolean {
  return pageRoutes.some((route) => route.path !== '*' && matchPath({ path: route.path, end: true }, path) !== null)
}

export type AccountMenuTargets = {
  profile: string | null
  password: string
  help: string
  extras: readonly AccountMenuExtra[]
}

export function accountMenuFor(
  area: AppNavArea,
  isRegistered: (path: string) => boolean = isRegisteredPage,
): AccountMenuTargets {
  const profile = PROFILE_PATHS[area]
  return {
    profile: profile && isRegistered(profile) ? profile : null,
    password: PASSWORD_PATHS[area],
    help: HELP_PATH,
    extras: EXTRAS[area].filter((extra) => isRegistered(extra.to)),
  }
}
