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

/** The anchor on /me that holds the password change. */
export const PASSWORD_SECTION_ID = 'password'
const ME_PASSWORD = `/me#${PASSWORD_SECTION_ID}`

/*
 * Profile per role. The student's is /me. A teacher has /teacher/profile; a
 * parent's account page is the account-operations page. Administrators and
 * the organisation roles have no profile page of their own, so theirs is /me
 * too (#46), which the manifest opens to them.
 */
const PROFILE_PATHS: Record<AppNavArea, string | null> = {
  student: '/me',
  teacher: '/teacher/profile',
  parent: '/parent/account-operations',
  admin: '/me',
  organization: '/me',
}

/*
 * Whoever has /me changes the password there (#13 point 2, #46); the menu
 * opens the page at its password section. Teachers and parents keep
 * /settings/password. /settings/password still sends a student to /me, except
 * under a forced change, which only ever happens there.
 */
const PASSWORD_PATHS: Record<AppNavArea, string> = {
  student: ME_PASSWORD,
  teacher: CHANGE_PASSWORD_PATH,
  parent: CHANGE_PASSWORD_PATH,
  admin: ME_PASSWORD,
  organization: ME_PASSWORD,
}

export type AccountMenuExtra = { key: string; labelKey: string; to: string }

/*
 * Billing and payments: one item, opening /billing. /billing/payment-settings
 * is not a second item and not a submenu: the billing page links to it (its
 * "Manage billing" button), so the menu keeps its one extra row (decided in
 * #46). Neither route may carry a `nav` entry in the manifest.
 */
const EXTRAS: Record<AppNavArea, readonly AccountMenuExtra[]> = {
  student: [],
  teacher: [],
  parent: [{ key: 'billing', labelKey: 'accountMenu.billing', to: '/billing' }],
  admin: [],
  organization: [],
}

/** A link's path without its `#section`, which the router never sees. */
export function pathOf(to: string): string {
  const hash = to.indexOf('#')
  return hash === -1 ? to : to.slice(0, hash)
}

/** Whether the router answers `path` with a page of its own (not the catch-all). */
export function isRegisteredPage(path: string): boolean {
  const pathname = pathOf(path)
  return pageRoutes.some((route) => route.path !== '*' && matchPath({ path: route.path, end: true }, pathname) !== null)
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
