import { useTranslation } from 'react-i18next'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

type TrustItem = {
  title: string
  body: string
}

export function HomeV2TrustLayer() {
  const { t } = useTranslation('homeV2')
  const items = t('trustLayer.items', { returnObjects: true }) as TrustItem[]

  return (
    <section
      id="home-v2-trust-layer"
      data-testid="home-v2-trust-layer"
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:px-8 md:py-32"
    >
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <HomeV2Reveal className="max-w-2xl">
          <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-gold)/0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-gold))] ring-1 ring-[hsl(var(--home-v2-gold)/0.16)]">
            {t('trustLayer.eyebrow')}
          </p>
          <h2 className="home-v2-display mt-7 text-5xl font-medium leading-[0.9] text-[hsl(var(--home-v2-ink))] sm:text-7xl">
            {t('trustLayer.title')}
          </h2>
          <p className="mt-7 text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.62)]">{t('trustLayer.body')}</p>
        </HomeV2Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <HomeV2Reveal key={item.title} className={item.title === items[0]?.title ? 'md:col-span-2' : ''}>
              <HomeV2VisualFrame contentClassName="min-h-56">
                <div className="grid min-h-56 content-between p-7">
                  <div className="h-px w-20 bg-[hsl(var(--home-v2-burgundy)/0.36)]" />
                  <div>
                    <h3 className="home-v2-display text-3xl font-medium leading-none text-[hsl(var(--home-v2-ink))]">{item.title}</h3>
                    <p className="mt-4 max-w-lg text-sm leading-7 text-[hsl(var(--home-v2-ink)/0.6)]">{item.body}</p>
                  </div>
                </div>
              </HomeV2VisualFrame>
            </HomeV2Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
