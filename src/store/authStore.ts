import { create } from 'zustand'
import { pinTabToSession, tabToken } from '@/lib/devSessions'
import type { User, UserRole } from '@/types/user'

export type CurrentUser = User
export type { UserRole }

export const TOKEN_KEY = 'stoa_access_token'

const validRoles: UserRole[] = [
  'student',
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]

// Maps Cognito group names and the legacy `tutor` value onto the canonical role the
// backend emits. `tutor` must stay accepted so sessions stored before the rename
// keep resolving instead of silently falling back to `student`.
const roleAliases: Record<string, UserRole> = {
  tutor: 'teacher',
  tutors: 'teacher',
  teachers: 'teacher',
  students: 'student',
  parents: 'parent',
  admins: 'admin',
}

export function normalizeUserRole(role: unknown): UserRole {
  const value = String(role || '').trim().toLowerCase()
  const alias = roleAliases[value]
  if (alias) return alias
  if (validRoles.includes(value as UserRole)) return value as UserRole
  return 'student'
}

function normalizeCurrentUser(user: CurrentUser): CurrentUser {
  return { ...user, role: normalizeUserRole(user.role) }
}

// A tab that has picked a role holds its own token, so several roles can be
// open at once. Everyone else reads the shared one and behaves as before.
const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  return tabToken() ?? localStorage.getItem(TOKEN_KEY)
}

type AuthState = {
  user: CurrentUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: CurrentUser, accessToken: string) => void
  setUser: (user: CurrentUser) => void
  clearAuth: () => void
  hydrateFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = getStoredToken()

  return {
    user: null,
    accessToken: storedToken,
    isAuthenticated: Boolean(storedToken),
    setAuth: (user, accessToken) => {
      if (tabToken()) {
        pinTabToSession(accessToken)
      } else {
        localStorage.setItem(TOKEN_KEY, accessToken)
      }
      set({ user: normalizeCurrentUser(user), accessToken, isAuthenticated: true })
    },
    setUser: (user) => {
      set({ user: normalizeCurrentUser(user), isAuthenticated: true })
    },
    clearAuth: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('stoa_tab_access_token')
      }
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, accessToken: null, isAuthenticated: false })
    },
    hydrateFromStorage: () => {
      const accessToken = getStoredToken()
      if (accessToken) {
        set({ accessToken, isAuthenticated: true })
      }
    },
  }
})
