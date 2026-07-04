import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function HomeV2FinalCta({ learningHref }: { learningHref: string }) {
  const { t } = useTranslation('homeV2')

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <div className="rounded-[2rem] border border-border/70 bg-[hsl(var(--stoa-brand-charcoal))] px-6 py-12 text-[hsl(var(--stoa-brand-paper))] sm:px-10 lg:px-14">
        <p className="stoa-type-label text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--stoa-brand-gold))]">
          {t('finalCta.eyebrow')}
        </p>
        <h2 className="stoa-type-display mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          {t('finalCta.title')}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[hsl(var(--stoa-brand-paper)/0.72)]">{t('finalCta.body')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-h-12 rounded-md bg-[hsl(var(--stoa-brand-paper))] px-7 py-3 text-base text-[hsl(var(--stoa-brand-charcoal))] hover:bg-white">
            <Link to={learningHref}>
              {t('finalCta.primaryCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            to="/for-parents"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[hsl(var(--stoa-brand-paper)/0.24)] px-6 py-3 text-center text-sm font-semibold text-[hsl(var(--stoa-brand-paper))] transition-colors hover:bg-[hsl(var(--stoa-brand-paper)/0.1)]"
          >
            {t('finalCta.secondaryCta')}
          </Link>
        </div>
      </div>
    </section>
  )
}
