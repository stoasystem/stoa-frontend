import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getSubjectPath } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useSubjectPathQuery(subjectId: string | undefined, topicId: string | undefined) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: practiceQueryKeys.subjectPath(subjectId ?? '', topicId ?? '', i18n.language),
    queryFn: () => getSubjectPath(subjectId ?? '', topicId),
    enabled: Boolean(subjectId),
  })
}
