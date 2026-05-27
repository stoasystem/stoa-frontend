import { useMemo, useState } from 'react'
import { ContinueNextLessonCard } from '@/components/practice/ContinueNextLessonCard'
import { RoadmapProgressHeader } from '@/components/practice/RoadmapProgressHeader'
import { RoadmapUnitSection } from '@/components/practice/RoadmapUnitSection'
import type { PracticeRoadmap as PracticeRoadmapData, PracticeRoadmapLesson } from '@/types/practice'

export function PracticeRoadmap({
  roadmap,
  onLessonClick,
}: {
  roadmap: PracticeRoadmapData
  onLessonClick: (lesson: PracticeRoadmapLesson) => void
}) {
  const [activeLockedLessonId, setActiveLockedLessonId] = useState<string>()
  const currentLesson = useMemo(
    () => roadmap.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.id === roadmap.currentLessonId),
    [roadmap],
  )

  function handleLessonClick(lesson: PracticeRoadmapLesson) {
    if (lesson.status === 'locked') {
      setActiveLockedLessonId((current) => (current === lesson.id ? undefined : lesson.id))
      return
    }

    setActiveLockedLessonId(undefined)
    onLessonClick(lesson)
  }

  return (
    <div className="space-y-8">
      <RoadmapProgressHeader roadmap={roadmap} />
      {currentLesson && (
        <ContinueNextLessonCard
          lesson={currentLesson}
          onContinue={() => onLessonClick(currentLesson)}
        />
      )}
      <div className="space-y-12">
        {roadmap.units.map((unit) => (
          <RoadmapUnitSection
            activeLockedLessonId={activeLockedLessonId}
            key={unit.id}
            onLessonClick={handleLessonClick}
            unit={unit}
          />
        ))}
      </div>
    </div>
  )
}
