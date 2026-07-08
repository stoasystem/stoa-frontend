import { useTranslation } from 'react-i18next'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

const trustImageUrl = new URL('../../../img/home-v2/preview/study-desk-writing-preview.jpg', import.meta.url).href

type TrustPrinciple = {
  title: string
  body: string
}

export function HomeV2TrustLayer() {
  const { t } = useTranslation('homeV2')
  const principles = t('trustLayer.principles', { returnObjects: true }) as TrustPrinciple[]

  return (
    <section
      id="home-v2-trust-layer"
      data-testid="home-v2-trust-layer"
      className="mx-auto max-w-7xl scroll-mt-32 px-4 py-20 sm:px-6 md:scroll-mt-40 md:px-8 md:py-28"
    >
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center xl:gap-16">
        <HomeV2Reveal className="order-2 lg:order-1">
          <HomeV2VisualFrame label={t('trustLayer.visualLabel')} contentClassName="home-v2-trust-frame">
            <div className="home-v2-trust-visual">
              <img src={trustImageUrl} alt="" className="home-v2-image-tone absolute inset-0 h-full w-full object-cover" />
              <div className="home-v2-trust-wash" />
              <div className="home-v2-trust-caption" data-testid="home-v2-trust-caption">
                <span className="home-v2-trust-caption-mark" aria-hidden="true" />
                <p>{t('trustLayer.caption')}</p>
              </div>
            </div>
          </HomeV2VisualFrame>
        </HomeV2Reveal>

        <HomeV2Reveal delay={140} className="order-1 lg:order-2 lg:pl-2">
          <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-gold)/0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-gold))] ring-1 ring-[hsl(var(--home-v2-gold)/0.16)]">
            {t('trustLayer.eyebrow')}
          </p>
          <h2 className="home-v2-display mt-7 max-w-[11ch] text-5xl font-medium leading-[0.9] text-[hsl(var(--home-v2-ink))] sm:text-7xl">
            {t('trustLayer.title')}
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.62)]">{t('trustLayer.body')}</p>

          <div className="home-v2-trust-principles mt-12" data-testid="home-v2-trust-principles">
            {principles.map((principle, index) => (
              <div key={principle.title} className="home-v2-trust-principle">
                <span className="home-v2-trust-principle-number">0{index + 1}</span>
                <div>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="home-v2-trust-footnote mt-10">
            <span aria-hidden="true" />
            <p>{t('trustLayer.footnote')}</p>
          </div>
        </HomeV2Reveal>
      </div>
    </section>
  )
}
