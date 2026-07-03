import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, MailCheck, RotateCcw, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  confirmEmailVerification,
  isVerificationRateLimitedError,
  resendEmailVerification,
} from '@/services/auth/authApi'
import { toUserFacingError } from '@/lib/userFacingText'
import type { EmailVerificationResponse, EmailVerificationStatus, UserRole } from '@/types/user'

type EmailVerificationPanelProps = {
  email: string
  role?: UserRole
  source: 'register' | 'login'
  initialStatus?: EmailVerificationStatus
}

function verificationMessageKey(response: EmailVerificationResponse | undefined) {
  if (!response) return null
  if (response.status === 'confirmed') return 'verification.confirmedBody'
  if (response.status === 'already_verified') return 'verification.alreadyVerifiedBody'
  if (response.status === 'already_requested') return 'verification.alreadyRequestedBody'
  if (response.status === 'sent') return 'verification.sentBody'
  if (response.status === 'accepted') return 'verification.acceptedBody'
  return null
}

function getErrorCopy(error: unknown, fallback: string) {
  const message = toUserFacingError(error, fallback)
  if (isVerificationRateLimitedError(error)) return 'verification.rateLimited'
  if (/expired/i.test(message)) return 'verification.expired'
  if (/invalid/i.test(message)) return 'verification.invalid'
  return null
}

export function EmailVerificationPanel({
  email,
  role,
  source,
  initialStatus,
}: EmailVerificationPanelProps) {
  const { t } = useTranslation(['auth', 'common'])
  const [code, setCode] = useState('')
  const [response, setResponse] = useState<EmailVerificationResponse | undefined>()
  const [lastError, setLastError] = useState<unknown>()

  const confirmMutation = useMutation({
    mutationFn: () => confirmEmailVerification({ email, role, confirmationCode: code.trim() }),
    onMutate: () => setLastError(undefined),
    onSuccess: (data) => setResponse(data),
    onError: (error) => setLastError(error),
  })
  const resendMutation = useMutation({
    mutationFn: () => resendEmailVerification({ email, role }),
    onMutate: () => setLastError(undefined),
    onSuccess: (data) => setResponse(data),
    onError: (error) => setLastError(error),
  })

  const confirmed = response?.status === 'confirmed' || response?.status === 'already_verified'
  const statusKey = verificationMessageKey(response)
  const errorKey = getErrorCopy(lastError, t('auth:verification.failed'))
  const Icon = confirmed ? CheckCircle2 : initialStatus === 'expired_verification' ? ShieldAlert : MailCheck
  const sourceBody = source === 'register'
    ? t('auth:verification.registerBody', { email })
    : t('auth:verification.loginBody', { email })
  const confirmDisabled = confirmMutation.isPending || !code.trim() || confirmed
  const resendDisabled = resendMutation.isPending || confirmed

  const statusText = useMemo(() => {
    if (statusKey) return t(`auth:${statusKey}`)
    if (initialStatus === 'expired_verification') return t('auth:verification.expired')
    if (initialStatus === 'resend_limited') return t('auth:verification.rateLimited')
    return sourceBody
  }, [initialStatus, sourceBody, statusKey, t])

  function handleConfirm() {
    if (confirmDisabled) return
    confirmMutation.mutate()
  }

  return (
    <div className="rounded-lg border border-border/70 bg-card/90 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="brand-section-kicker">{t('auth:verification.eyebrow')}</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            {confirmed ? t('auth:verification.confirmedTitle') : t('auth:verification.title')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground" role="status">
            {statusText}
          </p>
        </div>
      </div>

      {!confirmed && (
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-email">{t('auth:register.email')}</Label>
            <Input id="verification-email" value={email} readOnly autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verification-code">{t('auth:verification.codeLabel')}</Label>
            <Input
              id="verification-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder={t('auth:verification.codePlaceholder')}
              aria-describedby="verification-help"
            />
            <p id="verification-help" className="text-xs text-muted-foreground">
              {t('auth:verification.codeHelp')}
            </p>
          </div>

          {lastError !== undefined && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {errorKey ? t(`auth:${errorKey}`) : toUserFacingError(lastError, t('auth:verification.failed'))}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="min-w-36" disabled={confirmDisabled} onClick={handleConfirm}>
              {confirmMutation.isPending ? t('common:actions.saving') : t('auth:verification.confirmCta')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-36"
              disabled={resendDisabled}
              onClick={() => resendMutation.mutate()}
            >
              {resendMutation.isPending ? (
                t('common:actions.sending')
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t('auth:verification.resendCta')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {confirmed && (
        <Button asChild className="premium-button-lift mt-5 rounded-full">
          <Link to="/login">{t('auth:verification.signInCta')}</Link>
        </Button>
      )}
    </div>
  )
}
