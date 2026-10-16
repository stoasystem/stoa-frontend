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
 * never falls back on a saved account, not even the only one (#217). It
 * remembers who it was, so the sign-in page can say whose session ended and
 * offer that account again, and the page it was on; nothing else of that
 * account's is kept.
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
const TAB_ACCOUNT_KEY = 'stoa_tab_account'

/** Where every tab used to read the browser's one shared session from. */
const LEGACY_ACCESS_KEY = 'stoa_access_token'
const LEGACY_REFRESH_KEY = 'stoa_refresh_token'

/** Who a tab is, as far as it needs to say so once its sign-in has ended. */
export type TabAccount = { id?: string; email: string; name?: string }

/**
 * Why this tab is signed out. Signing out shows the plain sign-in; the others
 * say whose session it was and offer it again.
 */
export type SignOutReason = 'signed-out' | 'expired' | 'signed-out-elsewhere'

export type TabSignOut = {
  reason: SignOutReason
  /** Whose session ended; kept only when the reason is not a plain sign-out. */
  account?: TabAccount
  /** The page the tab was on, checked again before anyone is sent there. */
  returnTo?: string
}

function readJson(key: string): unknown {
  try {
    const raw = sessionStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function asAccount(value: unknown): TabAccount | undefined {
  const entry = value as Partial<TabAccount> | null
  if (!entry || typeof entry.email !== 'string' || !entry.email) return undefined
  return {
    email: entry.email,
    ...(typeof entry.id === 'string' && entry.id ? { id: entry.id } : {}),
    ...(typeof entry.name === 'string' && entry.name ? { name: entry.name } : {}),
  }
}

/** This tab had an account and its sign-in ended, and how: null while it has not. */
export function readTabSignOut(): TabSignOut | null {
  if (typeof window === 'undefined') return null
  let raw: string | null
  try {
    raw = sessionStorage.getItem(TAB_STATE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null
  const parsed = readJson(TAB_STATE_KEY) as Partial<TabSignOut> | null
  const reason: SignOutReason =
    parsed?.reason === 'expired' || parsed?.reason === 'signed-out-elsewhere' ? parsed.reason : 'signed-out'
  // Anything unreadable is still a signed-out tab: it must not start again as
  // a new one and take a saved account.
  const account = reason === 'signed-out' ? undefined : asAccount(parsed?.account)
  const returnTo = typeof parsed?.returnTo === 'string' ? parsed.returnTo : undefined
  return { reason, ...(account ? { account } : {}), ...(returnTo ? { returnTo } : {}) }
}

/** This tab had an account and its sign-in ended: it takes no other by itself. */
export function tabSignedOut(): boolean {
  return readTabSignOut() !== null
}

/** Who this tab is, as recorded when it was put on its session or the account was read. */
export function readTabAccount(): TabAccount | undefined {
  return asAccount(readJson(TAB_ACCOUNT_KEY))
}

/**
 * Record who this tab is. Called when the tab is put on a session and when
 * the account is read; only for the session the tab is on.
 */
export function rememberTabAccount(account: TabAccount): void {
  const known = asAccount(account)
  if (!known) return
  try {
    sessionStorage.setItem(TAB_ACCOUNT_KEY, JSON.stringify(known))
  } catch {
    // Blocked storage: the sign-in page will not be able to name the account.
  }
}

/**
 * Put this tab on a session: a sign-in, a switch to a saved account, or a new
 * tab taking the only saved one. The only way a tab gets an account. A session
 * without a refresh token empties this tab's, rather than keeping the previous
 * account's for the next renewal to spend (#205 audit).
 */
export function bindTab(
  accessToken: string,
  refreshToken: string | null | undefined,
  account?: TabAccount,
): void {
  try {
    sessionStorage.removeItem(TAB_STATE_KEY)
    sessionStorage.removeItem(TAB_ACCOUNT_KEY)
  } catch {
    // Blocked storage holds no signed-out mark to clear.
  }
  pinTabToSession(accessToken)
  replaceRefreshToken(refreshToken)
  if (account) rememberTabAccount(account)
}

/**
 * This tab's sign-in ended. Everything the tab kept goes - its credentials
 * and everything of that account's it stored (Ask, uploads waiting to be
 * sent, a checkout, the analytics session): all of it lives in this tab's
 * sessionStorage, and none of it is the next account's. What stays is the
 * record that the tab was signed out, so a refresh does not start it again as
 * a new tab, and for an ending the reader did not ask for, whose session it
 * was and the page it was on.
 */
export function signOutTab(ending: TabSignOut = { reason: 'signed-out' }): void {
  const account = ending.reason === 'signed-out' ? undefined : (ending.account ?? readTabAccount())
  releaseTab()
  try {
    sessionStorage.clear()
  } catch {
    // Blocked storage: the tab still has no credentials to send.
  }
  const record: TabSignOut = {
    reason: ending.reason,
    ...(account ? { account } : {}),
    ...(ending.reason !== 'signed-out' && ending.returnTo ? { returnTo: ending.returnTo } : {}),
  }
  try {
    sessionStorage.setItem(TAB_STATE_KEY, JSON.stringify(record))
  } catch {
    // As above.
  }
}

/**
 * Whether `user` is the account a signed-out tab was on: by id when both are
 * known, by address when the tab never learnt the id (a switch whose account
 * was not read before the session ended).
 */
export function isSameAccount(user: { id?: string; email?: string }, account: TabAccount | undefined): boolean {
  if (!account) return false
  if (account.id && user.id) return account.id === user.id
  return Boolean(user.email) && String(user.email).toLowerCase() === account.email.toLowerCase()
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
  if (saved.length === 1) bindTab(saved[0].accessToken, saved[0].refreshToken, saved[0])
}
