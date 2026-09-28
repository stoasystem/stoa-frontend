/* A knowledge point's chapter and its lessons (#13 point 1). Placeholders
 * until the chapter slices fill them. */
import { RoutePlaceholder, type RoutePlaceholderProps } from '@/components/common/RoutePlaceholder'

/** `/chapter/:unitId`: the chapter of a knowledge point. */
export function ChapterPage(props: RoutePlaceholderProps) {
  return <RoutePlaceholder {...props} />
}

/** `/chapter/:unitId/:lessonId`: the practice stage, with Ask beside it. */
export function LessonStagePage(props: RoutePlaceholderProps) {
  return <RoutePlaceholder {...props} />
}
