import { ArrowRight, MessageSquareText, Route } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HomePracticeToChatFlow } from '@/components/home/HomePracticeToChatFlow'
import { Button } from '@/components/ui/button'
import { getStartPracticePath } from '@/lib/navigation'
import { useAuthStore } from '@/store/authStore'

export function HomePracticeEntry() {
  const { t } = useTranslation('home')
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const startPracticePath = getStartPracticePath(isAuthenticated ? user : null)
  const signals = t('practiceEntry.signals', { returnObjects: true }) as Array<{
    title: string
    body: string
  }>

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <div className="grid gap-8 rounded-lg border border-border/70 bg-[hsl(var(--stoa-brand-warm-grey))] p-6 shadow-[var(--platform-shadow-soft)] lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:p-8">
        <div className="min-w-0">
          <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
            {t('practiceEntry.eyebrow')}
          </p>
          <h2 className="editorial-heading editorial-title-shell mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {t('practiceEntry.title')}
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground">
            {t('practiceEntry.body')}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="premium-primary-button">
              <Link to={startPracticePath}>
                {t('practiceEntry.primaryCta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/how-it-works">
                {t('practiceEntry.secondaryCta')}
              </Link>
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PracticeSignal
              icon={Route}
              title={signals[0]?.title ?? ''}
              body={signals[0]?.body ?? ''}
            />
            <PracticeSignal
              icon={MessageSquareText}
              title={signals[1]?.title ?? ''}
              body={signals[1]?.body ?? ''}
            />
          </div>
          <HomePracticeToChatFlow />
        </div>
      </div>
    </section>
  )
}

function PracticeSignal({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Route
  title: string
  body: string
}) {
  return (
    <div className="rounded-lg border border-primary/15 bg-card/90 p-4">
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}
