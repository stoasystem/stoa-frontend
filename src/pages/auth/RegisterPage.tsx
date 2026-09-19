import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/layouts/AuthLayout'

export function RegisterPage() {
  const { t } = useTranslation('auth')

  return (
    <AuthLayout>
      <section className="brand-rule rounded-lg border border-border/70 bg-card/90 p-6 shadow-[var(--platform-shadow-soft)] md:p-8">
        <div className="max-w-2xl">
          <p className="brand-section-kicker">{t('register.closed.eyebrow')}</p>
          <h1 className="editorial-heading editorial-title-shell mt-5 text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            {t('register.closed.title')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('register.closed.body')}
          </p>
          <ul className="mt-5 space-y-2 text-sm leading-6 text-muted-foreground">
            <li>{t('register.closed.studentParent')}</li>
            <li>{t('register.closed.teacher')}</li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {t('register.closed.contact')}{' '}
            <a
              className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
              href="mailto:info@stoaedu.ch"
            >
              info@stoaedu.ch
            </a>
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild className="premium-button-lift rounded-full">
            <Link to="/login">{t('register.closed.signInCta')}</Link>
          </Button>
          <Link
            className="text-sm text-muted-foreground underline hover:text-foreground"
            to="/support"
          >
            {t('register.closed.supportCta')}
          </Link>
        </div>
      </section>
    </AuthLayout>
  )
}
