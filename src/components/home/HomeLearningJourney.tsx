import { BookOpenCheck, GraduationCap, MessageCircle, PanelsTopLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const layerIcons = [BookOpenCheck, MessageCircle, GraduationCap, PanelsTopLeft]

export function HomeLearningJourney() {
  const { t } = useTranslation('home')
  const layers = t('journey.layers', { returnObjects: true }) as Array<{
    title: string
    detail: string
  }>

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
      <div className="rounded-lg border border-border/70 bg-card/78 p-6">
        <p className="brand-section-kicker">{t('journey.eyebrow')}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {layers.map((layer, index) => {
            const Icon = layerIcons[index] ?? BookOpenCheck

            return (
              <article key={layer.title} className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold">{layer.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{layer.detail}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
