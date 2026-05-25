import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import { enableDemoShortcuts } from '@/lib/env'
import { loginSchema } from '@/lib/validation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const loginMutation = useLoginMutation()

  function fillDemo(emailAddress: string) {
    setEmail(emailAddress)
    setPassword('password123')
    setErrors({})
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        const result = loginSchema.safeParse({ email, password })
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors
          setErrors({
            email: fieldErrors.email?.[0],
            password: fieldErrors.password?.[0],
          })
          return
        }
        setErrors({})
        loginMutation.mutate(result.data)
      }}
    >
      {enableDemoShortcuts && (
        <div className="rounded-md border bg-secondary/40 p-3 text-sm">
          <p className="font-medium">Use demo account</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              ['Student', 'student@test.com'],
              ['Parent', 'parent@test.com'],
              ['Tutor', 'tutor@test.com'],
              ['Admin', 'admin@test.com'],
              ['Org admin', 'organization@test.com'],
            ].map(([label, demoEmail]) => (
              <Button
                key={demoEmail}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo(demoEmail)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      {loginMutation.isError && (
        <p className="text-sm text-destructive">
          {loginMutation.error instanceof Error ? loginMutation.error.message : 'Login failed.'}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Need an account?{' '}
        <Link className="font-medium text-foreground underline" to="/register">
          Register
        </Link>
      </p>
    </form>
  )
}
