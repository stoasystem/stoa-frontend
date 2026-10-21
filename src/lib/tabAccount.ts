/*
 * One account per browser, and which account this tab is (#320,
 * docs/adr/0003-one-account-per-browser.md, superseding the multi-account
 * parts of 0002).
 *
 * The browser has at most one sign-in at a time, recorded in localStorage
 * with an id of its own. Every tab of the browser joins that sign-in: a new
 * tab takes it, so it opens signed in. Each tab still sends only the copy of
 * the credentials it holds itself, in sessionStorage, together with the id of
 * the sign-in it joined.
 *
 * What another tab does can only ever sign this tab out, never make it
 * somebody else while it shows the first account: when the browser's sign-in
 * is ended or replaced, every tab still on the old one signs itself out (the
 * storage event, and a check before each request), and its sign-in page then
 * says who is signed in now and offers to continue as them. The only ways a
 * tab gets an account are a sign-in in the tab itself, and joining the
 * browser's sign-in while it shows nobody's: as a new tab, or on the sign-in
 * page.
 *
 * A tab whose sign-in has ended stays signed out across a refresh, and
 * remembers who it was and the page it was on, so the sign-in page can say
 * whose session ended and take them back there.
 */
import { pathFromState } from '@/lib/fromState'
import { LOGIN_SUBMITTED_AT_KEY } from '@/lib/loginTimingKey'
import { newRandomId } from '@/lib/randomId'
import { signInOf } from '@/lib/signIn'
import { isHeldTestRole } from '@/lib/testRoles'
import { revokeSignIn, type DroppedSignIn } from '@/services/auth/revokeSignIn'
import { replaceRefreshToken, storedRefreshToken } from '@/services/auth/sessionRefresh'

/** Where each tab keeps its own copy of the access token. */
export const TAB_TOKEN_KEY = 'stoa_tab_access_token'
/** Which of the browser's sign-ins this tab's copy belongs to. */
const TAB_SIGN_IN_KEY = 'stoa_tab_sign_in'
const TAB_STATE_KEY = 'stoa_tab_state'
const TAB_ACCOUNT_KEY = 'stoa_tab_account'
/** The browser's one sign-in, shared by every tab. */
export const BROWSER_SIGN_IN_KEY = 'stoa_sign_in'
/**
 * What a tab keeps when it changes account: the sign-in timing, which runs
 * from pressing Sign in to the new account's first page and names nobody.
 */
const KEPT_ACROSS_ACCOUNTS = [LOGIN_SUBMITTED_AT_KEY]

/** The saved accounts of ADR 0002, and the session every tab shared before it. */
const LEGACY_SAVED_KEY = 'stoa_dev_sessions'
const LEGACY_ACCESS_KEY = 'stoa_access_token'
const LEGACY_REFRESH_KEY = 'stoa_refresh_token'
const LEGACY_SIGN_IN_ENDED_KEY = 'stoa_sign_in_ended'

/**
 * Who a tab is, as far as it needs to say so once its sign-in has ended. The
 * role only picks how the sign-in page addresses them (#241).
 */
export type TabAccount = { id?: string; email: string; name?: string; role?: string }

/**
 * Why this tab is signed out. Signing out shows the plain sign-in; the others
 * say whose session it was.
 */
export type SignOutReason = 'signed-out' | 'expired' | 'signed-out-elsewhere'

export type TabSignOut = {
  reason: SignOutReason
  /** Whose session ended; kept only when the reason is not a plain sign-out. */
  account?: TabAccount
  /** The page the tab was on, checked again before anyone is sent there. */
  returnTo?: string
}

/** The browser's sign-in: the credentials every tab joins, and whose they are once known. */
export type BrowserSignIn = {
  id: string
  accessToken: string
  refreshToken?: string
  account?: TabAccount
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
    ...(typeof entry.role === 'string' && entry.role ? { role: entry.role } : {}),
  }
}

// --- This tab's copy -------------------------------------------------------

