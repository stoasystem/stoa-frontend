import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClaimInvitationMutation } from '@/hooks/admin/useAdminAccounts'
import { AuthLayout } from '@/layouts/AuthLayout'
import { isCompliantPassword } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'

export function ActivateAccountPage() {
  const { t } = useTranslation(['admin', 'auth', 'common', 'errors'])
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Only reaches the server when the invitation did not already carry one; an
  // administrator's record always wins over a self-declared date.
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const claimMutation = useClaimInvitationMutation()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setFormError(t('admin:activation.missingToken'))
      return
    }
    if (!isCompliantPassword(password)) {
      setFormError(t('errors:passwordRequirements'))
      return
    }
    if (password !== confirmPassword) {
      setFormError(t('admin:activation.passwordMismatch'))
      return
    }
    setFormError(null)
    claimMutation.mutate({ token, password, dateOfBirth: dateOfBirth.trim() })
  }

  return (
    <AuthLayout>
      <section className="brand-rule rounded-lg border border-border/70 bg-card/90 p-6 shadow-[var(--platform-shadow-soft)] md:p-8">
        <p className="brand-section-kicker">{t('admin:activation.eyebrow')}</p>
        <h1 className="editorial-heading mt-5 text-4xl font-semibold leading-tight text-foreground">
          {t('admin:activation.title')}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {t('admin:activation.body')}
        </p>

        {!token && (
          <p className="mt-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {t('admin:activation.missingToken')}
          </p>
        )}

        {claimMutation.isSuccess ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{t('admin:activation.success')}</p>
            <Button asChild className="rounded-full">
              <Link to="/login">{t('admin:activation.signIn')}</Link>
            </Button>
          </div>
        ) : null}

        {!claimMutation.isSuccess && token ? (
          <form className="mt-6 grid max-w-md gap-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="activation-password">{t('auth:register.password')}</Label>
              <Input
                id="activation-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">{t('errors:passwordRequirements')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activation-password-confirm">{t('admin:activation.confirmPassword')}</Label>
              <Input
                id="activation-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activation-date-of-birth">{t('admin:activation.dateOfBirth')}</Label>
              <Input
                id="activation-date-of-birth"
                type="date"
                autoComplete="bday"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {t('admin:activation.dateOfBirthHint')}
              </p>
            </div>
            <Button type="submit" disabled={claimMutation.isPending}>
              {claimMutation.isPending
                ? t('common:actions.creatingAccount')
                : t('admin:activation.submit')}
            </Button>
          </form>
        ) : null}

        {formError || claimMutation.error ? (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError
              || t(
                `admin:activation.errors.${
                  claimMutation.error instanceof ApiError ? claimMutation.error.code : 'unknown'
                }`,
                {
                  defaultValue: toUserFacingError(
                    claimMutation.error,
                    t('admin:activation.failed'),
                  ),
                },
              )}
          </p>
        ) : null}
      </section>
    </AuthLayout>
  )
}
