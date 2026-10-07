import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, CircleAlert, MailCheck, RotateCcw, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { skyErrorClass, skyInputClass, skyLabelClass } from '@/components/auth/skyFields'
import { Button as SkyButton } from '@/components/base/Button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  confirmEmailVerification,
  isUnauthorizedError,
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
  /**
   * `sky` when the panel sits on a sky surface (the sign-in page, #53): a
   * glass card with the sky's text, fields and white buttons. Registration
   * keeps the light card. Only the look differs.
   */
  surface?: 'light' | 'sky'
}

// The light card's classes are the ones it always had; the sky's read the sky tokens.
const looks = {
  light: {
    card: 'rounded-lg border border-border/70 bg-card/90 p-5',
    badge: 'bg-primary text-primary-foreground',
    kicker: 'brand-section-kicker',
    title: 'mt-2 text-xl font-semibold text-foreground',
    body: 'mt-2 text-sm leading-6 text-muted-foreground',
    label: undefined,
    input: undefined,
    help: 'text-xs text-muted-foreground',
    error: 'rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive',
  },
  sky: {
    card: 'rounded-[var(--corner-card)] border border-[color:var(--sky-glass-border)] bg-[var(--sky-glass)] p-5 shadow-[var(--shadow-glass)] backdrop-blur-[var(--sky-glass-blur)]',
    badge: 'bg-[var(--on-sky-button)] text-[color:var(--on-sky-button-text)]',
    kicker: 'm-0 text-[13px] leading-[1.3] font-medium tracking-[0.4px] uppercase text-[color:var(--on-sky-text-caption)]',
    title: 'mt-2 text-[17px] leading-[1.3] font-semibold text-[color:var(--on-sky-text)]',
    body: 'mt-2 text-[15px] leading-[1.4] text-[color:var(--on-sky-text-body)]',
    label: skyLabelClass,
    input: skyInputClass,
    help: 'text-[12px] leading-[1.35] text-[color:var(--on-sky-text-caption)]',
    error: skyErrorClass,
  },
} as const

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
  if (isUnauthorizedError(error)) return 'verification.unauthorized'
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
  surface = 'light',
}: EmailVerificationPanelProps) {
  const look = looks[surface]
  const sky = surface === 'sky'
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

  const errorText = errorKey ? t(`auth:${errorKey}`) : toUserFacingError(lastError, t('auth:verification.failed'))
  const confirmLabel = confirmMutation.isPending ? t('common:actions.saving') : t('auth:verification.confirmCta')
  const resendLabel = resendMutation.isPending ? (
    t('common:actions.sending')
  ) : (
    <>
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      {t('auth:verification.resendCta')}
    </>
  )

  function handleConfirm() {
    if (confirmDisabled) return
    confirmMutation.mutate()
  }

  return (
    <div className={look.card}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${look.badge}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className={look.kicker}>{t('auth:verification.eyebrow')}</p>
          <h2 className={look.title}>
            {confirmed ? t('auth:verification.confirmedTitle') : t('auth:verification.title')}
          </h2>
          <p className={look.body} role="status">
            {statusText}
          </p>
        </div>
      </div>

      {!confirmed && (
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-email" className={look.label}>{t('auth:register.email')}</Label>
            <Input
              id="verification-email"
              value={email}
              readOnly
              autoComplete="email"
              className={look.input}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verification-code" className={look.label}>{t('auth:verification.codeLabel')}</Label>
            <Input
              id="verification-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder={t('auth:verification.codePlaceholder')}
              aria-describedby="verification-help"
              className={look.input}
            />
            <p id="verification-help" className={look.help}>
              {t('auth:verification.codeHelp')}
            </p>
          </div>

          {lastError !== undefined && (
            <p className={look.error} role="alert">
              {sky ? (
                <>
                  <CircleAlert aria-hidden="true" size={16} strokeWidth={1.6} className="mt-px shrink-0" />
                  <span>{errorText}</span>
                </>
              ) : errorText}
            </p>
          )}

          {sky ? (
            // Placement, dark surface: white button first, plain white 85% beside it.
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <SkyButton variant="onSky" disabled={confirmDisabled} onClick={handleConfirm}>
                {confirmLabel}
              </SkyButton>
              <SkyButton variant="onSkyPlain" disabled={resendDisabled} onClick={() => resendMutation.mutate()}>
                {resendLabel}
              </SkyButton>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" className="min-w-36" disabled={confirmDisabled} onClick={handleConfirm}>
                {confirmLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-w-36"
                disabled={resendDisabled}
                onClick={() => resendMutation.mutate()}
              >
                {resendLabel}
              </Button>
            </div>
          )}
        </div>
      )}

      {confirmed && (sky ? (
        <SkyButton asChild variant="onSky" className="mt-5">
          <Link to="/login">{t('auth:verification.signInCta')}</Link>
        </SkyButton>
      ) : (
        <Button asChild className="premium-button-lift mt-5 rounded-full">
          <Link to="/login">{t('auth:verification.signInCta')}</Link>
        </Button>
      ))}
    </div>
  )
}
