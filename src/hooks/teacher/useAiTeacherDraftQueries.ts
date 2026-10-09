import { useQuery } from '@tanstack/react-query'
import { getAiTeacherDraft, getAiTeacherDrafts } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useAiTeacherDraftsQuery() {
  return useQuery({
    queryKey: teacherQueryKeys.aiTeacherDrafts(),
    queryFn: getAiTeacherDrafts,
  })
}

export function useAiTeacherDraftQuery(draftId: string | undefined) {
  return useQuery({
    queryKey: teacherQueryKeys.aiTeacherDraft(draftId ?? ''),
    queryFn: () => getAiTeacherDraft(draftId ?? ''),
    enabled: Boolean(draftId),
  })
}
