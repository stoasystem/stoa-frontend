import { useQuery } from '@tanstack/react-query'
import { getTeacherAssistanceSummary } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useTeacherAssistanceSummaryQuery(questionId: string | undefined) {
  return useQuery({
    queryKey: teacherQueryKeys.assistanceSummary(questionId ?? ''),
    queryFn: () => getTeacherAssistanceSummary(questionId ?? ''),
    enabled: Boolean(questionId),
  })
}
