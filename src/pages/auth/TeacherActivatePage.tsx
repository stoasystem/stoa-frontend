import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useClaimTeacherInvitationMutation,
  useConsumeTeacherInvitationMutation,
} from '@/hooks/teacher/useTeacherApplication'
import { AuthLayout } from '@/layouts/AuthLayout'
import { isCompliantPassword } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'
import { useAuthStore } from '@/store/authStore'

function activationMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.code) {
    return error.code
  }
  return toUserFacingError(error, fallback)
}

export function TeacherActivatePage() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const claimMutation = useClaimTeacherInvitationMutation()
  const consumeMutation = useConsumeTeacherInvitationMutation()

  const succeeded = claimMutation.isSuccess || consumeMutation.isSuccess
  const pending = claimMutation.isPending || consumeMutation.isPending
  const requestError = claimMutation.error || consumeMutation.error
  const resumeRequired =
    requestError instanceof ApiError && requestError.code === 'activation_resume_required'

  function handleClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setFormError(t('auth:activate.missingToken'))
      return
    }
    if (!isCompliantPassword(password) || password.length < 12) {
      setFormError(t('errors:passwordRequirements'))
      return
    }
    if (password !== confirmPassword) {
      setFormError(t('auth:activate.passwordMismatch'))
      return
    }
    setFormError(null)
    claimMutation.mutate({ token, password })
  }

  function handleConsume() {
    if (!token) {
      setFormError(t('auth:activate.missingToken'))
      return
    }
    setFormError(null)
    consumeMutation.mutate(token)
  }

  return (
    <AuthLayout>
      <section className="brand-rule rounded-lg border border-border/70 bg-card/90 p-6 shadow-[var(--platform-shadow-soft)] md:p-8">
        <p className="brand-section-kicker">{t('auth:activate.eyebrow')}</p>
        <h1 className="editorial-heading mt-5 text-4xl font-semibold leading-tight text-foreground">
          {t('auth:activate.title')}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {t('auth:activate.body')}
        </p>

        {!token && (
          <p className="mt-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {t('auth:activate.missingToken')}
          </p>
        )}

        {succeeded && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{t('auth:activate.success')}</p>
            <Button asChild className="rounded-full">
              <Link to="/login">{t('auth:activate.signIn')}</Link>
            </Button>
          </div>
        )}

        {!succeeded && token && isAuthenticated && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{t('auth:activate.signedInHelp')}</p>
            <Button type="button" disabled={pending} onClick={handleConsume}>
              {pending ? t('common:actions.creatingAccount') : t('auth:activate.finish')}
            </Button>
          </div>
        )}

        {!succeeded && token && !isAuthenticated && (
          <form className="mt-6 grid max-w-md gap-4" onSubmit={handleClaim}>
            <div className="space-y-2">
              <Label htmlFor="teacher-password">{t('auth:register.password')}</Label>
              <Input
                id="teacher-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">{t('errors:passwordRequirements')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-password-confirm">{t('auth:activate.confirmPassword')}</Label>
              <Input
                id="teacher-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? t('common:actions.creatingAccount') : t('auth:activate.submit')}
            </Button>
          </form>
        )}

        {(formError || requestError) && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError
              || t(`auth:activate.errors.${requestError instanceof ApiError ? requestError.code : 'unknown'}`, {
                defaultValue: activationMessage(requestError, t('auth:activate.failed')),
              })}
          </p>
        )}

        {resumeRequired && (
          <p className="mt-3 text-sm text-muted-foreground">
            <Link className="underline" to={`/login?next=${encodeURIComponent(`/teacher-activate?token=${token}`)}`}>
              {t('auth:activate.resumeSignIn')}
            </Link>
          </p>
        )}
      </section>
    </AuthLayout>
  )
}
