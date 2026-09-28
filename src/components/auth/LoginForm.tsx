import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleAlert } from 'lucide-react'
import { EmailVerificationPanel } from '@/components/auth/EmailVerificationPanel'
import { skyErrorClass, skyFieldProps, skyInputClass, skyInvalidInputClass, skyLabelClass } from '@/components/auth/skyFields'
import { Button } from '@/components/base/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import { markLoginSubmitted } from '@/lib/loginTiming'
import { toUserFacingError } from '@/lib/userFacingText'
import { createLoginSchema } from '@/lib/validation'
import { isEmailVerificationRequiredError } from '@/services/auth/authApi'

/*
 * The sign-in form. It is drawn for the sky (#53): LoginPage is a
 * `data-surface="sky"` surface, and the classes here read the sky tokens,
 * which exist only inside one. What it does -- validation, the request, the
 * verification hand-off, the errors -- is unchanged from before the redesign.
 */
export function LoginForm() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const loginMutation = useLoginMutation()
  const loginSchema = createLoginSchema(t)
  const verificationBlocked = loginMutation.isError && isEmailVerificationRequiredError(loginMutation.error)

  return (
    <form
      className="space-y-5"
      // The browser's own required-field prompts follow its language, not the
      // one chosen here, so the form's own checks answer instead. `required`
      // stays on the fields for assistive technology.
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (loginMutation.isPending) return
        const result = loginSchema.safeParse({ email, password })
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors
          setErrors({
            email: fieldErrors.email?.[0],
            password: fieldErrors.password?.[0],
          })
          return
        }
        setErrors({})
        markLoginSubmitted()
        loginMutation.mutate(result.data)
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email" className={skyLabelClass}>{t('auth:register.email')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          className={cn(skyInputClass, errors.email && skyInvalidInputClass)}
          {...skyFieldProps}
        />
        {errors.email && <FieldAlert id="login-email-error">{errors.email}</FieldAlert>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className={skyLabelClass}>{t('auth:register.password')}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          className={cn(skyInputClass, errors.password && skyInvalidInputClass)}
          {...skyFieldProps}
        />
        {errors.password && <FieldAlert id="login-password-error">{errors.password}</FieldAlert>}
        {/* There is no self-service recovery any more: a forgotten password is
            reset by an administrator. Signed in, a password is changed under
            /settings/password. */}
        <p className="pt-1 text-[12px] leading-[1.35] text-[color:var(--on-sky-text-caption)]">
          {t('auth:login.forgotPassword')}
        </p>
      </div>
      {verificationBlocked && (
        <EmailVerificationPanel email={email} source="login" surface="sky" />
      )}
      {loginMutation.isError && !verificationBlocked && (
        <FieldAlert>{toUserFacingError(loginMutation.error, t('auth:login.failed'))}</FieldAlert>
      )}
      <Button
        type="submit"
        variant="onSky"
        size="large"
        fullWidth
        disabled={loginMutation.isPending}
        aria-busy={loginMutation.isPending}
      >
        {loginMutation.isPending ? t('common:actions.signingIn') : t('common:actions.signIn')}
      </Button>
      {/* The wait to a usable page is seconds long; say so rather than
          leaving a disabled button as the only sign of progress. */}
      <p className="-mt-2 min-h-5 text-center text-[12px] leading-[1.35] text-[color:var(--on-sky-text-caption)]" role="status" aria-live="polite">
        {loginMutation.isPending ? t('auth:login.signingInStatus') : ''}
      </p>
      <p className="text-[15px] leading-[1.35] text-[color:var(--on-sky-text-body)]">
        {t('auth:login.needAccount')}{' '}
        <Link
          className="font-semibold text-[color:var(--on-sky-text)] underline decoration-[color:var(--on-sky-field-rule)] underline-offset-4 hover:decoration-[color:var(--on-sky-text)]"
          to="/register"
        >
          {t('auth:login.howToGetAccount')}
        </Link>
      </p>
    </form>
  )
}

/** An error on the sky: white, with a glyph, never red (skyFields.ts). */
function FieldAlert({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className={skyErrorClass} role="alert">
      <CircleAlert aria-hidden="true" size={16} strokeWidth={1.6} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  )
}
