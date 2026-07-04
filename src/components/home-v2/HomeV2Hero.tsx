import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HomeV2Cta } from '@/components/home-v2/HomeV2Cta'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

const heroImageUrl = new URL('../../../img/home-v2/preview/hero-family-study-table-preview.jpg', import.meta.url).href

export function HomeV2Hero({ learningHref }: { learningHref: string }) {
  const { t } = useTranslation('homeV2')

  return (
    <section
      id="home-v2-hero"
      data-testid="home-v2-hero"
      className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 md:px-8 md:pb-20 md:pt-36 lg:min-h-[100dvh] lg:grid-cols-[0.86fr_1.04fr] lg:items-center"
    >
      <HomeV2Reveal className="min-w-0">
        <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-burgundy)/0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-burgundy))] ring-1 ring-[hsl(var(--home-v2-burgundy)/0.14)]">
          {t('hero.eyebrow')}
        </p>
        <h1 className="home-v2-display mt-7 max-w-xl text-[4.7rem] font-medium leading-[0.86] text-[hsl(var(--home-v2-ink))] sm:text-[6.4rem] lg:text-[7.6rem]">
          {t('hero.title')}
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.66)] sm:text-xl">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <HomeV2Cta to={learningHref}>{t('hero.primaryCta')}</HomeV2Cta>
          <Link
            to="/for-parents"
            className="home-v2-magnetic inline-flex min-h-14 items-center justify-center rounded-full bg-[hsl(var(--home-v2-paper)/0.58)] px-6 py-3 text-sm font-semibold text-[hsl(var(--home-v2-ink)/0.76)] ring-1 ring-[hsl(var(--home-v2-line)/0.55)] hover:text-[hsl(var(--home-v2-burgundy))]"
          >
            {t('hero.secondaryCta')}
          </Link>
        </div>
      </HomeV2Reveal>

      <HomeV2Reveal delay={160}>
        <HomeV2VisualFrame contentClassName="aspect-[4/5] md:aspect-[5/6] lg:aspect-[6/7]">
          <div className="relative h-full min-h-[30rem] overflow-hidden">
            <img
              src={heroImageUrl}
              alt=""
              className="home-v2-image-tone h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,hsl(var(--home-v2-ink)/0.18))]" />
            <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] bg-[hsl(var(--home-v2-porcelain)/0.9)] p-5 shadow-[0_18px_46px_hsl(var(--home-v2-ink)/0.16)] ring-1 ring-white/70 md:bottom-7 md:left-7 md:right-auto md:max-w-sm md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--home-v2-burgundy))]">
                {t('hero.proofLabel')}
              </p>
              <p className="home-v2-display mt-4 text-3xl font-medium leading-none text-[hsl(var(--home-v2-ink))]">
                {t('hero.proofTitle')}
              </p>
              <p className="mt-4 text-sm leading-6 text-[hsl(var(--home-v2-ink)/0.62)]">
                {t('hero.proofBody')}
              </p>
            </div>
          </div>
        </HomeV2VisualFrame>
      </HomeV2Reveal>
    </section>
  )
}
