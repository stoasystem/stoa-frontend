import type { RouteAccess } from '@/app/router/routeManifest'
import type { UserRole } from '@/types/user'

/*
 * Who a route's `access` admits, shared by the router (AppRoutes) and by the
 * sign-in return check (lib/authRoutes), so the two cannot disagree.
 *
 * Each of these fails closed: an `access` whose kind is not one of the three
 * (a typo that got past the types, a cast) throws, rather than quietly falling
 * through to "any signed-in account".
 */
export function unknownAccess(access: never): never {
  throw new Error(`route manifest: unknown access ${JSON.stringify(access)}`)
}

/** Whether the signed-in account (if any) may open a route with `access`. */
export function isAdmitted(
  access: RouteAccess,
  user: { role: UserRole } | null,
  isAuthenticated: boolean,
): boolean {
  switch (access.kind) {
    case 'public':
      return true
    case 'signedIn':
      return isAuthenticated && user !== null
    case 'roles':
      return isAuthenticated && user !== null && access.roles.includes(user.role)
    default:
      return unknownAccess(access)
  }
}
