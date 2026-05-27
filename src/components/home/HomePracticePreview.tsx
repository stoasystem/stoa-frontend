import { BookOpenCheck, CheckCircle2, Lightbulb, ListChecks, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type PracticeSignal = {
  title: string
  body: string
}

type PracticePreviewCopy = {
  label: string
  title: string
  prompt: string
  progress: string
  hint: string
  topicsLabel: string
  topics: string[]
  outcomes: Array<{
    title: string
    detail: string
  }>
}

const outcomeIcons = [BookOpenCheck, ListChecks, CheckCircle2]

export function HomePracticePreview() {
  const { t } = useTranslation('home')
  const signals = t('practiceEntry.signals', { returnObjects: true }) as PracticeSignal[]
  const preview = t('practiceEntry.preview', { returnObjects: true }) as PracticePreviewCopy

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <PracticeSignalCard
          icon={Route}
          title={signals[0]?.title ?? ''}
          body={signals[0]?.body ?? ''}
        />
        <PracticeSignalCard
          icon={Lightbulb}
          title={signals[1]?.title ?? ''}
          body={signals[1]?.body ?? ''}
        />
      </div>

      <div className="rounded-lg border border-border/70 bg-card/90 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {preview.label}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{preview.title}</h3>
            <p className="mt-3 rounded-md border border-primary/15 bg-[hsl(var(--stoa-brand-paper))] px-4 py-3 text-base font-semibold text-foreground">
              {preview.prompt}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{preview.hint}</p>
          </div>
          <div className="shrink-0 rounded-md border border-primary/15 bg-[hsl(var(--stoa-brand-burgundy-soft))] px-4 py-3 text-sm font-semibold text-primary">
            {preview.progress}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">{preview.topicsLabel}</p>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {preview.topics.map((topic, index) => (
              <li
                key={topic}
                className="flex min-w-0 items-start gap-3 rounded-md border border-border/70 bg-background/70 p-3"
                aria-current={index === 0 ? 'step' : undefined}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 text-sm font-medium leading-5 text-foreground">{topic}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {preview.outcomes.map((outcome, index) => {
            const Icon = outcomeIcons[index] ?? BookOpenCheck

            return (
              <div key={outcome.title} className="min-w-0 rounded-md border border-border/70 bg-background/70 p-3">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <h4 className="mt-3 text-sm font-semibold text-foreground">{outcome.title}</h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{outcome.detail}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PracticeSignalCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Route
  title: string
  body: string
}) {
  return (
    <div className="rounded-lg border border-primary/15 bg-card/90 p-4">
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}