export function tabToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(TAB_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * This tab's access token, renewed. Storage the browser refuses holds no
 * session: the tab is signed out rather than the app failing to start.
 */
export function pinTabToSession(accessToken: string): void {
  try {
    sessionStorage.setItem(TAB_TOKEN_KEY, accessToken)
  } catch {
    // Nothing stored, nothing sent.
  }
}

function tabSignInId(): string | null {
  try {
    return sessionStorage.getItem(TAB_SIGN_IN_KEY)
  } catch {
    return null
  }
}

function setTabSignInId(id: string): void {
  try {
    sessionStorage.setItem(TAB_SIGN_IN_KEY, id)
  } catch {
    // Blocked storage: the tab holds no session either.
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
  // a new one and join the browser's sign-in without the sign-in page.
  const account = reason === 'signed-out' ? undefined : asAccount(parsed?.account)
  const returnTo = typeof parsed?.returnTo === 'string' ? parsed.returnTo : undefined
  return { reason, ...(account ? { account } : {}), ...(returnTo ? { returnTo } : {}) }
}

// routeManifest's CHANGE_PASSWORD_PATH; this module stays clear of the router
// (a test holds the two equal).
export const FORCED_CHANGE_PAGE = '/settings/password'

/**
 * Where this tab is, for the same account to come back to once its session
 * has ended (#217, #343): the page with its query and hash, nothing on the
 * sign-in itself. On the forced password change it is the page the change
 * carries (#412): the change is never gone back to, so the page it was going
 * to would be lost, and a reset that still stands sends the account by the
 * change again on the way there.
 */
export function returnToHere(): { returnTo?: string } {
  const { pathname, search, hash } = window.location
  if (pathname === '/login') return {}
  if (pathname === FORCED_CHANGE_PAGE) {
    const carried = pathFromState((window.history.state as { usr?: unknown } | null)?.usr)
    return carried ? { returnTo: carried } : {}
  }
  return { returnTo: `${pathname}${search ?? ''}${hash ?? ''}` }
}

/** This tab had an account and its sign-in ended: it joins no other by itself. */
export function tabSignedOut(): boolean {
  return readTabSignOut() !== null
}

/** Who this tab is, as recorded when it got its session or the account was read. */
export function readTabAccount(): TabAccount | undefined {
  return asAccount(readJson(TAB_ACCOUNT_KEY))
}

/**
 * Whether `user` is the account `account` names: by id when both are known,
 * by address when one side never learnt the id.
 */
export function isSameAccount(user: { id?: string; email?: string }, account: TabAccount | undefined): boolean {
  if (!account) return false
  if (account.id && user.id) return account.id === user.id
  return Boolean(user.email) && String(user.email).toLowerCase() === account.email.toLowerCase()
}

// --- The browser's sign-in ---------------------------------------------------

export function parseBrowserSignIn(raw: string | null): BrowserSignIn | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<BrowserSignIn> | null
    if (!value || typeof value.id !== 'string' || !value.id) return null
    if (typeof value.accessToken !== 'string' || !value.accessToken) return null
    const account = asAccount(value.account)
    return {
      id: value.id,
      accessToken: value.accessToken,
      ...(typeof value.refreshToken === 'string' && value.refreshToken ? { refreshToken: value.refreshToken } : {}),
      ...(account ? { account } : {}),
    }
  } catch {
    return null
  }
}

/** The browser's sign-in as stored, unparsed: a stable snapshot for subscribers. */
export function browserSignInSnapshot(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(BROWSER_SIGN_IN_KEY)
  } catch {
    return null
  }
}

export function readBrowserSignIn(): BrowserSignIn | null {
  return parseBrowserSignIn(browserSignInSnapshot())
}

/** False when the browser refused the write (blocked storage, quota). */
function writeBrowserSignIn(signIn: BrowserSignIn): boolean {
  try {
    localStorage.setItem(BROWSER_SIGN_IN_KEY, JSON.stringify(signIn))
    return true
  } catch {
    return false
  }
}

function removeBrowserSignIn(): boolean {
  try {
    localStorage.removeItem(BROWSER_SIGN_IN_KEY)
    return true
  } catch {
    return false
  }
}

function forgetTabSignInId(): void {
  try {
    sessionStorage.removeItem(TAB_SIGN_IN_KEY)
  } catch {
    // Nothing was stored.
  }
}

