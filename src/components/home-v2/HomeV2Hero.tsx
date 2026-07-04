import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HomeV2Cta } from '@/components/home-v2/HomeV2Cta'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

const heroImageUrl = new URL('../../../img/home-v2/preview/hero-family-study-table-preview.jpg', import.meta.url).href
const deskImageUrl = new URL('../../../img/home-v2/preview/study-desk-writing-preview.jpg', import.meta.url).href

export function HomeV2Hero({ learningHref }: { learningHref: string }) {
  const { t } = useTranslation('homeV2')
  const proofItems = t('hero.proofItems', { returnObjects: true }) as string[]

  return (
    <section
      id="home-v2-hero"
      data-testid="home-v2-hero"
      className="mx-auto grid min-h-[100dvh] w-full max-w-7xl gap-12 px-4 pb-14 pt-32 sm:px-6 md:px-8 md:pb-20 md:pt-36 lg:grid-cols-[0.86fr_1.14fr] lg:items-center"
    >
      <HomeV2Reveal className="min-w-0">
        <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-burgundy)/0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-burgundy))] ring-1 ring-[hsl(var(--home-v2-burgundy)/0.14)]">
          {t('hero.eyebrow')}
        </p>
        <h1 className="home-v2-display mt-7 max-w-5xl text-[4.35rem] font-medium leading-[0.84] text-[hsl(var(--home-v2-ink))] sm:text-[5.8rem] lg:text-[6.55rem] xl:text-[7.05rem]">
          {t('hero.title')}
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.66)] sm:text-xl">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <HomeV2Cta to={learningHref}>{t('hero.primaryCta')}</HomeV2Cta>
          <Link
            to="/how-it-works"
            className="home-v2-magnetic inline-flex min-h-14 items-center justify-center rounded-full bg-[hsl(var(--home-v2-paper)/0.58)] px-6 py-3 text-sm font-semibold text-[hsl(var(--home-v2-ink)/0.76)] ring-1 ring-[hsl(var(--home-v2-line)/0.55)] hover:text-[hsl(var(--home-v2-burgundy))]"
          >
            {t('hero.secondaryCta')}
          </Link>
        </div>
      </HomeV2Reveal>

      <HomeV2Reveal delay={160}>
        <div className="grid gap-5 md:relative md:block md:min-h-[40rem] lg:min-h-[46rem]">
          <HomeV2VisualFrame className="relative w-full md:absolute md:right-0 md:top-0 md:w-[82%] md:rotate-[1.8deg]" contentClassName="aspect-[4/5]">
            <img
              src={heroImageUrl}
              alt=""
              className="home-v2-image-tone h-full w-full object-cover"
            />
          </HomeV2VisualFrame>

          <HomeV2VisualFrame className="relative w-full md:absolute md:left-0 md:top-24 md:w-[47%] md:-rotate-[3deg]" label={t('hero.proofLabel')} contentClassName="aspect-[3/4]">
            <div className="grid h-full content-between p-5">
              <div>
                <p className="home-v2-display text-5xl leading-none text-[hsl(var(--home-v2-burgundy))]">01</p>
                <p className="mt-5 text-sm font-semibold leading-5 text-[hsl(var(--home-v2-ink))]">{t('hero.visualTitle')}</p>
              </div>
              <p className="max-w-[12rem] text-xs leading-5 text-[hsl(var(--home-v2-ink)/0.58)]">{t('hero.visualBody')}</p>
            </div>
          </HomeV2VisualFrame>

          <HomeV2VisualFrame className="relative w-full md:absolute md:bottom-0 md:left-[18%] md:w-[62%] md:rotate-[-1.2deg]" contentClassName="min-h-72">
            <div className="relative min-h-72 overflow-hidden">
              <img src={deskImageUrl} alt="" className="home-v2-image-tone absolute inset-0 h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--home-v2-porcelain)/0.12),hsl(var(--home-v2-ink)/0.66))]" />
              <div className="absolute inset-x-5 bottom-5 grid gap-2">
                {proofItems.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-full bg-[hsl(var(--home-v2-porcelain)/0.88)] px-4 py-3 text-xs font-semibold text-[hsl(var(--home-v2-ink)/0.78)] shadow-[0_12px_28px_hsl(var(--home-v2-ink)/0.14)]">
                    <span className="home-v2-display text-lg text-[hsl(var(--home-v2-burgundy))]">0{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </HomeV2VisualFrame>

          <div className="absolute right-6 top-10 hidden rounded-full bg-[hsl(var(--home-v2-porcelain)/0.86)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--home-v2-ink)/0.54)] shadow-[0_14px_40px_hsl(var(--home-v2-ink)/0.1)] ring-1 ring-white/70 md:block">
            Swiss family rhythm
          </div>
        </div>
      </HomeV2Reveal>
    </section>
  )
}
