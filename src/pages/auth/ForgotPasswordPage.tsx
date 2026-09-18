import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/layouts/AuthLayout'
import { isValidEmail } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'
import { requestPasswordReset } from '@/services/auth/authApi'

export function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const requestMutation = useMutation({
    mutationFn: (address: string) => requestPasswordReset({ email: address }),
    onSuccess: (_data, address) => setSentTo(address),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const address = email.trim()
    if (!isValidEmail(address)) {
      setFormError(t('errors:invalidEmail'))
      return
    }
    setFormError(null)
    requestMutation.mutate(address)
  }

  const requestError = requestMutation.error
  const errorCode = requestError instanceof ApiError ? requestError.code : undefined
  const errorText = requestError
    ? t(`auth:forgotPassword.errors.${errorCode}`, {
      defaultValue: toUserFacingError(requestError, t('auth:forgotPassword.failed')),
    })
    : null

  return (
    <AuthLayout>
      <section className="brand-rule rounded-lg border border-border/70 bg-card/90 p-6 shadow-[var(--platform-shadow-soft)] md:p-8">
        <p className="brand-section-kicker">{t('auth:forgotPassword.eyebrow')}</p>
        <h1 className="editorial-heading mt-5 text-4xl font-semibold leading-tight text-foreground">
          {sentTo ? t('auth:forgotPassword.sentTitle') : t('auth:forgotPassword.title')}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground" role="status">
          {sentTo
            ? t('auth:forgotPassword.sentBody', { email: sentTo })
            : t('auth:forgotPassword.body')}
        </p>

        {sentTo ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="premium-button-lift rounded-full">
              <Link to={`/reset-password?email=${encodeURIComponent(sentTo)}`}>
                {t('auth:forgotPassword.continueCta')}
              </Link>
            </Button>
            <Link className="text-sm text-muted-foreground underline hover:text-foreground" to="/login">
              {t('auth:forgotPassword.backToSignIn')}
            </Link>
          </div>
        ) : (
          <form className="mt-6 grid max-w-md gap-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="forgot-password-email">{t('auth:forgotPassword.emailLabel')}</Label>
              <Input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            {(formError || errorText) && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {formError || errorText}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={requestMutation.isPending}>
                {requestMutation.isPending
                  ? t('common:actions.sending')
                  : t('auth:forgotPassword.submit')}
              </Button>
              <Link className="text-sm text-muted-foreground underline hover:text-foreground" to="/login">
                {t('auth:forgotPassword.backToSignIn')}
              </Link>
            </div>
          </form>
        )}
      </section>
    </AuthLayout>
  )
}
