import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['auth', 'common'])

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('auth:register.name')}</Label>
        <Input id="name" value={name} onChange={(event) => onChange({ name: event.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth:register.email')}</Label>
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
        <Label htmlFor="password">{t('auth:register.password')}</Label>
        <Input
          id="password"
          type="password"
          aria-describedby="password-requirements"
          value={password}
          onChange={(event) => onChange({ password: event.target.value })}
          autoComplete="new-password"
          required
        />
        <p id="password-requirements" className="text-sm text-muted-foreground">
          {t('errors:passwordRequirements')}
        </p>
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
            {t('auth:register.acceptTerms')}{' '}
            <Link className="font-medium underline" to="/privacy">
              {t('common:navigation.privacy')}
            </Link>{' '}
            /{' '}
            <Link className="font-medium underline" to="/terms">
              {t('common:navigation.terms')}
            </Link>
          </span>
        </label>
      </div>
    </div>
  )
}
