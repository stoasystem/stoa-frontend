import { LessonNode } from '@/components/practice/LessonNode'
import type { LearningUnit } from '@/types/practice'

export function LearningUnitCard({ unit }: { unit: LearningUnit }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 border-l-2 border-primary/30 pl-4">
        <p className="brand-section-kicker">Unit {unit.order}</p>
        <h2 className="text-2xl font-semibold">{unit.title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{unit.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {unit.lessons.map((lesson) => (
          <LessonNode key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </section>
  )
}
