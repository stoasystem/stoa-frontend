import { LessonNode } from '@/components/practice/LessonNode'
import type { LearningUnit } from '@/types/practice'

export function LearningUnitCard({ unit }: { unit: LearningUnit }) {
  return (
    <section className="space-y-4 rounded-lg border border-primary/10 bg-card/55 p-4">
      <div className="flex flex-col gap-3 border-l-2 border-primary/30 pl-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="brand-section-kicker">Unit {unit.order}</p>
          <h2 className="mt-1 text-2xl font-semibold">{unit.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{unit.description}</p>
        </div>
        <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2 text-sm">
          <span className="font-semibold text-foreground">{unit.lessons.length}</span>{' '}
          <span className="text-muted-foreground">short lessons</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {unit.lessons.map((lesson) => (
          <LessonNode key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </section>
  )
}
