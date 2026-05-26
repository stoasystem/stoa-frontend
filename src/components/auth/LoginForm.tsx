import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import { showDemoAccounts } from '@/lib/env'
import { toUserFacingError } from '@/lib/userFacingText'
import { createLoginSchema } from '@/lib/validation'

export function LoginForm() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const loginMutation = useLoginMutation()
  const loginSchema = createLoginSchema(t)

  function fillDemo(emailAddress: string) {
    setEmail(emailAddress)
    setPassword('password123')
    setErrors({})
  }

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
      {showDemoAccounts && (
        <div className="rounded-md border bg-secondary/40 p-3 text-sm">
          <p className="font-medium">{t('auth:login.demoTitle')}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              [t('common:roles.student'), 'student@test.com'],
              [t('common:roles.parent'), 'parent@test.com'],
              [t('common:roles.tutor'), 'tutor@test.com'],
              [t('common:roles.admin'), 'admin@test.com'],
              [t('common:roles.organization_admin'), 'organization@test.com'],
            ].map(([label, demoEmail]) => (
              <Button
                key={demoEmail}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo(demoEmail)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
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
      {loginMutation.isError && (
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
