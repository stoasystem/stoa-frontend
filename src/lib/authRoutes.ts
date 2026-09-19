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
