import { matchPath } from 'react-router-dom'
import {
  getRouteRoleForUserRole,
  navItems,
  roleHomePaths,
  type AppNavItem,
  type AppRouteRole,
} from '@/app/router/routeConfig'
import type { UserRole } from '@/types/user'

type NavOptions = {
  showDemo?: boolean
  mobileOnly?: boolean
  includeSecondary?: boolean
}

export function getNavItemsForRole(role: AppRouteRole, options: NavOptions = {}) {
  return navItems.filter((item) => {
    if (item.role !== role) return false
    if (item.status === 'deprecated') return false
    if (item.priority === 'hidden' && !options.showDemo) return false
    if (item.status === 'demo' && !options.showDemo && item.role !== 'organization') return false
    if (!options.includeSecondary && item.priority === 'secondary') return false
    if (options.mobileOnly && !item.mobile) return false

    return true
  })
}

export function getNavItemsForUserRole(role: UserRole, options: NavOptions = {}) {
  return getNavItemsForRole(getRouteRoleForUserRole(role), options)
}

export function getHomePathForUserRole(role: UserRole) {
  return roleHomePaths[getRouteRoleForUserRole(role)]
}

export function isNavItemActive(item: AppNavItem, pathname: string) {
  return Boolean(
    matchPath({ path: item.path, end: item.path === '/' }, pathname) ||
      pathname.startsWith(`${item.path}/`),
  )
}
