import type { UserRole } from '@/types/user'

// The one screen an account under a forced password change can still use.
export const CHANGE_PASSWORD_PATH = '/settings/password'

export function getDefaultRouteForRole(role: UserRole) {
  switch (role) {
    case 'student':
      return '/chat'
    case 'parent':
      return '/parent'
    case 'teacher':
      return '/tutor'
    case 'admin':
      return '/admin'
    case 'organization_admin':
    case 'school_teacher':
    case 'school_viewer':
      return '/organization'
    default:
      return '/chat'
  }
}

export function canAccessRoute(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role)
}

// Where a deep link may send each role once it has signed in. Anything else,
// and anything that is not a same-origin path, falls back to the role's home.
const roleNextPathPrefixes: Record<UserRole, string[]> = {
  student: ['/chat', '/learn', '/profile'],
  parent: ['/parent', '/billing', '/support'],
  teacher: ['/tutor', '/support', '/teacher-activate'],
  admin: ['/admin'],
  organization_admin: ['/organization'],
  school_teacher: ['/organization'],
  school_viewer: ['/organization'],
}

function isSafePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function canUseNextPathForRole(path: string, role: UserRole) {
  return roleNextPathPrefixes[role].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * The one place that decides where a signed-in visitor on the login screen goes:
 * the password change for a reset account, else a `?next=` link or the page
 * ProtectedRoute sent them away from (`state.from`), if the role may use it,
 * else the role's home.
 */
export function getPostLoginPath(
  user: { role: UserRole; mustChangePassword?: boolean },
  location: { search: string; state?: unknown },
) {
  if (user.mustChangePassword) return CHANGE_PASSWORD_PATH

  const queryNext = new URLSearchParams(location.search).get('next')
  if (isSafePath(queryNext) && canUseNextPathForRole(queryNext, user.role)) {
    return queryNext
  }

  const from = (location.state as { from?: { pathname?: unknown; search?: unknown } } | null | undefined)?.from
  if (isSafePath(from?.pathname) && canUseNextPathForRole(from.pathname, user.role)) {
    return `${from.pathname}${typeof from.search === 'string' ? from.search : ''}`
  }

  return getDefaultRouteForRole(user.role)
}
