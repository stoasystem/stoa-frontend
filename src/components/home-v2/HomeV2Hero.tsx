import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

export function HomeV2Hero({ learningHref }: { learningHref: string }) {
  const { t } = useTranslation('homeV2')
  const proofItems = t('hero.proofItems', { returnObjects: true }) as string[]

  return (
    <section
      id="home-v2-hero"
      data-testid="home-v2-hero"
      className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-6xl gap-10 px-5 pb-10 pt-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pb-12 lg:pt-16"
    >
      <div className="min-w-0">
        <p className="stoa-type-label text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--stoa-brand-burgundy))]">
          {t('hero.eyebrow')}
        </p>
        <h1 className="stoa-type-display mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
          {t('hero.title')}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {t('hero.subtitle')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="premium-button-lift premium-primary-button min-h-12 rounded-md px-7 py-3 text-base">
            <Link to={learningHref}>
              {t('hero.primaryCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            to="/how-it-works"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-border/80 bg-card/60 px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-[hsl(var(--stoa-brand-burgundy-soft))]"
          >
            {t('hero.secondaryCta')}
          </Link>
        </div>
      </div>

      <HomeV2VisualFrame label={t('hero.proofLabel')} contentClassName="lg:aspect-[4/5]">
        <div className="grid h-full min-h-[28rem] content-between gap-6 p-6">
          <div className="aspect-[4/3] rounded-2xl border border-border/60 bg-[hsl(var(--stoa-brand-warm-grey))] p-6">
            <p className="text-sm font-semibold text-foreground">{t('hero.visualTitle')}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t('hero.visualBody')}</p>
          </div>
          <div className="grid gap-3">
            {proofItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[hsl(var(--accent))]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </HomeV2VisualFrame>
    </section>
  )
}
