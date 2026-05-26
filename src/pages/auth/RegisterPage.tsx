import { useTranslation } from 'react-i18next'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthLayout } from '@/layouts/AuthLayout'

export function RegisterPage() {
  const { t } = useTranslation('auth')

  return (
    <AuthLayout>
      <section className="brand-rule rounded-lg border border-border/70 bg-card/90 p-6 shadow-[var(--platform-shadow-soft)] md:p-8">
        <div className="max-w-2xl">
          <p className="brand-section-kicker">
            {t('register.eyebrow')}
          </p>
          <h1 className="editorial-heading editorial-title-shell mt-5 text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            {t('register.title')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('register.subtitle')}
          </p>
        </div>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </section>
    </AuthLayout>
  )
}
