/**
 * Move between the test roles without typing a password each time.
 *
 * Sign into each role once with "Add a role" and the switcher holds it; after
 * that a click signs this browser in as that role. It is an ordinary sign-in:
 * one account per browser (#320, docs/adr/0003), so every other tab signs out
 * of the previous role. The role being left is held too, so it can be switched
 * back to.
 *
 * A testing tool, not a product feature. It needs `?roleswitcher=on` in this
 * browser and a signed-in test account, and its list (src/lib/testRoles.ts)
 * takes and gives back test-domain addresses only, so a real account never
 * enters it. No password is stored: what is held is the session the server
 * already issued.
 */
import { useCallback, useState } from 'react'
import { LogIn, Plus, Users, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { ASK_PATH } from '@/app/router/routeManifest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { apiBaseUrl } from '@/lib/env'
import { readBrowserSignIn, signInTab, tabOnBrowserSignIn, tabToken } from '@/lib/tabAccount'
import {
  adoptSwitcherOptInFromUrl,
  forgetTestRole,
  forgetTestRolesHolding,
  holdTestRole,
  isTestAccount,
  readTestRoles,
  sessionLiveness,
  switcherEnabledHere,
  type TestRole,
} from '@/lib/testRoles'
import { login } from '@/services/auth/authApi'
import { signOutIfReplacedElsewhere } from '@/services/auth/browserSignInChanges'
import { exchangeRefreshToken, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { askFor, useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'

const PROBLEM_TEXT = {
  expired: 'That session has expired. Add the role again.',
  unreachable: 'Could not reach the server. The role is still held; try again.',
}

type SwitchProblem = keyof typeof PROBLEM_TEXT | null

/** The held test roles, and signing this browser in as one of them. */
function useTestRoles() {
  const [roles, setRoles] = useState<TestRole[]>(() => readTestRoles())
  const [problem, setProblem] = useState<SwitchProblem>(null)
  const [busy, setBusy] = useState(false)

  const switchTo = useCallback(async (role: TestRole) => {
    // A tab left on a sign-in another tab has ended or replaced signs out
    // here instead: what it holds is no longer the browser's to switch from
    // (#320 audit F1).
    if (signOutIfReplacedElsewhere()) return
    setProblem(null)
    setBusy(true)
    try {
      // A held access token lasts an hour, so it is usually refused by the
      // time anyone switches back to it; the role's refresh token is for that.
      let accessToken = role.accessToken
      let refreshToken = role.refreshToken
      const liveness = await sessionLiveness(accessToken, apiBaseUrl)
      // Only a refusal means the session is gone: one that could not be
      // checked is kept, since it cannot be recovered once dropped.
      if (liveness === 'unknown') {
        setProblem('unreachable')
        return
      }
      if (liveness === 'refused') {
        const renewed = refreshToken ? await exchangeRefreshToken(refreshToken) : ({ status: 'refused' } as const)
        if (renewed.status === 'unreachable') {
          setProblem('unreachable')
          return
        }
        if (renewed.status !== 'renewed') {
          forgetTestRolesHolding({ accessToken, refreshToken })
          setRoles(readTestRoles())
          setProblem('expired')
          return
        }
        accessToken = renewed.accessToken
        refreshToken = renewed.refreshToken ?? refreshToken
        holdTestRole({ ...role, accessToken, refreshToken })
      }

      // Hold the role being left, so switching to another does not end it:
      // this tab's own copy, and only while it is still the browser's sign-in
      // and of the test account the tab shows. Anything else could file a
      // real account's tokens under a test address (#320 audit F1).
      const current = readBrowserSignIn()
      const user = useAuthStore.getState().user
      const own = tabToken()
      if (
        current &&
        own &&
        user &&
        isTestAccount(user.email) &&
        tabOnBrowserSignIn() &&
        current.account?.email.toLowerCase() === user.email.toLowerCase()
      ) {
        holdTestRole({
          email: user.email,
          role: user.role,
          name: user.name,
          accessToken: own,
          refreshToken: storedRefreshToken() ?? undefined,
        })
      }
      signInTab(accessToken, refreshToken, { email: role.email, name: role.name, role: role.role })
      // A full load, not a store update: telling the store about the new role
      // while the old role's page is mounted lets that page's guard reject it.
      // The load drops the previous role's answers with the rest of the cache.
      window.location.assign(getDefaultRouteForRole(role.role as never))
    } finally {
      setBusy(false)
    }
  }, [])

  const forget = useCallback((email: string) => setRoles(forgetTestRole(email)), [])

  return { roles, problem, busy, switchTo, forget, refresh: () => setRoles(readTestRoles()) }
}

export function RoleSwitcher() {
  const user = useAuthStore((state) => state.user)

  // Runs once per mount, before the guard below reads the answer.
  const [enabledHere] = useState(() => {
    adoptSwitcherOptInFromUrl()
    return switcherEnabledHere()
  })
  const [open, setOpen] = useState(false)
  const held = useTestRoles()
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [addProblem, setAddProblem] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const sessions = held.roles
  const busy = held.busy || addBusy
  const problem = addProblem || (held.problem ? PROBLEM_TEXT[held.problem] : '')
  // Ask is a sheet over the whole page on a phone and a narrow window, and this
  // sat on top of it, over the first lines of every answer. While Ask is open
  // the closed switcher steps aside; one already open stays until it is closed.
  const pathname = useLocation().pathname
  const askOpenFromPlanet = useAskStore((state) => (user ? askFor(state, user.id).open : false))
  const askOpen = askOpenFromPlanet || pathname === ASK_PATH || pathname.startsWith(`${ASK_PATH}/`)

  // Test accounts only: nobody else's session is ever offered or held here.
  if (!user || !isTestAccount(user.email)) return null
  // Asked for, every time. The test accounts live on the deployed site, so
  // "no gate inside the test domain" meant a grey oval with an unlabelled
  // glyph sat in the student's chrome for anyone reviewing the product, with
  // nothing on screen saying what it was (card 125). A testing tool earns its
  // place by being asked for: `?roleswitcher=on` turns it on for this browser
  // and it stays on until `?roleswitcher=off`.
  if (!enabledHere) return null
  if (askOpen && !open) return null

  async function addRole(event: React.FormEvent) {
    event.preventDefault()
    setAddProblem('')
    if (!isTestAccount(email)) {
      setAddProblem('Only @test.stoaedu.ch accounts can be held here.')
      return
    }
    setAddBusy(true)
    try {
      const result = await login({ email, password })
      // The refresh token too: without it the held role is over an hour
      // after it was added, whatever anyone does with it.
      holdTestRole({
        email: result.user.email,
        role: result.user.role,
        name: result.user.name,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      })
      held.refresh()
      setAdding(false)
      setEmail('')
      setPassword('')
    } catch {
      setAddProblem('That sign-in did not work.')
    } finally {
      setAddBusy(false)
    }
  }

  return (
    // Docked to the left edge, vertically centred: the bottom right corner is
    // the star map's zoom pair and the bottom left its "?", and this sat on
    // top of the zoom "-" on a phone. The middle of the left edge is free on
    // every page.
    <div className="fixed left-2 top-1/2 z-50 -translate-y-1/2">
      {open ? (
        <div className="w-72 rounded-lg border border-border bg-card p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Testing as</p>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {user?.email} · switching signs out the other tabs
          </p>

          <div className="mt-3 grid gap-1">
            {sessions.map((session) => (
              <div key={session.email} className="flex items-center gap-1">
                <Button
                  variant={session.email === user?.email ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 flex-1 justify-start text-xs"
                  disabled={busy}
                  onClick={() => void held.switchTo(session)}
                >
                  {session.role} · {session.email.split('@')[0]}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={`Forget ${session.email}`}
                  onClick={() => held.forget(session.email)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            ))}
            {sessions.length === 0 && !adding ? (
              <p className="text-xs text-muted-foreground">
                No roles held yet. Add one to switch without signing out.
              </p>
            ) : null}
          </div>

          {problem && !adding ? <p className="mt-2 text-xs text-destructive">{problem}</p> : null}

          {adding ? (
            <form className="mt-3 grid gap-2" onSubmit={addRole}>
              <Input
                type="email"
                placeholder="role@test.stoaedu.ch"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-8 text-xs"
                autoFocus
              />
              <Input
                type="password"
                placeholder="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-8 text-xs"
              />
              {problem ? <p className="text-xs text-destructive">{problem}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="h-8 flex-1 text-xs" disabled={busy}>
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  {busy ? 'Signing in...' : 'Hold this role'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-8 w-full text-xs"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add a role
            </Button>
          )}
        </div>
      ) : (
        // Closed it is a dot half tucked off the edge rather than a labelled
        // badge: anchored over the page, the badge sat on top of buttons and
        // captions. Pointing at it brings it back out.
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-9 translate-x-[45%] rounded-full p-0 opacity-50 shadow-lg transition-all hover:translate-x-0 hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100"
          aria-label={`Testing as ${user?.role}`}
          title={`Testing as ${user?.role}`}
          onClick={() => setOpen(true)}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
