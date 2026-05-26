import { CheckCircle2, Lock, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { PracticeLesson } from '@/types/practice'

export function LessonNode({ lesson }: { lesson: PracticeLesson }) {
  const locked = lesson.status === 'locked'
  const completed = lesson.status === 'completed'
  const Icon = locked ? Lock : completed ? CheckCircle2 : PlayCircle

  const content = (
    <div
      className={cn(
        'min-h-[7rem] rounded-lg border p-4 transition-all',
        locked
          ? 'border-border/70 bg-muted/40 text-muted-foreground'
          : 'border-primary/15 bg-card/95 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--platform-shadow-soft)]',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-md p-2',
            locked ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {lesson.difficulty} · {lesson.estimatedMinutes} min
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{lesson.topic}</p>
        </div>
      </div>
    </div>
  )

  if (locked) return content

  return (
    <Link aria-label={`Open ${lesson.title}`} to={`/practice/${lesson.subjectId}/lessons/${lesson.id}`}>
      {content}
    </Link>
  )
}
