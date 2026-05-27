import { BookOpenCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { PracticeRoadmap } from '@/types/practice'

export function RoadmapProgressHeader({
  roadmap,
  className,
}: {
  roadmap: PracticeRoadmap
  className?: string
}) {
  const { t } = useTranslation('practice')

  return (
    <section className={cn('rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]', className)}>
      <div className="grid gap-5 lg:grid-cols-[1fr_16rem] lg:items-center">
        <div>
          <p className="brand-section-kicker">{t('roadmap.title')}</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">{roadmap.topic.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {roadmap.topic.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1">{formatRoadmapLabel(roadmap.subjectId)}</span>
            <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1">{formatRoadmapLabel(roadmap.gradeLevel)}</span>
            <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1">{roadmap.topic.title}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            {t('roadmap.progress')}
          </div>
          <p className="mt-3 text-3xl font-semibold">{roadmap.progress}%</p>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${roadmap.progress}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function formatRoadmapLabel(value: string) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}