/** Calls `onChange` when another tab changes the browser's sign-in. */
export function subscribeBrowserSignIn(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    if (isBrowserSignInEvent(event)) onChange()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

/** Whether a storage event may have changed the browser's sign-in (`clear()` reports no key). */
export function isBrowserSignInEvent(event: Pick<StorageEvent, 'key' | 'storageArea'>): boolean {
  if (event.key !== BROWSER_SIGN_IN_KEY && event.key !== null) return false
  return !(typeof window !== 'undefined' && event.storageArea && event.storageArea !== window.localStorage)
}

/** Whether this tab's copy is of `signIn`. A tab from before #320 has no id: its tokens say. */
function tabHolds(signIn: BrowserSignIn): boolean {
  const id = tabSignInId()
  if (id) return id === signIn.id
  const token = tabToken()
  if (!token) return false
  return isSameSignIn({ accessToken: token, refreshToken: storedRefreshToken() }, signIn)
}

/**
 * Whether this tab may go on as the account it holds: it holds nothing, or it
 * holds the browser's sign-in. False when the browser's sign-in was ended or
 * replaced since the tab joined it: the tab must sign out, not send its old
 * account's token on behalf of a screen the other tabs no longer show.
 */
export function tabOnBrowserSignIn(): boolean {
  if (!tabToken()) return true
  const signIn = readBrowserSignIn()
  if (signIn) return tabHolds(signIn)
  // A tab from before #320 in a browser with no sign-in recorded yet: nothing
  // else is signed in for it to disagree with. Start-up records it.
  return tabSignInId() === null
}

/**
 * Give this tab a session. A tab moving from one account to another takes
 * nothing of the first along: its pending messages, checkout, upload hand-off
 * and analytics session all live in this storage, and a page load keeps it
 * (tab-account audit F1). A session without a refresh token empties the tab's
 * place for one rather than keeping the previous account's (#205 audit).
 */
function bindTab(signIn: BrowserSignIn): void {
  try {
    const sameAccount = signIn.account !== undefined && isSameAccount(signIn.account, readTabAccount())
    if (tabToken() && !sameAccount) {
      const kept = KEPT_ACROSS_ACCOUNTS.map((key) => [key, sessionStorage.getItem(key)] as const)
      sessionStorage.clear()
      for (const [key, value] of kept) if (value !== null) sessionStorage.setItem(key, value)
    }
    sessionStorage.removeItem(TAB_STATE_KEY)
    sessionStorage.removeItem(TAB_ACCOUNT_KEY)
  } catch {
    // Blocked storage holds nothing to carry over.
  }
  pinTabToSession(signIn.accessToken)
  replaceRefreshToken(signIn.refreshToken)
  setTabSignInId(signIn.id)
  if (signIn.account) rememberTabAccount(signIn.account)
}

/**
 * Credentials the browser let go of without a sign-out ending them on the
 * server; ended there in the background, unless the role switcher holds them.
 */
function dropOnServer(signIns: DroppedSignIn[]): void {
  const seen = new Set<string>()
  for (const signIn of signIns) {
    const key = signIn.refreshToken || signInOf(signIn.accessToken) || signIn.accessToken
    if (seen.has(key)) continue
    seen.add(key)
    if (isHeldTestRole(signIn)) continue
    void revokeSignIn(signIn)
  }
}

/**
 * A sign-in in this tab: it becomes the browser's sign-in. Every other tab on
 * the previous one signs out when it sees the change; the previous sign-in is
 * ended on the server, since nothing in this browser can use it any more.
 */
export function signInTab(
  accessToken: string,
  refreshToken: string | null | undefined,
  account?: TabAccount,
): void {
  const previous = readBrowserSignIn()
  const signIn: BrowserSignIn = {
    id: newRandomId(),
    accessToken,
    ...(refreshToken ? { refreshToken } : {}),
    ...(account && asAccount(account) ? { account: asAccount(account) } : {}),
  }
  bindTab(signIn)
  if (!writeBrowserSignIn(signIn)) {
    // Storage refused the record (blocked, or full). This tab keeps working
    // on its own copy, as a tab with no id does; the previous sign-in is
    // taken away from the other tabs if storage lets even that happen, and
    // only then ended on the server (#320 audit F2).
    forgetTabSignInId()
    if (!previous || !removeBrowserSignIn()) return
  }
  if (previous && !isSameSignIn(previous, { accessToken, refreshToken })) {
    dropOnServer([previous])
  }
}

/**
 * Join the browser's sign-in, if there is one. Only for a tab that shows
 * nobody's account. With `expectedId`, only that sign-in: the one the page
 * decided on, not one another tab put there since (#320 audit F3).
 */
export function joinBrowserSignIn(expectedId?: string): boolean {
  const signIn = readBrowserSignIn()
  if (!signIn) return false
  if (expectedId !== undefined && signIn.id !== expectedId) return false
  bindTab(signIn)
  return true
}

/** A renewal in this tab: the browser's sign-in carries the new tokens if it is this tab's. */
export function renewBrowserSignIn(accessToken: string): void {
  const signIn = readBrowserSignIn()
  if (!signIn || !tabHolds(signIn)) return
  const refreshToken = storedRefreshToken() ?? signIn.refreshToken
  writeBrowserSignIn({ ...signIn, accessToken, ...(refreshToken ? { refreshToken } : {}) })
}

/**
 * Record who this tab is, and who the browser's sign-in is when it is this
 * tab's. Called when a session starts and whenever the account is read.
 */
export function rememberTabAccount(account: TabAccount): void {
  const known = asAccount(account)
  if (!known) return
  try {
    sessionStorage.setItem(TAB_ACCOUNT_KEY, JSON.stringify(known))
  } catch {
    // Blocked storage: the sign-in page will not be able to name the account.
  }
  const signIn = readBrowserSignIn()
  if (signIn && tabHolds(signIn) && JSON.stringify(signIn.account) !== JSON.stringify(known)) {
    writeBrowserSignIn({ ...signIn, account: known })
  }
}

/**
 * This tab's sign-in ended. Everything the tab kept goes - its credentials
 * and everything of that account's it stored (Ask, uploads waiting to be
 * sent, a checkout, the analytics session). What stays is the record that the
 * tab was signed out, so a refresh does not start it again as a new tab, and
 * for an ending the reader did not ask for, whose session it was and the page
 * it was on.
 *
 * If the browser's sign-in is the one this tab held, it ends for the whole
 * browser: signing out, or the server refusing the sign-in, is not this tab's
 * alone. A tab that only noticed another tab's change leaves the browser's
 * sign-in as it is.
 */
export function signOutTab(ending: TabSignOut = { reason: 'signed-out' }): void {
  const account = ending.reason === 'signed-out' ? undefined : (ending.account ?? readTabAccount())
  const signIn = readBrowserSignIn()
  if (signIn && tabToken() && tabHolds(signIn)) removeBrowserSignIn()
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

// --- Start-up -----------------------------------------------------------------

type LegacyEntry = { accessToken: string; refreshToken?: string; account?: TabAccount; savedAt?: string }

function legacyEntries(): LegacyEntry[] {
  const entries: LegacyEntry[] = []
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(LEGACY_SAVED_KEY) ?? '[]')
    if (Array.isArray(raw)) {
      for (const value of raw) {
        const entry = value as { accessToken?: unknown; refreshToken?: unknown; savedAt?: unknown } | null
        if (!entry || typeof entry.accessToken !== 'string' || !entry.accessToken) continue
        const account = asAccount(entry)
        entries.push({
          accessToken: entry.accessToken,
          ...(typeof entry.refreshToken === 'string' && entry.refreshToken ? { refreshToken: entry.refreshToken } : {}),
          ...(account ? { account } : {}),
          ...(typeof entry.savedAt === 'string' ? { savedAt: entry.savedAt } : {}),
        })
      }
    }
  } catch {
    // An unreadable list offers nothing to keep; it is removed below.
  }
  try {
    const access = localStorage.getItem(LEGACY_ACCESS_KEY)
    const refresh = localStorage.getItem(LEGACY_REFRESH_KEY)
    if (access) entries.push({ accessToken: access, ...(refresh ? { refreshToken: refresh } : {}) })
  } catch {
    // As above.
  }
  return entries
}

