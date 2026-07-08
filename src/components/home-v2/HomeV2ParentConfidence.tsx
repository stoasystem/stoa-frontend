import { useTranslation } from 'react-i18next'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

const parentImageUrl = new URL('../../../img/home-v2/preview/father-son-laptop-preview.jpg', import.meta.url).href

export function HomeV2ParentConfidence() {
  const { t } = useTranslation('homeV2')

  return (
    <section
      id="home-v2-parent-confidence"
      data-testid="home-v2-parent-confidence"
      className="mx-auto grid max-w-7xl scroll-mt-36 gap-10 px-4 pb-20 pt-16 sm:px-6 md:px-8 md:scroll-mt-40 md:pb-28 md:pt-20 lg:grid-cols-[0.86fr_1.04fr] lg:items-center"
    >
      <HomeV2Reveal className="lg:pr-8">
        <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-burgundy)/0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-burgundy))] ring-1 ring-[hsl(var(--home-v2-burgundy)/0.14)]">
          {t('parentConfidence.eyebrow')}
        </p>
        <h2 className="home-v2-display mt-7 max-w-[12ch] text-5xl font-medium leading-[0.9] text-[hsl(var(--home-v2-ink))] sm:text-7xl">
          {t('parentConfidence.title')}
        </h2>
        <p className="mt-7 max-w-xl text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.62)]">{t('parentConfidence.body')}</p>
      </HomeV2Reveal>

      <HomeV2Reveal delay={140}>
        <HomeV2VisualFrame label={t('parentConfidence.visualLabel')} contentClassName="home-v2-parent-frame">
          <div className="home-v2-parent-visual">
            <img src={parentImageUrl} alt="" className="home-v2-image-tone absolute inset-0 h-full w-full object-cover" />
            <div className="home-v2-parent-wash" />
            <div className="home-v2-parent-note" data-testid="home-v2-parent-note">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--home-v2-burgundy))]">
                    {t('parentConfidence.note.eyebrow')}
                  </p>
                  <p className="home-v2-display mt-4 text-3xl font-medium leading-none text-[hsl(var(--home-v2-ink))]">
                    {t('parentConfidence.note.title')}
                  </p>
                </div>
                <span className="home-v2-parent-note-mark" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm leading-6 text-[hsl(var(--home-v2-ink)/0.64)]">
                {t('parentConfidence.note.body')}
              </p>
            </div>
          </div>
        </HomeV2VisualFrame>
      </HomeV2Reveal>
    </section>
  )
}
