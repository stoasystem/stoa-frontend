import { type FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { isCompliantPassword } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'
import { confirmPasswordChange, requestPasswordChange } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export type PasswordChangeStep = 'verifyCurrent' | 'enterCode' | 'done'

/**
 * The self-service password change, in one place for every screen that offers
 * it: `/settings/password` (including the forced change after an administrator
 * reset) and `/me` (#46).
 *
 * Current password -> the backend mails a six-digit code -> code and the new
 * password. The same calls, the same checks before each call, and the same
 * messages for each backend error code, wherever the form is shown.
 */
export function usePasswordChange() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [step, setStep] = useState<PasswordChangeStep>('verifyCurrent')
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
      setFormError(t('errors:required'))
      return
    }
    setFormError(null)
    requestMutation.mutate({ currentPassword })
  }

  function submitNew(event: FormEvent<HTMLFormElement>) {
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
      defaultValue: toUserFacingError(activeError, t('auth:changePassword.failed')),
    })
    : null

  return {
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
    error: formError || errorText,
    isRequesting: requestMutation.isPending,
    isConfirming: confirmMutation.isPending,
    submitCurrent,
    submitNew,
    requestNewCode,
    reset,
  }
}

export type PasswordChangeFlow = ReturnType<typeof usePasswordChange>
