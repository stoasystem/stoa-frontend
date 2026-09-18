import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError, invalidFieldClass } from '@/components/auth/FieldError'

export type RegisterAccountErrors = Partial<
  Record<'name' | 'email' | 'password' | 'acceptedTerms' | 'emailOwnershipConfirmed', string>
>

export function RegisterAccountStep({
  name,
  email,
  password,
  acceptedTerms,
  hidePassword = false,
  emailOwnershipConfirmed,
  errors = {},
  onChange,
}: {
  name: string
  email: string
  password: string
  acceptedTerms: boolean
  hidePassword?: boolean
  emailOwnershipConfirmed?: boolean
  errors?: RegisterAccountErrors
  onChange: (values: Partial<{
    name: string
    email: string
    password: string
    acceptedTerms: boolean
    emailOwnershipConfirmed: boolean
  }>) => void
}) {
  const { t } = useTranslation(['auth', 'common'])

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('auth:register.name')}</Label>
        <Input
          id="name"
          value={name}
          className={errors.name ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          onChange={(event) => onChange({ name: event.target.value })}
          required
        />
        <FieldError id="name-error" message={errors.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth:register.email')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          className={errors.email ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          onChange={(event) => onChange({ email: event.target.value })}
          autoComplete="email"
          required
        />
        <FieldError id="email-error" message={errors.email} />
      </div>
      {!hidePassword && (
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth:register.password')}</Label>
          <Input
            id="password"
            type="password"
            aria-describedby={errors.password ? 'password-error' : 'password-requirements'}
            aria-invalid={Boolean(errors.password)}
            className={errors.password ? invalidFieldClass : undefined}
            value={password}
            onChange={(event) => onChange({ password: event.target.value })}
            autoComplete="new-password"
            required
          />
          <FieldError id="password-error" message={errors.password} />
          <p id="password-requirements" className="text-sm text-muted-foreground">
            {t('errors:passwordRequirements')}
          </p>
        </div>
      )}
      {hidePassword && (
        <p className="text-sm text-muted-foreground">{t('auth:register.teacherAccountHelp')}</p>
      )}
      {emailOwnershipConfirmed !== undefined && (
        <div
          className={`rounded-lg border bg-secondary/40 p-3 ${errors.emailOwnershipConfirmed ? 'border-destructive' : 'border-border/70'}`}
        >
          <label className="flex gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border"
              checked={emailOwnershipConfirmed}
              aria-invalid={Boolean(errors.emailOwnershipConfirmed)}
              aria-describedby={errors.emailOwnershipConfirmed ? 'email-ownership-error' : undefined}
              onChange={(event) => onChange({ emailOwnershipConfirmed: event.target.checked })}
            />
            <span>{t('auth:register.confirmEmailOwnership')}</span>
          </label>
          <FieldError id="email-ownership-error" message={errors.emailOwnershipConfirmed} />
        </div>
      )}
      <div className={`rounded-lg border bg-secondary/40 p-3 ${errors.acceptedTerms ? 'border-destructive' : 'border-border/70'}`}>
        <label className="flex gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border"
            checked={acceptedTerms}
            aria-invalid={Boolean(errors.acceptedTerms)}
            aria-describedby={errors.acceptedTerms ? 'accepted-terms-error' : undefined}
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
        <FieldError id="accepted-terms-error" message={errors.acceptedTerms} />
      </div>
    </div>
  )
}
