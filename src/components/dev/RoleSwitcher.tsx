/**
 * Move between the test roles without signing out.
 *
 * Sign into each role once and it keeps the session; after that a click puts
 * this tab into that role. Opening a second tab and choosing a different role
 * leaves the first alone, so a parent's view and their child's can be read
 * side by side.
 *
 * Offered to the test accounts, and on a production-facing build only to a
 * browser that asked for it with `?roleswitcher=on`. The accounts under test
 * live on the deployed site, so hiding it there would hide it everywhere that
 * matters; asking for it per browser keeps it away from everyone else.
 * No password is stored: what is kept is the session the server already issued.
 */
import { useState } from 'react'
import { LogIn, Plus, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/services/auth/authApi'
import {
  accountMayBeHeld,
  adoptSwitcherOptInFromUrl,
  isTestAccount,
  switcherEnabledHere,
  rememberSession,
} from '@/lib/devSessions'
import { useHeldAccounts } from '@/hooks/auth/useHeldAccounts'
import { useAuthStore } from '@/store/authStore'

const PROBLEM_TEXT = {
  expired: 'That session has expired. Add the role again.',
  unreachable: 'Could not reach the server. The role is still held; try again.',
}

export function RoleSwitcher() {
  const user = useAuthStore((state) => state.user)

  // Runs once per mount, before the guard below reads the answer.
  const [enabledHere] = useState(() => {
    adoptSwitcherOptInFromUrl()
    return switcherEnabledHere()
  })
  const [open, setOpen] = useState(false)
  // One implementation of holding and switching, shared with the account menu:
  // this file had its own copy, and the copy kept the bug the other one lost
  // (an expired access token ended the account instead of being renewed).
  const held = useHeldAccounts()
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [addProblem, setAddProblem] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const sessions = held.sessions
  const busy = held.busy || addBusy
  const problem = addProblem || (held.problem ? PROBLEM_TEXT[held.problem] : '')

  // An address outside the test domain needs the opt-in, because for those the
  // stored sessions are somebody's real ones. Inside it, no gate: the domain
  // already says what the account is for.
  if (!user) return null
  if (!enabledHere && !isTestAccount(user.email)) {
    return null
  }

  async function addRole(event: React.FormEvent) {
    event.preventDefault()
    setAddProblem('')
    if (!accountMayBeHeld(email)) {
      setAddProblem(
        'Only @test.stoaedu.ch accounts can be held here. Open ?roleswitcher=on to hold others.',
      )
      return
    }
    setAddBusy(true)
    try {
      const result = await login({ email, password })
      // The refresh token too: without it the held account is over an hour
      // after it was added, whatever anyone does with it.
      rememberSession({
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
            {user?.email} · this tab only
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
