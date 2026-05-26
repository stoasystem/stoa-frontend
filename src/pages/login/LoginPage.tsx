import { useTranslation } from 'react-i18next'
import { CheckCircle2, MessageCircle, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLayout } from '@/layouts/AuthLayout'

const loginStudyImageUrl = new URL('../../../img/login-study.jpeg', import.meta.url).href

const activityItems = [
  {
    labelKey: 'login.activity.studentLabel',
    valueKey: 'login.activity.studentValue',
    Icon: MessageCircle,
  },
  {
    labelKey: 'login.activity.parentLabel',
    valueKey: 'login.activity.parentValue',
    Icon: TrendingUp,
  },
  {
    labelKey: 'login.activity.teacherLabel',
    valueKey: 'login.activity.teacherValue',
    Icon: Users,
  },
]

export function LoginPage() {
  const { t } = useTranslation('auth')

  return (
    <AuthLayout>
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-lg border border-border/70 bg-card/92 shadow-[var(--platform-shadow-soft)] md:grid-cols-[1.02fr_0.98fr]">
        <div className="brand-image-panel relative hidden min-h-[36rem] overflow-hidden md:block">
          <img
            src={loginStudyImageUrl}
            alt="Student working at a desk with a notebook"
            className="absolute inset-0 h-full w-full object-cover opacity-74"
          />
          <div className="brand-image-overlay absolute inset-0" />
          <div className="absolute inset-x-6 bottom-6 rounded-lg border border-white/15 bg-[hsl(var(--stoa-brand-card)_/_0.92)] p-5 text-[hsl(var(--stoa-brand-ink))] shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
                  {t('login.visualEyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight">
                  {t('login.visualTitle')}
                </h2>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {activityItems.map(({ labelKey, valueKey, Icon }) => (
                <div key={labelKey} className="flex items-center gap-3 rounded-md border border-border/70 bg-[hsl(var(--stoa-brand-paper))] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-burgundy-strong))]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t(labelKey)}</p>
                    <p className="truncate text-sm font-semibold text-foreground">{t(valueKey)}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="brand-rule flex min-h-[34rem] flex-col justify-center p-6 sm:p-8">
          <div className="mx-auto w-full max-w-md">
            <p className="brand-section-kicker">
              {t('login.secureEyebrow')}
            </p>
            <h1 className="editorial-heading editorial-title-shell mt-5 text-4xl font-semibold leading-tight">
              {t('login.title')}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t('login.subtitle')}
            </p>
            <div className="mt-7">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  )
}
