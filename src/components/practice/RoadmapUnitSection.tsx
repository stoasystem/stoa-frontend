import { RoadmapConnector } from '@/components/practice/RoadmapConnector'
import { RoadmapLessonNode } from '@/components/practice/RoadmapLessonNode'
import { RoadmapUnlockHint } from '@/components/practice/RoadmapUnlockHint'
import { cn } from '@/lib/utils'
import type { PracticeRoadmapLesson, PracticeRoadmapUnit } from '@/types/practice'

export function RoadmapUnitSection({
  unit,
  activeLockedLessonId,
  onLessonClick,
}: {
  unit: PracticeRoadmapUnit
  activeLockedLessonId?: string
  onLessonClick: (lesson: PracticeRoadmapLesson) => void
}) {
  return (
    <section className="space-y-5">
      <div className="border-l-2 border-primary/25 pl-4">
        <p className="brand-section-kicker">Unit {unit.order}</p>
        <h2 className="mt-1 text-2xl font-semibold">{unit.title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{unit.description}</p>
      </div>
      <div className="space-y-0">
        {unit.lessons.map((lesson, index) => {
          const align = getAlignment(index)
          const hintActive = activeLockedLessonId === lesson.id && Boolean(lesson.unlockCondition)

          return (
            <div key={lesson.id}>
              <div
                className={cn(
                  'mx-auto w-full max-w-[24rem]',
                  align === 'left' && 'md:ml-[8%] md:mr-auto',
                  align === 'right' && 'md:ml-auto md:mr-[8%]',
                  align === 'center' && 'md:mx-auto',
                )}
              >
                <RoadmapLessonNode
                  activeHint={hintActive}
                  challengeCount={lesson.challengeCount}
                  estimatedMinutes={lesson.estimatedMinutes}
                  lessonId={lesson.id}
                  onClick={() => onLessonClick(lesson)}
                  order={lesson.order}
                  status={lesson.status}
                  title={lesson.title}
                  unlockCondition={lesson.unlockCondition}
                />
                {hintActive && lesson.unlockCondition && (
                  <div id={`${lesson.id}-unlock-hint`}>
                    <RoadmapUnlockHint condition={lesson.unlockCondition} />
                  </div>
                )}
              </div>
              {index < unit.lessons.length - 1 && <RoadmapConnector align={align} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function getAlignment(index: number) {
  if (index % 3 === 1) return 'right'
  if (index % 3 === 2) return 'left'
  return 'center'
}
