import { useTranslation } from 'react-i18next'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthLayout } from '@/layouts/AuthLayout'

export function RegisterPage() {
  const { t } = useTranslation('auth')

  return (
    <AuthLayout>
      <section className="rounded-xl border border-border/70 bg-card/90 p-6 shadow-xl md:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
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
