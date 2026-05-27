import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PracticeRoadmapLesson } from '@/types/practice'

export function ContinueNextLessonCard({
  lesson,
  onContinue,
}: {
  lesson: PracticeRoadmapLesson
  onContinue: () => void
}) {
  return (
    <section className="rounded-lg border border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--platform-surface-app))_100%)] p-5 shadow-[var(--platform-shadow-soft)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="brand-section-kicker">Current lesson</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">{lesson.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Practise first. Ask for an explanation when needed.
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
            Learning Chat can explain unclear steps during the lesson.
          </div>
        </div>
        <Button className="w-full md:w-auto" onClick={onContinue} type="button">
          Continue lesson
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
