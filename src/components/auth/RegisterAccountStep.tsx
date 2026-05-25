import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterAccountStep({
  name,
  email,
  password,
  acceptedTerms,
  onChange,
}: {
  name: string
  email: string
  password: string
  acceptedTerms: boolean
  onChange: (values: Partial<{
    name: string
    email: string
    password: string
    acceptedTerms: boolean
  }>) => void
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(event) => onChange({ name: event.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => onChange({ email: event.target.value })}
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
          onChange={(event) => onChange({ password: event.target.value })}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
        <label className="flex gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border"
            checked={acceptedTerms}
            onChange={(event) => onChange({ acceptedTerms: event.target.checked })}
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
      </div>
    </div>
  )
}
