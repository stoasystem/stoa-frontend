import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/layouts/AuthLayout'
import { isCompliantPassword, isValidEmail } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'
import { resetPassword } from '@/services/auth/authApi'

export function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState((searchParams.get('email') || '').trim())
  const [confirmationCode, setConfirmationCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const resetMutation = useMutation({
    mutationFn: resetPassword,
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const address = email.trim()
    const code = confirmationCode.trim()
    if (!isValidEmail(address)) {
      setFormError(t('errors:invalidEmail'))
      return
    }
    if (!code) {
      setFormError(t('errors:required'))
      return
    }
    if (!isCompliantPassword(password)) {
      setFormError(t('errors:passwordRequirements'))
      return
    }
    if (password !== confirmPassword) {
      setFormError(t('auth:resetPassword.passwordMismatch'))
      return
    }
    setFormError(null)
    resetMutation.mutate({ email: address, confirmationCode: code, newPassword: password })
  }

  const resetError = resetMutation.error
  const errorCode = resetError instanceof ApiError ? resetError.code : undefined
  const errorText = resetError
    ? t(`auth:resetPassword.errors.${errorCode}`, {
      defaultValue: toUserFacingError(resetError, t('auth:resetPassword.failed')),
    })
    : null
  const succeeded = resetMutation.isSuccess

  return (
    <AuthLayout>
      <section className="brand-rule rounded-lg border border-border/70 bg-card/90 p-6 shadow-[var(--platform-shadow-soft)] md:p-8">
        <p className="brand-section-kicker">{t('auth:resetPassword.eyebrow')}</p>
        <h1 className="editorial-heading mt-5 text-4xl font-semibold leading-tight text-foreground">
          {succeeded ? t('auth:resetPassword.successTitle') : t('auth:resetPassword.title')}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground" role="status">
          {succeeded ? t('auth:resetPassword.successBody') : t('auth:resetPassword.body')}
        </p>

        {succeeded ? (
          <Button asChild className="premium-button-lift mt-6 rounded-full">
            <Link to="/login">{t('auth:resetPassword.signInCta')}</Link>
          </Button>
        ) : (
          <form className="mt-6 grid max-w-md gap-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="reset-password-email">{t('auth:resetPassword.emailLabel')}</Label>
              <Input
                id="reset-password-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-code">{t('auth:resetPassword.codeLabel')}</Label>
              <Input
                id="reset-password-code"
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
                placeholder={t('auth:resetPassword.codePlaceholder')}
                aria-describedby="reset-password-code-help"
                required
              />
              <p id="reset-password-code-help" className="text-xs text-muted-foreground">
                {t('auth:resetPassword.codeHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-new">{t('auth:resetPassword.passwordLabel')}</Label>
              <Input
                id="reset-password-new"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="reset-password-requirements"
                required
              />
              <p id="reset-password-requirements" className="text-sm text-muted-foreground">
                {t('errors:passwordRequirements')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-confirm">{t('auth:resetPassword.confirmPasswordLabel')}</Label>
              <Input
                id="reset-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            {(formError || errorText) && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {formError || errorText}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? t('common:actions.saving') : t('auth:resetPassword.submit')}
              </Button>
              <Link className="text-sm text-muted-foreground underline hover:text-foreground" to="/forgot-password">
                {t('auth:resetPassword.requestNewCode')}
              </Link>
            </div>
          </form>
        )}
      </section>
    </AuthLayout>
  )
}
