import { ArrowRight, Bookmark, Clock, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getQuestionBankSetPath } from '@/lib/questionBankRoutes'
import { cn } from '@/lib/utils'
import type { QuestionBankSet, QuestionSetStatus } from '@/types/questionBank'

export function QuestionSetCard({
  set,
  compact = false,
}: {
  set: QuestionBankSet
  compact?: boolean
}) {
  return (
    <article className="group rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--platform-shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(set.status)}>{getStatusLabel(set.status)}</Badge>
            {set.saved && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/15 bg-[hsl(var(--stoa-brand-burgundy-soft))] px-2 py-0.5 text-xs font-semibold text-primary">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                Saved
              </span>
            )}
          </div>
          <h3 className="mt-3 text-xl font-semibold leading-tight">{set.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{set.description}</p>
        </div>
      </div>
      <div className={cn('mt-4 grid gap-3 text-sm', compact ? 'grid-cols-2' : 'sm:grid-cols-3')}>
        <SetMetric icon={ListChecks} label="Questions" value={`${set.questionCount}`} />
        <SetMetric icon={Clock} label="Time" value={`${set.estimatedMinutes} min`} />
        <SetMetric label="Level" value={set.difficultyRange} />
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{set.progress.answered} / {set.progress.total} answered</span>
          <span>{Math.round((set.progress.answered / set.progress.total) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.round((set.progress.answered / set.progress.total) * 100)}%` }}
          />
        </div>
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {set.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1 text-xs text-muted-foreground">
              {skill}
            </span>
          ))}
        </div>
      )}
      <Button asChild className="mt-5 w-full">
        <Link to={getQuestionBankSetPath(set.id)}>
          {getActionLabel(set.status)}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </article>
  )
}

function SetMetric({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
        {label}
      </div>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function getActionLabel(status: QuestionSetStatus) {
  const labels: Record<QuestionSetStatus, string> = {
    not_started: 'Start',
    in_progress: 'Resume',
    completed: 'Practice Again',
    review_recommended: 'Review',
  }
  return labels[status]
}

function getStatusLabel(status: QuestionSetStatus) {
  const labels: Record<QuestionSetStatus, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    completed: 'Completed',
    review_recommended: 'Review recommended',
  }
  return labels[status]
}

function statusVariant(status: QuestionSetStatus) {
  if (status === 'completed') return 'secondary'
  if (status === 'review_recommended') return 'outline'
  return 'default'
}
