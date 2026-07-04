import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HomeV2Cta } from '@/components/home-v2/HomeV2Cta'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'

export function HomeV2FinalCta({ learningHref }: { learningHref: string }) {
  const { t } = useTranslation('homeV2')

  return (
    <section
      id="home-v2-final-cta"
      data-testid="home-v2-final-cta"
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:px-8 md:py-36"
    >
      <HomeV2Reveal>
        <div className="rounded-[2.5rem] bg-[hsl(var(--home-v2-ink)/0.06)] p-2 shadow-[0_42px_120px_hsl(var(--home-v2-ink)/0.2)] ring-1 ring-[hsl(var(--home-v2-line)/0.52)]">
          <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[hsl(var(--home-v2-espresso))] px-7 py-14 text-[hsl(var(--home-v2-paper))] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12)] sm:px-12 lg:px-16 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.54fr] lg:items-end">
              <div>
                <p className="inline-flex rounded-full bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-gold))] ring-1 ring-white/12">
                  {t('finalCta.eyebrow')}
                </p>
                <h2 className="home-v2-display mt-7 max-w-4xl text-5xl font-medium leading-[0.9] sm:text-7xl">
                  {t('finalCta.title')}
                </h2>
                <p className="mt-7 max-w-2xl text-base leading-8 text-[hsl(var(--home-v2-paper)/0.68)]">{t('finalCta.body')}</p>
              </div>
              <div className="flex flex-col gap-4 lg:items-start">
                <HomeV2Cta to={learningHref} tone="light">{t('finalCta.primaryCta')}</HomeV2Cta>
                <Link
                  to="/for-parents"
                  className="home-v2-magnetic inline-flex min-h-14 w-max items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-[hsl(var(--home-v2-paper)/0.82)] ring-1 ring-[hsl(var(--home-v2-paper)/0.18)] hover:bg-white/8"
                >
                  {t('finalCta.secondaryCta')}
                </Link>
              </div>
            </div>
            <div className="mt-16 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--home-v2-paper)/0.28),transparent)]" />
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-paper)/0.42)]">
              Zurich rhythm / teacher-backed learning / parent clarity
            </p>
          </div>
        </div>
      </HomeV2Reveal>
    </section>
  )
}
