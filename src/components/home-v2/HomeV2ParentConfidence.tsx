import { useTranslation } from 'react-i18next'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

const parentImageUrl = new URL('../../../img/home-v2/preview/father-son-laptop-preview.jpg', import.meta.url).href

export function HomeV2ParentConfidence() {
  const { t } = useTranslation('homeV2')
  const points = t('parentConfidence.points', { returnObjects: true }) as string[]

  return (
    <section
      id="home-v2-parent-confidence"
      data-testid="home-v2-parent-confidence"
      className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 md:px-8 md:py-32 lg:grid-cols-[1.12fr_0.88fr] lg:items-center"
    >
      <HomeV2Reveal>
        <HomeV2VisualFrame label={t('parentConfidence.visualLabel')} contentClassName="min-h-[36rem]">
          <div className="relative min-h-[36rem] overflow-hidden">
            <img src={parentImageUrl} alt="" className="home-v2-image-tone absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--home-v2-ink)/0.64),transparent_56%),linear-gradient(180deg,transparent,hsl(var(--home-v2-ink)/0.58))]" />
            <div className="absolute bottom-6 left-6 right-6 grid gap-3 md:max-w-md">
              {points.map((point, index) => (
                <div key={point} className="rounded-full bg-[hsl(var(--home-v2-porcelain)/0.9)] px-5 py-4 text-sm font-semibold leading-5 text-[hsl(var(--home-v2-ink)/0.76)] shadow-[0_16px_38px_hsl(var(--home-v2-ink)/0.16)]">
                  <span className="mr-3 text-[hsl(var(--home-v2-burgundy))]">0{index + 1}</span>
                  {point}
                </div>
              ))}
            </div>
          </div>
        </HomeV2VisualFrame>
      </HomeV2Reveal>
      <HomeV2Reveal delay={140}>
        <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-burgundy)/0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-burgundy))] ring-1 ring-[hsl(var(--home-v2-burgundy)/0.14)]">
          {t('parentConfidence.eyebrow')}
        </p>
        <h2 className="home-v2-display mt-7 text-5xl font-medium leading-[0.9] text-[hsl(var(--home-v2-ink))] sm:text-7xl">
          {t('parentConfidence.title')}
        </h2>
        <p className="mt-7 text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.62)]">{t('parentConfidence.body')}</p>
      </HomeV2Reveal>
    </section>
  )
}
