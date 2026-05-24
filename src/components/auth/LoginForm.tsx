import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'

export function LoginForm() {
  const [email, setEmail] = useState('student@test.com')
  const [password, setPassword] = useState('password123')
  const loginMutation = useLoginMutation()

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        loginMutation.mutate({ email, password })
      }}
    >
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
