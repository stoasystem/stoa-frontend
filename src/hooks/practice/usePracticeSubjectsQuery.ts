import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPracticeSubjects } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeSubjectsQuery() {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: practiceQueryKeys.subjects(i18n.language),
    queryFn: getPracticeSubjects,
  })
}
