import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { getHomePathForUserRole } from '@/lib/navigation'
import { isCompliantPassword } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'
import { confirmPasswordChange, requestPasswordChange } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

type Step = 'verifyCurrent' | 'enterCode' | 'done'

export function ChangePasswordPage() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const mustChangePassword = user?.mustChangePassword ?? false
  // The route sits inside ProtectedRoute, so whoever reaches this page is
  // signed in, and Cognito's change_password does not revoke their tokens.
  // Both exits therefore lead back into the app, never to the login screen.
  const homePath = user ? getHomePathForUserRole(user.role) : '/'
  const [step, setStep] = useState<Step>('verifyCurrent')
  const [currentPassword, setCurrentPassword] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [maskedRecipient, setMaskedRecipient] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const requestMutation = useMutation({
    mutationFn: requestPasswordChange,
    onSuccess: (data) => {
      setMaskedRecipient(data.maskedRecipient)
      setStep('enterCode')
    },
  })

  const confirmMutation = useMutation({
    mutationFn: confirmPasswordChange,
    onSuccess: () => {
      setStep('done')
      // The obligation is discharged on the server; clearing it here is what
      // lets ProtectedRoute stop sending this account back to this page.
      if (user?.mustChangePassword) {
        setUser({ ...user, mustChangePassword: false })
      }
    },
  })

  function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentPassword) {
      setFormError(t('errors:required'))
      return
    }
    setFormError(null)
    requestMutation.mutate({ currentPassword })
  }

  function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submittedCode = code.trim()
    if (!submittedCode) {
      setFormError(t('errors:required'))
      return
    }
    if (!isCompliantPassword(password)) {
      setFormError(t('errors:passwordRequirements'))
      return
    }
    if (password !== confirmPassword) {
      setFormError(t('auth:changePassword.passwordMismatch'))
      return
    }
    setFormError(null)
    confirmMutation.mutate({ currentPassword, code: submittedCode, newPassword: password })
  }

  const activeError = step === 'enterCode' ? confirmMutation.error : requestMutation.error
  const errorCode = activeError instanceof ApiError ? activeError.code : undefined
  const errorText = activeError
    ? t(`auth:changePassword.errors.${errorCode}`, {
      defaultValue: toUserFacingError(activeError, t('auth:changePassword.failed')),
    })
    : null

  return (
    <DashboardLayout>
      <section className="brand-rule rounded-lg border border-border/70 bg-card/90 p-6 shadow-[var(--platform-shadow-soft)] md:p-8">
        <p className="brand-section-kicker">{t('auth:changePassword.eyebrow')}</p>
        <h1 className="editorial-heading mt-5 text-4xl font-semibold leading-tight text-foreground">
          {step === 'done'
            ? t('auth:changePassword.successTitle')
            : t('auth:changePassword.title')}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground" role="status">
          {step === 'done'
            ? t('auth:changePassword.successBody')
            : step === 'enterCode'
              ? t('auth:changePassword.sentBody', { email: maskedRecipient })
              : t('auth:changePassword.body')}
        </p>

        {mustChangePassword && step !== 'done' && (
          <div
            className="mt-5 max-w-xl rounded-md border border-border/70 bg-muted/40 px-4 py-3"
            role="note"
          >
            <p className="text-sm font-semibold text-foreground">
              {t('auth:changePassword.forcedTitle')}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t('auth:changePassword.forcedBody')}
            </p>
          </div>
        )}

        {step === 'done' && (
          <Button asChild className="premium-button-lift mt-6 rounded-full">
            <Link to={homePath}>{t('common:actions.continue')}</Link>
          </Button>
        )}

        {step === 'verifyCurrent' && (
          <form className="mt-6 grid max-w-md gap-4" onSubmit={handleRequest} noValidate>
            <div className="space-y-2">
              <Label htmlFor="change-password-current">
                {t('auth:changePassword.currentPasswordLabel')}
              </Label>
              <Input
                id="change-password-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
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
                  : t('auth:changePassword.sendCodeCta')}
              </Button>
              {!mustChangePassword && (
                <Link className="text-sm text-muted-foreground underline hover:text-foreground" to={homePath}>
                  {t('common:actions.back')}
                </Link>
              )}
            </div>
          </form>
        )}

        {step === 'enterCode' && (
          <form className="mt-6 grid max-w-md gap-4" onSubmit={handleConfirm} noValidate>
            <div className="space-y-2">
              <Label htmlFor="change-password-code">{t('auth:changePassword.codeLabel')}</Label>
              <Input
                id="change-password-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder={t('auth:changePassword.codePlaceholder')}
                aria-describedby="change-password-code-help"
                required
              />
              <p id="change-password-code-help" className="text-xs text-muted-foreground">
                {t('auth:changePassword.codeHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-password-new">
                {t('auth:changePassword.newPasswordLabel')}
              </Label>
              <Input
                id="change-password-new"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="change-password-requirements"
                required
              />
              <p id="change-password-requirements" className="text-sm text-muted-foreground">
                {t('errors:passwordRequirements')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-password-confirm">
                {t('auth:changePassword.confirmPasswordLabel')}
              </Label>
              <Input
                id="change-password-confirm"
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
              <Button type="submit" disabled={confirmMutation.isPending}>
                {confirmMutation.isPending
                  ? t('common:actions.saving')
                  : t('auth:changePassword.submit')}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground underline hover:text-foreground"
                onClick={() => {
                  setCode('')
                  setStep('verifyCurrent')
                }}
              >
                {t('auth:changePassword.requestNewCode')}
              </button>
            </div>
          </form>
        )}
      </section>
    </DashboardLayout>
  )
}
