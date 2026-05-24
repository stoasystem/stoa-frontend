import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegisterMutation } from '@/hooks/auth/useRegisterMutation'
import type { UserRole } from '@/types/user'

const roles: UserRole[] = ['student', 'parent', 'tutor', 'admin']

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const registerMutation = useRegisterMutation()

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        registerMutation.mutate({ name, email, password, role })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
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
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
        >
          {roles.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
      </div>
      {registerMutation.isError && (
        <p className="text-sm text-destructive">
          {registerMutation.error instanceof Error
            ? registerMutation.error.message
            : 'Registration failed.'}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link className="font-medium text-foreground underline" to="/login">
          Sign in
        </Link>
      </p>
    </form>
  )
}
