import { navAreaForRole, type AppNavArea } from '@/app/router/routeManifest'
import { accountMenuFor, pathOf } from '@/components/shell/accountMenuTargets'
import { getNavItemsForRole, type AppNavItem } from '@/lib/navigation'
import type { UserRole } from '@/types/user'

/*
 * What the shell puts beside the logo, read off the route manifest.
 *
 * #13 point 5: the bar holds the logo, the bell and the avatar, and nothing
 * else for a student. Point 6: a teacher and a parent switch between their two
 * pages with a segmented control; an administrator has a source list. A page
 * the account menu reaches (the teacher's profile, a parent's billing) is not
 * offered a second time here. The item sets (#52): a teacher's Requests |
 * Availability, a parent's Overview | Reports, and the administrator's
 * Users, Teacher applications, Curriculum, Moderation, (Subscriptions and
 * billing, while frozen: nothing,) System.
 */
export type ShellNavigation =
  | { kind: 'none' }
  | { kind: 'segmented'; items: readonly AppNavItem[] }
  | { kind: 'sourceList'; items: readonly AppNavItem[] }

/** Every page the avatar menu leads to, extras included whether or not their routes are registered today. */
function accountMenuPaths(area: AppNavArea): Set<string> {
  const menu = accountMenuFor(area, () => true)
  return new Set(
    [menu.profile, menu.password, menu.help, ...menu.extras.map((extra) => extra.to)]
      .filter((path): path is string => Boolean(path))
      .map(pathOf),
  )
}

export function shellNavigationFor(role: UserRole): ShellNavigation {
  const area: AppNavArea = navAreaForRole(role)
  // So unfreezing billing cannot put it in two places.
  const inAccountMenu = accountMenuPaths(area)
  const items = getNavItemsForRole(area).filter((item) => !inAccountMenu.has(item.path))

  if (area === 'admin') return items.length ? { kind: 'sourceList', items } : { kind: 'none' }
  // One page is not a choice; a student has none at all (#13 point 5).
  if (items.length < 2) return { kind: 'none' }
  return { kind: 'segmented', items }
}

const isOn = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(path.endsWith('/') ? path : `${path}/`)

/**
 * Which item the open page belongs to: the longest item path, or path an item
 * covers, that the address is on, so /admin/users lights Users and not System,
 * and /admin/account-operations lights Users too. -1 when none, and on a page
 * the avatar menu leads to (a teacher's /tutor/profile lights no segment).
 */
export function activeNavIndex(
  items: readonly AppNavItem[],
  pathname: string,
  role?: UserRole,
): number {
  if (role && accountMenuPaths(navAreaForRole(role)).has(pathname)) return -1
  let best = -1
  let bestLength = -1
  items.forEach((item, index) => {
    for (const path of [item.path, ...(item.covers ?? [])]) {
      if (isOn(pathname, path) && path.length > bestLength) {
        best = index
        bestLength = path.length
      }
    }
  })
  return best
}