function isSameSignIn(a: DroppedSignIn, b: Partial<DroppedSignIn>): boolean {
  if (a.accessToken === b.accessToken) return true
  if (a.refreshToken && a.refreshToken === b.refreshToken) return true
  const signIn = signInOf(a.accessToken)
  return signIn !== null && signIn === signInOf(b.accessToken)
}

/**
 * Once per browser: the saved accounts of ADR 0002 go (#320).
 *
 * One sign-in stays - the browser's if one is recorded already, else this
 * tab's, else the saved account if the list holds only one person - and
 * becomes the browser's sign-in.
 * Every other saved one is dropped from storage and ended on the server, so
 * nothing in the old list can be clicked into again. The other tabs that were
 * open on other accounts sign out when they next start or send a request.
 */
export function migrateSavedAccounts(): void {
  if (typeof window === 'undefined') return
  let present = false
  try {
    present =
      localStorage.getItem(LEGACY_SAVED_KEY) !== null ||
      localStorage.getItem(LEGACY_ACCESS_KEY) !== null ||
      localStorage.getItem(LEGACY_REFRESH_KEY) !== null
  } catch {
    return
  }
  if (!present) return

  const saved = legacyEntries()
  const token = tabToken()
  // Only a tab from before #320 can be kept: one with an id joined a sign-in
  // that has since ended, and must not bring it back.
  const tab: LegacyEntry | null = token && tabSignInId() === null
    ? { accessToken: token, refreshToken: storedRefreshToken() ?? undefined, account: readTabAccount() }
    : null
  let kept: DroppedSignIn | null = readBrowserSignIn()
  if (!kept) {
    // With no tab signed in, a saved account is kept only when it is the
    // only one: on a shared computer the one saved last may be the parent's,
    // and a child's next tab would open in it without anyone choosing it
    // (#320 audit F6). With several, everyone signs in again.
    const people = new Set(saved.filter((entry) => entry.account).map((entry) => entry.account!.email.toLowerCase()))
    const byUse = saved
      .filter((entry) => entry.account)
      .sort((a, b) => String(a.savedAt ?? '').localeCompare(String(b.savedAt ?? '')))
    const lastUsed = people.size === 1 ? byUse[byUse.length - 1] : undefined
    const chosen = tab ?? lastUsed ?? null
    if (chosen) {
      const signIn: BrowserSignIn = {
        id: newRandomId(),
        accessToken: chosen.accessToken,
        ...(chosen.refreshToken ? { refreshToken: chosen.refreshToken } : {}),
        ...(chosen.account ? { account: chosen.account } : {}),
      }
      writeBrowserSignIn(signIn)
      if (chosen === tab) setTabSignInId(signIn.id)
      kept = signIn
    }
  }

  try {
    localStorage.removeItem(LEGACY_SAVED_KEY)
    localStorage.removeItem(LEGACY_ACCESS_KEY)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
    localStorage.removeItem(LEGACY_SIGN_IN_ENDED_KEY)
  } catch {
    // Blocked storage: nothing could read them either.
  }

  // This tab's own sign-in, when it is not the one kept, is start-up's to drop.
  const keep = [kept, tab].filter((entry): entry is DroppedSignIn => entry !== null)
  dropOnServer(saved.filter((entry) => !keep.some((other) => isSameSignIn(entry, other))))
}

