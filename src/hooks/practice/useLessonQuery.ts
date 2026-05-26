import { useQuery } from '@tanstack/react-query'
import { getPracticeLesson } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useLessonQuery(lessonId: string | undefined) {
  return useQuery({
    queryKey: practiceQueryKeys.lesson(lessonId ?? ''),
    queryFn: () => getPracticeLesson(lessonId ?? ''),
    enabled: Boolean(lessonId),
  })
}
