import { type FormEvent, useEffect, useRef, useState } from 'react'
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

type ActivationField = 'password' | 'confirm'

const ERROR_ID = 'teacher-activate-error'
const RULES_ID = 'teacher-password-rules'

export function TeacherActivatePage() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<{ message: string; field?: ActivationField } | null>(null)
  const claimMutation = useClaimTeacherInvitationMutation()
  const consumeMutation = useConsumeTeacherInvitationMutation()
  const success = useRef<HTMLParagraphElement>(null)

  const succeeded = claimMutation.isSuccess || consumeMutation.isSuccess
  const pending = claimMutation.isPending || consumeMutation.isPending
  const requestError = claimMutation.error || consumeMutation.error
  const requestCode = requestError instanceof ApiError ? requestError.code : undefined
  const resumeRequired = requestCode === 'activation_resume_required'
  // A code with a sentence of its own reads that. Any other code, and a refusal
  // with none, reads the generic sentence, or the server's English one for an
  // English reader; the code itself never reaches the screen (#265, #367).
  const requestFallback = requestError ? toUserFacingError(requestError, t('auth:activate.failed')) : null
  const requestErrorText = requestCode
    ? t(`auth:activate.errors.${requestCode}`, { defaultValue: requestFallback })
    : requestFallback
  // A rejected password is the one refusal about a field; the others are
  // about the invitation as a whole.
  const invalidField = formError ? formError.field : requestCode === 'password_rejected' ? 'password' : undefined

  // The form or the finish button goes once activation succeeds, and focus
  // would go down with it to the page; it moves to the sentence saying so,
  // with the sign-in link next after it (#409, WCAG 2.4.3).
  useEffect(() => {
    if (succeeded) success.current?.focus()
  }, [succeeded])

  /** What a field reads with its label: the error, if it is about this field, then its own help. */
  function fieldProps(field: ActivationField, ...help: string[]) {
    const invalid = invalidField === field
    const describedBy = [invalid ? ERROR_ID : '', ...help].filter(Boolean).join(' ')
    return { 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy || undefined }
  }

  function handleClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setFormError({ message: t('auth:activate.missingToken') })
      return
    }
    if (!isCompliantPassword(password) || password.length < 12) {
      setFormError({ message: t('errors:passwordRequirements'), field: 'password' })
      return
    }
    if (password !== confirmPassword) {
      setFormError({ message: t('auth:activate.passwordMismatch'), field: 'confirm' })
      return
    }
    setFormError(null)
    claimMutation.mutate({ token, password })
  }

  function handleConsume() {
    if (!token) {
      setFormError({ message: t('auth:activate.missingToken') })
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
            <p ref={success} tabIndex={-1} className="text-sm text-muted-foreground">
              {t('auth:activate.success')}
            </p>
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
                {...fieldProps('password', RULES_ID)}
              />
              <p id={RULES_ID} className="text-sm text-muted-foreground">
                {t('errors:passwordRequirements')}
              </p>
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
                {...fieldProps('confirm')}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? t('common:actions.creatingAccount') : t('auth:activate.submit')}
            </Button>
          </form>
        )}

        {(formError || requestErrorText) && (
          <p id={ERROR_ID} className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError?.message || requestErrorText}
          </p>
        )}

        {resumeRequired && (
          <p className="mt-3 text-sm text-muted-foreground">
            {/* The token is encoded for its own query, then the whole path once
                more as `next`: unencoded, a token with `#` or `&` ended there
                once the sign-in decoded `next` (#409). A token of URL-safe
                characters, as invitations carry, reads exactly as before. */}
            <Link
              className="underline"
              to={`/login?next=${encodeURIComponent(`/teacher-activate?token=${encodeURIComponent(token)}`)}`}
            >
              {t('auth:activate.resumeSignIn')}
            </Link>
          </p>
        )}
      </section>
    </AuthLayout>
  )
}