/**
 * Settle this tab before anything reads its account: migrate, then make sure
 * the tab is on the browser's sign-in or on none.
 *
 * A tab holding a session that is not the browser's - it was signed out or
 * replaced elsewhere while the tab was closed or asleep - signs out, and its
 * sign-in page says who is signed in now. A new tab joins the browser's
 * sign-in. A signed-out tab is left to its sign-in page.
 */
export function initializeTab(): void {
  if (typeof window === 'undefined') return
  migrateSavedAccounts()
  const token = tabToken()
  if (token) {
    const signIn = readBrowserSignIn()
    const legacy = tabSignInId() === null
    if (signIn && tabHolds(signIn)) {
      if (legacy) setTabSignInId(signIn.id)
      return
    }
    if (!signIn && legacy) {
      // A tab from before #320 in a browser that recorded no sign-in: it is
      // the one this browser keeps.
      const claimed: BrowserSignIn = {
        id: newRandomId(),
        accessToken: token,
        ...(storedRefreshToken() ? { refreshToken: storedRefreshToken() as string } : {}),
      }
      const account = readTabAccount()
      if (account) claimed.account = account
      writeBrowserSignIn(claimed)
      setTabSignInId(claimed.id)
      return
    }
    // A sign-in from before #320 that the browser did not keep is ended on the
    // server too; a newer one was ended by whoever replaced or signed it out.
    const dropped = legacy ? { accessToken: token, refreshToken: storedRefreshToken() } : null
    replaceRefreshToken(null)
    // The page the tab opened on is where it was, for the same account to
    // come back to (#343), as when it notices the change while open.
    signOutTab({ reason: 'signed-out-elsewhere', ...returnToHere() })
    if (dropped) dropOnServer([dropped])
    return
  }
  if (tabSignedOut()) return
  joinBrowserSignIn()
}
