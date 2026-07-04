import { useTranslation } from 'react-i18next'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

export function HomeV2ParentConfidence() {
  const { t } = useTranslation('homeV2')
  const points = t('parentConfidence.points', { returnObjects: true }) as string[]

  return (
    <section
      id="home-v2-parent-confidence"
      data-testid="home-v2-parent-confidence"
      className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
    >
      <HomeV2VisualFrame label={t('parentConfidence.visualLabel')} contentClassName="sm:aspect-[5/4]">
        <div className="grid gap-4 p-6">
          {points.map((point) => (
            <div key={point} className="rounded-2xl border border-border/70 bg-background/75 p-5 text-sm leading-6 text-muted-foreground">
              {point}
            </div>
          ))}
        </div>
      </HomeV2VisualFrame>
      <div>
        <p className="stoa-type-label text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--stoa-brand-burgundy))]">
          {t('parentConfidence.eyebrow')}
        </p>
        <h2 className="stoa-type-heading mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          {t('parentConfidence.title')}
        </h2>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{t('parentConfidence.body')}</p>
      </div>
    </section>
  )
}
