/*
 * Which account this tab is, and how a tab that has none gets one (#216,
 * docs/adr/0002-each-tab-holds-its-own-account.md).
 *
 * Every tab holds its own credentials in sessionStorage. Nothing in
 * localStorage says who a tab is: what another tab does there - signing in,
 * adding an account, signing out - can never make this tab somebody else. A
 * tab changes account only by a sign-in, a switch or an added account in that
 * tab itself; refreshing it, restoring it or duplicating it keeps the account,
 * because the browser keeps or copies sessionStorage with it.
 *
 * A new tab, one with no account and not signed out, starts from the saved
 * accounts: with none it shows sign-in, with exactly one it takes that one,
 * with several it asks which. There is no default account.
 *
 * A tab whose sign-in has ended stays signed out, across a refresh too: it
 * never falls back on a saved account, not even the only one.
 */
import {
  completeHeldSession,
  pinTabToSession,
  readSessions,
  releaseTab,
  tabToken,
} from '@/lib/devSessions'
import { replaceRefreshToken } from '@/services/auth/sessionRefresh'

const TAB_STATE_KEY = 'stoa_tab_state'
const SIGNED_OUT = 'signed-out'

/** Where every tab used to read the browser's one shared session from. */
const LEGACY_ACCESS_KEY = 'stoa_access_token'
const LEGACY_REFRESH_KEY = 'stoa_refresh_token'

/** This tab had an account and its sign-in ended: it takes no other by itself. */
export function tabSignedOut(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(TAB_STATE_KEY) === SIGNED_OUT
  } catch {
    return false
  }
}

/**
 * Put this tab on a session: a sign-in, a switch to a saved account, or a new
 * tab taking the only saved one. The only way a tab gets an account. A session
 * without a refresh token empties this tab's, rather than keeping the previous
 * account's for the next renewal to spend (#205 audit).
 */
export function bindTab(accessToken: string, refreshToken: string | null | undefined): void {
  pinTabToSession(accessToken)
  replaceRefreshToken(refreshToken)
  try {
    sessionStorage.removeItem(TAB_STATE_KEY)
  } catch {
    // Blocked storage holds no signed-out mark to clear.
  }
}

/**
 * This tab's sign-in ended. Its credentials go, and the tab remembers that it
 * was signed out, so a refresh does not start it again as a new tab.
 */
export function signOutTab(): void {
  releaseTab()
  try {
    sessionStorage.setItem(TAB_STATE_KEY, SIGNED_OUT)
  } catch {
    // Blocked storage: the tab still has no credentials to send.
  }
}

/**
 * A new tab with several saved accounts: nobody has said which one it is, so
 * it asks before it loads anything.
 */
export function tabNeedsAccountChoice(): boolean {
  return !tabToken() && !tabSignedOut() && readSessions().length > 1
}

/**
 * Once per browser: the session every tab used to share stops being anyone's.
 *
 * Its refresh token is handed to the saved account already holding its access
 * token, if that one has none; nothing a saved account holds is overwritten.
 * A shared session no saved account holds cannot become one - the token does
 * not say whose it is - and is dropped here, not revoked. A tab that was
 * pinned keeps its account; a tab that was not starts again as a new tab: who
 * it was cannot be told reliably (#216 decision).
 */
export function migrateSharedSession(): void {
  if (typeof window === 'undefined') return
  try {
    const access = localStorage.getItem(LEGACY_ACCESS_KEY)
    const refresh = localStorage.getItem(LEGACY_REFRESH_KEY)
    if (access && refresh) completeHeldSession(access, refresh)
    localStorage.removeItem(LEGACY_ACCESS_KEY)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
  } catch {
    // Blocked storage: there is nothing it could still hand to anyone.
  }
}

/**
 * Settle this tab before anything reads its account: migrate, then give a new
 * tab the only saved account if there is exactly one.
 */
export function initializeTab(): void {
  if (typeof window === 'undefined') return
  migrateSharedSession()
  if (tabToken() || tabSignedOut()) return
  const saved = readSessions()
  if (saved.length === 1) bindTab(saved[0].accessToken, saved[0].refreshToken)
}
