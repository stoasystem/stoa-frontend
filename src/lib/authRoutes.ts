import type { UserRole } from '@/types/user'

export function getDefaultRouteForRole(role: UserRole) {
  switch (role) {
    case 'student':
      return '/dashboard'
    case 'parent':
      return '/parent'
    case 'tutor':
      return '/tutor'
    case 'admin':
      return '/admin'
    case 'organization_admin':
    case 'school_teacher':
    case 'school_viewer':
      return '/organization'
    default:
      return '/dashboard'
  }
}

export function canAccessRoute(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role)
}
