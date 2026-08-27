/**
 * Move between the test roles without signing out.
 *
 * Sign into each role once and it keeps the session; after that a click puts
 * this tab into that role. Opening a second tab and choosing a different role
 * leaves the first alone, so a parent's view and their child's can be read
 * side by side.
 *
 * Only offered to the test accounts. Nobody who registers sees it, and no
 * password is stored: what is kept is the session the server already issued.
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogIn, Plus, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/services/auth/authApi'
import {
  forgetSession,
  isTestAccount,
  pinTabToSession,
  readSessions,
  rememberSession,
  type DevSession,
} from '@/lib/devSessions'
import { useAuthStore } from '@/store/authStore'

export function RoleSwitcher() {
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState<DevSession[]>(() => readSessions())
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')

  if (!isTestAccount(user?.email)) {
    return null
  }

  function adopt(session: DevSession) {
    pinTabToSession(session.accessToken)
    setAuth(
      { id: session.email, email: session.email, name: session.name, role: session.role } as never,
      session.accessToken,
    )
    // The previous role's answers are not this role's answers.
    void queryClient.clear()
    window.location.assign('/')
  }

  async function addRole(event: React.FormEvent) {
    event.preventDefault()
    setProblem('')
    if (!isTestAccount(email)) {
      setProblem('Only @test.stoaedu.ch accounts can be held here.')
      return
    }
    setBusy(true)
    try {
      const result = await login({ email, password })
      const next = rememberSession({
        email: result.user.email,
        role: result.user.role,
        name: result.user.name,
        accessToken: result.accessToken,
      })
      setSessions(next)
      setAdding(false)
      setEmail('')
      setPassword('')
    } catch {
      setProblem('That sign-in did not work.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-4">
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
                  onClick={() => adopt(session)}
                >
                  {session.role} · {session.email.split('@')[0]}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={`Forget ${session.email}`}
                  onClick={() => setSessions(forgetSession(session.email))}
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
        <Button size="sm" variant="outline" className="h-9 shadow-lg" onClick={() => setOpen(true)}>
          <Users className="h-4 w-4" aria-hidden="true" />
          {user?.role}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
