import { create } from 'zustand'
import { endRefreshToken } from '@/services/auth/sessionRefresh'
import {
  initializeTab,
  pinTabToSession,
  rememberTabAccount,
  renewBrowserSignIn,
  signInTab,
  signOutTab,
  TAB_TOKEN_KEY,
  tabToken,
  type TabSignOut,
} from '@/lib/tabAccount'
import type { User, UserRole } from '@/types/user'

export type CurrentUser = User
export type { UserRole }

/** Where this tab keeps its copy of the access token (#216, #320). */
export const TOKEN_KEY = TAB_TOKEN_KEY

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

// Maps Cognito group names onto the canonical role the backend emits. The
// groups are the four the backend recognises; no legacy spelling is accepted
// here, because the backend refuses one (T-472-03) and never emits one.
const roleAliases: Record<string, UserRole> = {
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

// Each tab sends its own copy of the browser's sign-in, so what another tab
// does can sign it out but never change who it sends requests as (#320).
const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  return tabToken()
}

/**
 * The token this tab's requests carry right now. Work started under one
 * session compares it once it
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
  /**
   * Start a session: sign-in and registration. An omitted refresh token means
   * this session has none, and the tab's previous one is cleared (#208). A
   * renewal is not a new session; it goes through `updateAccessToken`.
   */
  setAuth: (user: CurrentUser, accessToken: string, refreshToken?: string) => void
  /** A renewed access token for the session already held, read account or not. */
  updateAccessToken: (accessToken: string) => void
  setUser: (user: CurrentUser) => void
  /**
   * End this tab's session. A plain sign-out by default; an ending the reader
   * did not ask for says so, and is remembered with whose it was (#217).
   */
  clearAuth: (ending?: TabSignOut) => void
  hydrateFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Before anything reads this tab's account: a new tab joins the browser's
  // sign-in here, a tab left on an ended one signs out, and the saved
  // accounts of ADR 0002 are retired (#320).
  initializeTab()
  const storedToken = getStoredToken()

  return {
    user: null,
    accessToken: storedToken,
    isAuthenticated: Boolean(storedToken),
    setAuth: (user, accessToken, refreshToken) => {
      // Only sign-in and registration call this, and both start a session: a
      // response without a refresh token means this session has none, not
      // "keep the one there". Kept, the previous account's would be spent at
      // the next 401 and turn the tab back into that account (#208). A renewal
      // goes through updateAccessToken and keeps its refresh token there.
      // The browser's sign-in from now on: the other tabs on the previous
      // one sign out when they see it (#320).
      signInTab(accessToken, refreshToken, user)
      set({ user: normalizeCurrentUser(user), accessToken, isAuthenticated: true })
    },
    updateAccessToken: (accessToken) => {
      // Where setAuth would have put it, and nothing else: a renewal at start-up
      // comes before the account is read, so there may be no user to keep yet
      // (passing a null user to setAuth threw, and the app never got past
      // "Konto wird geladen…").
      pinTabToSession(accessToken)
      // New tabs join with the renewed token rather than the expired one.
      renewBrowserSignIn(accessToken)
      set({ accessToken, isAuthenticated: true })
    },
    setUser: (user) => {
      // The account this tab's session belongs to, for the sign-in page to
      // name if the session ends (#217).
      if (tabToken()) rememberTabAccount(user)
      set({ user: normalizeCurrentUser(user), isAuthenticated: true })
    },
    clearAuth: (ending) => {
      // The tab stays signed out, after a refresh too (#217). If it held the
      // browser's sign-in, that ends with it and the other tabs follow (#320).
      endRefreshToken()
      signOutTab(ending)
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
