import { ArrowRight, BookOpenCheck, GraduationCap, Lightbulb, MessageCircle, PanelsTopLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const stepIcons = [BookOpenCheck, Lightbulb, MessageCircle, GraduationCap, PanelsTopLeft]

export function HomePracticeToChatFlow() {
  const { t } = useTranslation('home')
  const steps = t('practiceEntry.flow', { returnObjects: true }) as Array<{
    label: string
    detail: string
  }>

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {steps.map((step, index) => {
        const Icon = stepIcons[index] ?? BookOpenCheck
        const isLast = index === steps.length - 1

        return (
          <div key={step.label} className="relative rounded-lg border border-border/70 bg-card/82 p-4">
            {!isLast && (
              <ArrowRight
                aria-hidden="true"
                className="absolute -right-4 top-8 z-10 hidden h-5 w-5 text-primary/55 lg:block"
              />
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-1 text-base font-semibold text-foreground">{step.label}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
          </div>
        )
      })}
    </div>
  )
}
