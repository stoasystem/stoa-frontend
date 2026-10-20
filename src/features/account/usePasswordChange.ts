import { type FormEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAddressContext } from '@/lib/addressForm'
import { isCompliantPassword } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'
import { confirmPasswordChange, requestPasswordChange } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export type PasswordChangeStep = 'verifyCurrent' | 'enterCode' | 'done'
export type PasswordChangeField = 'current' | 'code' | 'password' | 'confirm'

// The field a backend refusal is about. Any other refusal -- a rate limit, an
// undelivered code -- is about the whole form and marks no field.
const REFUSAL_FIELDS: ReadonlyMap<string, PasswordChangeField> = new Map([
  ['password_change_credentials_invalid', 'current'],
  ['password_change_verification_failed', 'code'],
  ['password_requirements_not_met', 'password'],
])

/**
 * The self-service password change, in one place for every screen that offers
 * it: `/settings/password` (including the forced change after an administrator
 * reset) and `/me` (#46).
 *
 * Current password -> the backend mails a six-digit code -> code and the new
 * password. The same calls, the same checks before each call, and the same
 * messages for each backend error code, wherever the form is shown.
 */
export function usePasswordChange({
  outcomeRef,
}: {
  /** What the screen shows once the change is through; focus goes there then. */
  outcomeRef?: RefObject<HTMLElement | null>
} = {}) {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  // The flow is shared by every role; its lines follow the reader (#277).
  const context = useAddressContext()
  const [step, setStep] = useState<PasswordChangeStep>('verifyCurrent')
  const [currentPassword, setCurrentPassword] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [maskedRecipient, setMaskedRecipient] = useState('')
  const [formError, setFormError] = useState<{ message: string; field: PasswordChangeField } | null>(null)
  const fieldRef = useRef<HTMLInputElement>(null)
  const shownStep = useRef(step)

  // Each step replaces the form before it, which took focus down with it to
  // the page. It goes to the new step's first field, or to the screen's
  // outcome once the change is through (#409, WCAG 2.4.3). Not on arrival:
  // only a step the visitor moved to takes focus.
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    if (step === 'done') outcomeRef?.current?.focus()
    else fieldRef.current?.focus()
  }, [step, outcomeRef])

  // A mutation keeps its variables -- here, passwords -- in the query
  // client's cache until it is collected; gcTime 0 collects it as soon as
  // nothing shows it any more (after reset(), or leaving the page).
  const requestMutation = useMutation({
    mutationFn: requestPasswordChange,
    gcTime: 0,
    onSuccess: (data) => {
      setMaskedRecipient(data.maskedRecipient)
      setStep('enterCode')
    },
  })

  const confirmMutation = useMutation({
    mutationFn: confirmPasswordChange,
    gcTime: 0,
    onSuccess: () => {
      setStep('done')
      // The obligation is discharged on the server; clearing it here is what
      // lets ProtectedRoute stop sending this account back to the change.
      const current = useAuthStore.getState().user
      if (current?.mustChangePassword) {
        setUser({ ...current, mustChangePassword: false })
      }
    },
  })

  function submitCurrent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentPassword) {
      setFormError({ message: t('errors:required'), field: 'current' })
      return
    }
    setFormError(null)
    requestMutation.mutate({ currentPassword })
  }

  function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submittedCode = code.trim()
    if (!submittedCode) {
      setFormError({ message: t('errors:required'), field: 'code' })
      return
    }
    if (!isCompliantPassword(password)) {
      setFormError({ message: t('errors:passwordRequirements'), field: 'password' })
      return
    }
    if (password !== confirmPassword) {
      setFormError({ message: t('auth:changePassword.passwordMismatch'), field: 'confirm' })
      return
    }
    setFormError(null)
    confirmMutation.mutate({ currentPassword, code: submittedCode, newPassword: password })
  }

  function requestNewCode() {
    setCode('')
    setFormError(null)
    setStep('verifyCurrent')
  }

  /** Back to an empty first step, for another change on the same page. */
  function reset() {
    setStep('verifyCurrent')
    setCurrentPassword('')
    setCode('')
    setPassword('')
    setConfirmPassword('')
    setMaskedRecipient('')
    setFormError(null)
    requestMutation.reset()
    confirmMutation.reset()
  }

  const activeError = step === 'enterCode' ? confirmMutation.error : requestMutation.error
  const errorCode = activeError instanceof ApiError ? activeError.code : undefined
  const errorText = activeError
    ? t(`auth:changePassword.errors.${errorCode}`, {
      context,
      defaultValue: toUserFacingError(activeError, t('auth:changePassword.failed', { context })),
    })
    : null
  const refusalField = (errorCode && REFUSAL_FIELDS.get(errorCode)) || null

  return {
    context,
    step,
    mustChangePassword: user?.mustChangePassword ?? false,
    maskedRecipient,
    fields: {
      currentPassword,
      setCurrentPassword,
      code,
      setCode,
      password,
      setPassword,
      confirmPassword,
      setConfirmPassword,
    },
    /** What the visitor must fix, or what the backend refused; null when nothing is wrong. */
    error: formError?.message || errorText,
    /** The field that error is about; null when it is about the whole form, or there is none. */
    errorField: formError ? formError.field : refusalField,
    /** For the first field of each step, which takes focus when the step changes. */
    fieldRef,
    isRequesting: requestMutation.isPending,
    isConfirming: confirmMutation.isPending,
    submitCurrent,
    submitNew,
    requestNewCode,
    reset,
  }
}

export type PasswordChangeFlow = ReturnType<typeof usePasswordChange>
