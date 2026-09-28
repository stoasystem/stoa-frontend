import { matchPath } from 'react-router-dom'
import {
  navAreaForRole,
  pageRoutes,
  roleHomePaths,
  type AppNavArea,
  type AppNavIcon,
  type RouteStatus,
} from '@/app/router/routeManifest'
import { canShowDemoNavigation } from '@/lib/demoVisibility'
import type { User, UserRole } from '@/types/user'

export type AppNavItem = {
  label: string
  labelKey?: string
  path: string
  role: AppNavArea
  priority: 'primary' | 'secondary'
  status: RouteStatus
  icon: AppNavIcon
  mobile?: boolean
  description?: string
}

/*
 * Every role's navigation, read off the route manifest: an entry exists only
 * where a registered route declares it, so it cannot lead nowhere. Primary
 * entries come before secondary ones; otherwise the manifest's order holds.
 */
export const navItems: readonly AppNavItem[] = pageRoutes
  .flatMap((route) =>
    (route.nav ?? []).map((nav) => ({
      label: nav.label,
      labelKey: nav.labelKey,
      path: route.path,
      role: nav.area,
      priority: nav.priority,
      status: route.meta.status,
      icon: nav.icon,
      mobile: nav.mobile,
      description: nav.description,
    })),
  )
  .sort((a, b) => Number(a.priority === 'secondary') - Number(b.priority === 'secondary'))

type NavOptions = {
  showDemo?: boolean
  mobileOnly?: boolean
  includeSecondary?: boolean
}

export function getNavItemsForRole(role: AppNavArea, options: NavOptions = {}) {
  const showDemo = canShowDemoNavigation(options.showDemo)

  return navItems.filter((item) => {
    if (item.role !== role) return false
    if (item.status === 'demo' && !showDemo) return false
    if (!options.includeSecondary && item.priority === 'secondary') return false
    if (options.mobileOnly && !item.mobile) return false

    return true
  })
}

export function getNavItemsForUserRole(role: UserRole, options: NavOptions = {}) {
  return getNavItemsForRole(navAreaForRole(role), options)
}

export function getHomePathForUserRole(role: UserRole) {
  return roleHomePaths[navAreaForRole(role)]
}

export function getStartPracticePath(user: Pick<User, 'role'> | null | undefined) {
  if (!user) return '/login'

  return getHomePathForUserRole(user.role)
}

export function startPracticeNavigation(
  user: Pick<User, 'role'> | null | undefined,
  navigate: (path: string) => void,
) {
  navigate(getStartPracticePath(user))
}

export function isNavItemActive(item: AppNavItem, pathname: string) {
  return Boolean(
    matchPath({ path: item.path, end: item.path === '/' }, pathname) ||
      pathname.startsWith(`${item.path}/`),
  )
}
