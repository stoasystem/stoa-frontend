import { useTranslation } from 'react-i18next'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'

type LearningBeat = {
  title: string
  body: string
}

export function HomeV2LearningThread() {
  const { t } = useTranslation('homeV2')
  const beats = t('learningThread.beats', { returnObjects: true }) as LearningBeat[]

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
      <div className="max-w-xl">
        <p className="stoa-type-label text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--stoa-brand-burgundy))]">
          {t('learningThread.eyebrow')}
        </p>
        <h2 className="stoa-type-heading mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          {t('learningThread.title')}
        </h2>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{t('learningThread.subtitle')}</p>
      </div>

      <div className="grid gap-4">
        {beats.map((beat, index) => (
          <HomeV2VisualFrame key={beat.title} label={`0${index + 1}`}>
            <div className="grid gap-2 p-6 sm:grid-cols-[8rem_1fr] sm:items-center">
              <p className="stoa-type-display text-5xl font-semibold text-[hsl(var(--stoa-brand-burgundy)/0.22)]">
                0{index + 1}
              </p>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{beat.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{beat.body}</p>
              </div>
            </div>
          </HomeV2VisualFrame>
        ))}
      </div>
    </section>
  )
}
