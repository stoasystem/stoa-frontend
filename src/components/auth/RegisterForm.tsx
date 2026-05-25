import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegisterMutation } from '@/hooks/auth/useRegisterMutation'
import { getStoredReferralCode, getStoredUTM } from '@/lib/utm'
import { registerSchema } from '@/lib/validation'
import type { UserRole } from '@/types/user'

const roles: UserRole[] = ['student', 'parent', 'tutor', 'admin']

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    role?: string
    acceptedTerms?: string
  }>({})
  const registerMutation = useRegisterMutation()

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        const result = registerSchema.safeParse({ name, email, password, role, acceptedTerms })
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors
          setErrors({
            name: fieldErrors.name?.[0],
            email: fieldErrors.email?.[0],
            password: fieldErrors.password?.[0],
            role: fieldErrors.role?.[0],
            acceptedTerms: fieldErrors.acceptedTerms?.[0],
          })
          return
        }
        setErrors({})
        registerMutation.mutate({
          name: result.data.name,
          email: result.data.email,
          password: result.data.password,
          role: result.data.role,
          acceptedTerms: true,
          termsVersion: 'launch-draft-2026-05-25',
          acceptedAt: new Date().toISOString(),
          referralCode: getStoredReferralCode() ?? undefined,
          utm: getStoredUTM(),
        })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="rounded-md border p-3">
        <label className="flex gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          <span>
            I agree to STOA's{' '}
            <Link className="font-medium underline" to="/privacy">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link className="font-medium underline" to="/terms">
              Terms
            </Link>
            .
          </span>
        </label>
        {errors.acceptedTerms && <p className="mt-2 text-xs text-destructive">{errors.acceptedTerms}</p>}
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
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
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
        {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
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
