import { GraduationCap, Lightbulb, MessageSquareText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const studentLaptopStudyImageUrl = new URL('../../../img/student-laptop-study.jpeg', import.meta.url).href

const stepIcons = [MessageSquareText, Lightbulb, GraduationCap, Users]

export function HomeLearningFlow() {
  const { t } = useTranslation('home')
  const steps = t('flow.steps', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div className="max-w-2xl">
          <p className="brand-section-kicker">
            {t('flow.eyebrow')}
          </p>
          <h2 className="editorial-heading editorial-title-shell mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {t('flow.title')}
          </h2>
        </div>
        <div className="brand-image-panel relative min-h-64 overflow-hidden rounded-[1.25rem] border border-border/70">
          <img
            src={studentLaptopStudyImageUrl}
            alt="Student using a laptop while studying at a desk"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="brand-image-overlay absolute inset-0" />
          <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/15 bg-white/88 p-4 text-[hsl(var(--stoa-brand-ink))] shadow-2xl backdrop-blur">
            <p className="brand-section-kicker">
              {t('flow.visualLabel')}
            </p>
            <p className="mt-2 text-lg font-semibold leading-6">
              {t('flow.visualText')}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-9 grid gap-4 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = stepIcons[index] ?? MessageSquareText

          return (
            <article
              key={step.title}
              className="group relative overflow-hidden rounded-lg border border-border/70 bg-card/78 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl"
            >
              <span className="text-xs font-semibold text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors group-hover:bg-[hsl(var(--stoa-brand-charcoal))]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
