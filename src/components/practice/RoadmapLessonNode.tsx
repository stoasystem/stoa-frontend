import { CheckCircle2, Lock, PlayCircle, RotateCcw, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { RoadmapLessonStatus } from '@/types/practice'

export type RoadmapLessonNodeProps = {
  lessonId: string
  title: string
  status: RoadmapLessonStatus
  order: number
  estimatedMinutes?: number
  challengeCount?: number
  unlockCondition?: string
  activeHint?: boolean
  onClick: () => void
}

export function RoadmapLessonNode({
  lessonId,
  title,
  status,
  order,
  estimatedMinutes,
  challengeCount,
  activeHint,
  onClick,
}: RoadmapLessonNodeProps) {
  const { t } = useTranslation('practice')
  const Icon = getStatusIcon(status)
  const copy = getStatusCopy(status, t)
  const locked = status === 'locked'

  return (
    <button
      aria-describedby={activeHint ? `${lessonId}-unlock-hint` : undefined}
      className={cn(
        'group min-h-[9rem] w-full rounded-lg border p-4 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        status === 'completed' && 'border-emerald-700/20 bg-emerald-50/70 text-foreground',
        status === 'review' && 'border-amber-700/20 bg-amber-50/75 text-foreground',
        status === 'current' && 'border-primary/50 bg-card shadow-[0_18px_45px_rgba(17,24,39,0.10)] ring-1 ring-primary/20',
        status === 'available' && 'border-primary/20 bg-card/95 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[var(--platform-shadow-soft)]',
        locked && 'border-border/70 bg-muted/45 text-muted-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-sm font-semibold',
              status === 'completed' && 'border-emerald-700/20 bg-emerald-100 text-emerald-900',
              status === 'review' && 'border-amber-700/20 bg-amber-100 text-amber-900',
              status === 'current' && 'border-primary/30 bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary',
              status === 'available' && 'border-primary/20 bg-[hsl(var(--platform-surface-app))] text-primary',
              locked && 'border-border bg-muted text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {copy.label} · Lesson {order}
            </p>
            <h3 className="mt-1 break-words text-base font-semibold leading-6 text-foreground">{title}</h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {estimatedMinutes ? `${estimatedMinutes} min` : 'Short lesson'}
            {typeof challengeCount === 'number' ? ` · ${challengeCount} checks` : ''}
          </p>
          <span
            className={cn(
              'inline-flex min-h-8 items-center justify-center rounded-md border px-3 py-1 text-center text-xs font-semibold leading-4',
              status === 'current'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-foreground',
            )}
          >
            {copy.action}
          </span>
        </div>
      </div>
    </button>
  )
}

function getStatusIcon(status: RoadmapLessonStatus) {
  if (status === 'completed') return CheckCircle2
  if (status === 'current') return Sparkles
  if (status === 'locked') return Lock
  if (status === 'review') return RotateCcw
  return PlayCircle
}

function getStatusCopy(
  status: RoadmapLessonStatus,
  t: (key: string) => string,
) {
  if (status === 'completed') {
    return { label: t('roadmap.completed'), action: t('roadmap.review') }
  }

  if (status === 'current') {
    return { label: t('roadmap.currentLesson'), action: t('roadmap.continue') }
  }

  if (status === 'locked') {
    return { label: t('roadmap.locked'), action: t('roadmap.unlockHintAction') }
  }

  if (status === 'review') {
    return { label: t('roadmap.review'), action: t('roadmap.review') }
  }

  return { label: t('roadmap.available'), action: t('roadmap.start') }
}
