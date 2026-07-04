import { useTranslation } from 'react-i18next'

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
      className="mx-auto max-w-6xl px-5 py-20 sm:px-6"
    >
      <div className="border-y border-border/70 py-12">
        <div className="max-w-2xl">
          <p className="stoa-type-label text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--stoa-brand-burgundy))]">
            {t('trustLayer.eyebrow')}
          </p>
          <h2 className="stoa-type-heading mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {t('trustLayer.title')}
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{t('trustLayer.body')}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/70 bg-card/60 p-5">
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
