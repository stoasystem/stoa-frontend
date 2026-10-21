import { type FormEvent, useEffect, useRef, useState } from 'react'
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

type ActivationField = 'password' | 'confirm' | 'dateOfBirth'

// The field a refusal of the claim is about; any other refusal is about the
// invitation as a whole and marks no field.
const REFUSAL_FIELDS: ReadonlyMap<string, ActivationField> = new Map([
  ['password_rejected', 'password'],
  ['date_of_birth_invalid', 'dateOfBirth'],
])

const ERROR_ID = 'activation-error'
const RULES_ID = 'activation-password-rules'
const DATE_OF_BIRTH_HINT_ID = 'activation-date-of-birth-hint'

export function ActivateAccountPage() {
  const { t } = useTranslation(['admin', 'auth', 'common', 'errors'])
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Only reaches the server when the invitation did not already carry one; an
  // administrator's record always wins over a self-declared date.
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [formError, setFormError] = useState<{ message: string; field?: ActivationField } | null>(null)
  const claimMutation = useClaimInvitationMutation()
  const success = useRef<HTMLParagraphElement>(null)

  // The form goes once the claim succeeds, and focus would go down with it to
  // the page; it moves to the sentence saying so, with the sign-in link next
  // after it (#409, WCAG 2.4.3).
  useEffect(() => {
    if (claimMutation.isSuccess) success.current?.focus()
  }, [claimMutation.isSuccess])

  const claimCode = claimMutation.error instanceof ApiError ? claimMutation.error.code : undefined
  const refusalField = claimCode ? REFUSAL_FIELDS.get(claimCode) : undefined
  const invalidField = formError ? formError.field : refusalField

  /** What a field reads with its label: the error, if it is about this field, then its own help. */
  function fieldProps(field: ActivationField, ...help: string[]) {
    const invalid = invalidField === field
    const describedBy = [invalid ? ERROR_ID : '', ...help].filter(Boolean).join(' ')
    return { 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy || undefined }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setFormError({ message: t('admin:activation.missingToken') })
      return
    }
    if (!isCompliantPassword(password)) {
      setFormError({ message: t('errors:passwordRequirements'), field: 'password' })
      return
    }
    if (password !== confirmPassword) {
      setFormError({ message: t('admin:activation.passwordMismatch'), field: 'confirm' })
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
            <p ref={success} tabIndex={-1} className="text-sm text-muted-foreground">
              {t('admin:activation.success')}
            </p>
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
                {...fieldProps('password', RULES_ID)}
              />
              <p id={RULES_ID} className="text-sm text-muted-foreground">
                {t('errors:passwordRequirements')}
              </p>
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
                {...fieldProps('confirm')}
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
                {...fieldProps('dateOfBirth', DATE_OF_BIRTH_HINT_ID)}
              />
              <p id={DATE_OF_BIRTH_HINT_ID} className="text-sm text-muted-foreground">
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
          <p id={ERROR_ID} className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError?.message
              || t(
                `admin:activation.errors.${claimCode ?? 'unknown'}`,
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
