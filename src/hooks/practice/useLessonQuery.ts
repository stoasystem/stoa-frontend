import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPracticeLesson } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useLessonQuery(lessonId: string | undefined) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: practiceQueryKeys.lesson(lessonId ?? '', i18n.language),
    queryFn: () => getPracticeLesson(lessonId ?? ''),
    enabled: Boolean(lessonId),
  })
}
