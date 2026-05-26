import { useTranslation } from 'react-i18next'

const studyMaterialsImageUrl = new URL('../../../img/study-materials.jpeg', import.meta.url).href

export function HomeTrustSection() {
  const { t } = useTranslation('home')
  const notes = t('trust.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <div className="grid gap-8 border-y border-border/70 py-10 lg:grid-cols-[1fr_0.72fr] lg:items-center">
        <div className="grid gap-6 md:grid-cols-3">
          {notes.map((note) => (
            <div key={note.title}>
              <h3 className="text-lg font-semibold text-foreground">{note.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.description}</p>
            </div>
          ))}
        </div>
        <div className="brand-image-panel relative min-h-64 overflow-hidden rounded-[1.25rem] border border-border/70">
          <img
            src={studyMaterialsImageUrl}
            alt="Notebook and study materials on a desk"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="brand-image-overlay absolute inset-0" />
          <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-white/88 p-4 text-[hsl(var(--stoa-brand-ink))] backdrop-blur">
            <p className="brand-section-kicker">
              Homework rhythm
            </p>
            <p className="mt-2 text-sm leading-6">
              A focused place for questions, explanations, tutor follow-up, and parent-ready
              learning signals.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
