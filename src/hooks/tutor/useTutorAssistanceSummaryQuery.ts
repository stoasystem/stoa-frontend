import { useQuery } from '@tanstack/react-query'
import { getTutorAssistanceSummary } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useTutorAssistanceSummaryQuery(questionId: string | undefined) {
  return useQuery({
    queryKey: tutorQueryKeys.assistanceSummary(questionId ?? ''),
    queryFn: () => getTutorAssistanceSummary(questionId ?? ''),
    enabled: Boolean(questionId),
  })
}
