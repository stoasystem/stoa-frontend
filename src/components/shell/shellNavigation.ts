import { navAreaForRole, type AppNavArea } from '@/app/router/routeManifest'
import { accountMenuFor } from '@/components/shell/accountMenuTargets'
import { getNavItemsForRole, type AppNavItem } from '@/lib/navigation'
import type { UserRole } from '@/types/user'

/*
 * What the shell puts beside the logo, read off the route manifest.
 *
 * #13 point 5: the bar holds the logo, the bell and the avatar, and nothing
 * else for a student. Point 6: a teacher and a parent switch between their two
 * pages with a segmented control; an administrator has a source list. A page
 * the account menu already reaches (the teacher's profile) is not offered a
 * second time here. The final item sets are #52's.
 */
export type ShellNavigation =
  | { kind: 'none' }
  | { kind: 'segmented'; items: readonly AppNavItem[] }
  | { kind: 'sourceList'; items: readonly AppNavItem[] }

export function shellNavigationFor(role: UserRole): ShellNavigation {
  const area: AppNavArea = navAreaForRole(role)
  const inAccountMenu = new Set(
    [accountMenuFor(area).profile, accountMenuFor(area).password].filter((path): path is string => Boolean(path)),
  )
  const items = getNavItemsForRole(area).filter((item) => !inAccountMenu.has(item.path))

  if (area === 'admin') return items.length ? { kind: 'sourceList', items } : { kind: 'none' }
  // One page is not a choice; a student has none at all (#13 point 5).
  if (items.length < 2) return { kind: 'none' }
  return { kind: 'segmented', items }
}

/**
 * Which item the open page belongs to: the longest item path the address is
 * on, so /admin/users lights Accounts and not Overview. -1 when none.
 */
export function activeNavIndex(items: readonly AppNavItem[], pathname: string): number {
  let best = -1
  items.forEach((item, index) => {
    const on = pathname === item.path || pathname.startsWith(item.path.endsWith('/') ? item.path : `${item.path}/`)
    if (on && (best === -1 || item.path.length > items[best].path.length)) best = index
  })
  return best
}
