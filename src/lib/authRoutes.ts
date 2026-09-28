import { CHANGE_PASSWORD_PATH, navAreaForRole, roleHomePaths } from '@/app/router/routeManifest'
import type { UserRole } from '@/types/user'

// The one screen an account under a forced password change can still use.
export { CHANGE_PASSWORD_PATH }

/** Where a signed-in account starts: its role's home in the route manifest. */
export function getDefaultRouteForRole(role: UserRole) {
  return roleHomePaths[navAreaForRole(role)]
}

export function canAccessRoute(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role)
}
