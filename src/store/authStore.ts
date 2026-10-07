import { create } from 'zustand'
import { forgetRefreshToken, rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { pinTabToSession, releaseTab, tabToken } from '@/lib/devSessions'
import type { User, UserRole } from '@/types/user'

export type CurrentUser = User
export type { UserRole }

export const TOKEN_KEY = 'stoa_access_token'

// This tab's logout can outlive the account menu. Keep only its completion,
// never a credential, so the next login waits for the existing 8 s request.
let pendingLogout: Promise<void> = Promise.resolve()

export function trackPendingLogout(request: Promise<unknown>): Promise<void> {
  pendingLogout = Promise.allSettled([pendingLogout, request]).then(() => undefined)
  return pendingLogout
}

export async function waitForPendingLogout(): Promise<void> {
  // A second menu can start another logout while the first one is settling.
  // Wait for every already-started request before issuing a new login.
  let pending: Promise<void>
  do {
    pending = pendingLogout
    await pending
  } while (pending !== pendingLogout)
}

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

/**
 * The token this tab's requests carry right now, with the same precedence
 * every request uses. Work started under one session compares it once it
 * resumes: if it changed, someone signed out (and maybe someone else in)
 * meanwhile, and what that work brings back is not theirs (#34).
 */
export function currentSessionToken(): string | null {
  return getStoredToken()
}

type AuthState = {
  user: CurrentUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: CurrentUser, accessToken: string, refreshToken?: string) => void
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
    setAuth: (user, accessToken, refreshToken) => {
      // Undefined means "unchanged", not "none": a refresh hands back a new
      // access token and keeps the refresh token it already had.
      rememberRefreshToken(refreshToken)
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
      forgetRefreshToken()
      // Only the session this tab is using ends. A pinned tab's sign-out
      // revokes its own token; the shared one belongs to whichever account the
      // rest of the browser is signed into and was never revoked, unless it is
      // the very same token (#34).
      const pinned = tabToken()
      if (pinned) {
        releaseTab()
        if (localStorage.getItem(TOKEN_KEY) === pinned) localStorage.removeItem(TOKEN_KEY)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
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
