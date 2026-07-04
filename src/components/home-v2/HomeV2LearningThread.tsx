import { useTranslation } from 'react-i18next'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

type LearningBeat = {
  title: string
  body: string
}

export function HomeV2LearningThread() {
  const { t } = useTranslation('homeV2')
  const beats = t('learningThread.beats', { returnObjects: true }) as LearningBeat[]

  return (
    <section
      id="home-v2-learning-thread"
      data-testid="home-v2-learning-thread"
      className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 md:px-8 md:py-32 lg:grid-cols-[0.72fr_1.28fr] lg:items-start"
    >
      <HomeV2Reveal className="max-w-xl lg:sticky lg:top-32">
        <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-sage)/0.09)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-sage))] ring-1 ring-[hsl(var(--home-v2-sage)/0.16)]">
          {t('learningThread.eyebrow')}
        </p>
        <h2 className="home-v2-display mt-7 text-5xl font-medium leading-[0.9] text-[hsl(var(--home-v2-ink))] sm:text-7xl">
          {t('learningThread.title')}
        </h2>
        <p className="mt-7 text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.62)]">{t('learningThread.subtitle')}</p>
      </HomeV2Reveal>

      <div className="grid gap-8 md:grid-cols-6">
        {beats.map((beat, index) => (
          <HomeV2Reveal
            key={beat.title}
            delay={index * 120}
            className={index === 0 || index === 3 ? 'md:col-span-4' : 'md:col-span-3'}
          >
            <HomeV2VisualFrame
              label={`0${index + 1}`}
              className={index === 1 ? 'md:mt-24' : index === 2 ? 'md:-mt-8' : ''}
              contentClassName="min-h-72"
            >
              <div className="grid min-h-72 content-between p-7">
                <div className="flex items-start justify-between gap-6">
                  <p className="home-v2-display text-7xl leading-none text-[hsl(var(--home-v2-burgundy)/0.22)]">
                    0{index + 1}
                  </p>
                  <span className="mt-2 h-2 w-2 rounded-full bg-[hsl(var(--home-v2-gold))]" />
                </div>
                <div>
                  <h3 className="home-v2-display max-w-md text-3xl font-medium leading-none text-[hsl(var(--home-v2-ink))]">{beat.title}</h3>
                  <p className="mt-5 max-w-md text-sm leading-7 text-[hsl(var(--home-v2-ink)/0.6)]">{beat.body}</p>
                </div>
              </div>
            </HomeV2VisualFrame>
          </HomeV2Reveal>
        ))}
      </div>
    </section>
  )
}
