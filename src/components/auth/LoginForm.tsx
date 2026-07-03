import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmailVerificationPanel } from '@/components/auth/EmailVerificationPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import { toUserFacingError } from '@/lib/userFacingText'
import { createLoginSchema } from '@/lib/validation'
import { isEmailVerificationRequiredError } from '@/services/auth/authApi'

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
      className="space-y-4"
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
        loginMutation.mutate(result.data)
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth:register.email')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
        />
        {errors.email && <p id="login-email-error" className="text-xs text-destructive" role="alert">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('auth:register.password')}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
        />
        {errors.password && <p id="login-password-error" className="text-xs text-destructive" role="alert">{errors.password}</p>}
      </div>
      {verificationBlocked && (
        <EmailVerificationPanel email={email} source="login" />
      )}
      {loginMutation.isError && !verificationBlocked && (
        <p className="text-sm text-destructive" role="alert">
          {toUserFacingError(loginMutation.error, t('auth:login.failed'))}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? t('common:actions.signingIn') : t('common:actions.signIn')}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t('auth:login.needAccount')}{' '}
        <Link className="font-medium text-foreground underline" to="/register">
          {t('common:actions.register')}
        </Link>
      </p>
    </form>
  )
}
