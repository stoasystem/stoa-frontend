export function LessonProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div aria-label={`Lesson progress ${current} of ${total}`} className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Progress</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--stoa-brand-burgundy-soft))]">
        <div
          className="h-full rounded-full bg-[hsl(var(--stoa-brand-burgundy))] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
