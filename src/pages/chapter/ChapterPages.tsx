/* A knowledge point's chapter and its lessons (#13 point 1; built in #50). */
import { useParams } from 'react-router-dom'
import { ChapterView } from '@/features/chapter/ChapterView'
import { LessonStage, StarQuizStage } from '@/features/chapter/LessonStage'

/** `/chapter/:unitId`: the chapter of a knowledge point, its lessons in order. */
export function ChapterPage() {
  const { unitId } = useParams()
  return <ChapterView unitId={unitId} />
}

/** `/chapter/:unitId/:lessonId`: the practice stage, with Ask beside it. */
export function LessonStagePage() {
  const { unitId, lessonId } = useParams()
  return <LessonStage unitId={unitId} lessonId={lessonId} />
}

/** `/star-quiz/:unitId`: the star quiz of a knowledge point (#486). */
export function StarQuizPage() {
  const { unitId } = useParams()
  return <StarQuizStage unitId={unitId} />
}
