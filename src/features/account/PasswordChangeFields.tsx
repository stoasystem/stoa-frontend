import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base/Button'
import { TextField } from '@/components/base/TextField'
import type { PasswordChangeField, PasswordChangeFlow } from '@/features/account/usePasswordChange'

/*
 * The two forms of the password change, drawn with the base components. What
 * each step says above the form (the heading, the "code sent" line) belongs
 * to the screen showing it; everything the visitor types, and every message
 * the change answers with, is here, the same on every screen.
 */
export function PasswordChangeFields({
  flow,
  secondary,
  idPrefix = 'change-password',
}: {
  flow: PasswordChangeFlow
  /** Beside the first step's button: a way back, where one is allowed. */
  secondary?: ReactNode
  /** Keeps the field ids unique when two forms could share a document. */
  idPrefix?: string
}) {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const { fields } = flow
  const errorId = `${idPrefix}-error`

  // The field an error is about is marked invalid and reads the error with
  // its label (#409, WCAG 3.3.1); one about the whole form marks none.
  const invalid = (field: PasswordChangeField) =>
    flow.error && flow.errorField === field ? { 'aria-invalid': true, 'aria-describedby': errorId } : {}

  const alert = flow.error && (
    <p id={errorId} className="m-0 text-[15px] leading-[1.4] text-red" role="alert">
      {flow.error}
    </p>
  )

  if (flow.step === 'verifyCurrent') {
    return (
      <form className="grid max-w-md gap-4" onSubmit={flow.submitCurrent} noValidate>
        <TextField
          ref={flow.fieldRef}
          id={`${idPrefix}-current`}
          label={t('auth:changePassword.currentPasswordLabel')}
          type="password"
          autoComplete="current-password"
          value={fields.currentPassword}
          onChange={(event) => fields.setCurrentPassword(event.target.value)}
          required
          {...invalid('current')}
        />
        {alert}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={flow.isRequesting}>
            {flow.isRequesting ? t('common:actions.sending') : t('auth:changePassword.sendCodeCta')}
          </Button>
          {secondary}
        </div>
      </form>
    )
  }

  if (flow.step === 'enterCode') {
    return (
      <form className="grid max-w-md gap-4" onSubmit={flow.submitNew} noValidate>
        <TextField
          ref={flow.fieldRef}
          id={`${idPrefix}-code`}
          label={t('auth:changePassword.codeLabel')}
          hint={t('auth:changePassword.codeHelp')}
          value={fields.code}
          onChange={(event) => fields.setCode(event.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          placeholder={t('auth:changePassword.codePlaceholder')}
          required
          {...invalid('code')}
        />
        <TextField
          id={`${idPrefix}-new`}
          label={t('auth:changePassword.newPasswordLabel')}
          hint={t('errors:passwordRequirements')}
          type="password"
          autoComplete="new-password"
          value={fields.password}
          onChange={(event) => fields.setPassword(event.target.value)}
          required
          {...invalid('password')}
        />
        <TextField
          id={`${idPrefix}-confirm`}
          label={t('auth:changePassword.confirmPasswordLabel')}
          type="password"
          autoComplete="new-password"
          value={fields.confirmPassword}
          onChange={(event) => fields.setConfirmPassword(event.target.value)}
          required
          {...invalid('confirm')}
        />
        {alert}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={flow.isConfirming}>
            {flow.isConfirming ? t('common:actions.saving') : t('auth:changePassword.submit')}
          </Button>
          {/* Not while the change is on its way: it could still go through
              after the visitor has gone back for another code. */}
          <Button variant="plain" onClick={flow.requestNewCode} disabled={flow.isConfirming}>
            {t('auth:changePassword.requestNewCode')}
          </Button>
        </div>
      </form>
    )
  }

  return null
}

/** The line under the heading: what to do now, or that it is done. */
export function passwordChangeStatusKey(flow: PasswordChangeFlow) {
  if (flow.step === 'done') return 'auth:changePassword.successBody'
  if (flow.step === 'enterCode') return 'auth:changePassword.sentBody'
  return 'auth:changePassword.body'
}
