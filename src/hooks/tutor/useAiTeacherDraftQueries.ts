import { useQuery } from '@tanstack/react-query'
import { getAiTeacherDraft, getAiTeacherDrafts } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useAiTeacherDraftsQuery() {
  return useQuery({
    queryKey: tutorQueryKeys.aiTeacherDrafts(),
    queryFn: getAiTeacherDrafts,
  })
}

export function useAiTeacherDraftQuery(draftId: string | undefined) {
  return useQuery({
    queryKey: tutorQueryKeys.aiTeacherDraft(draftId ?? ''),
    queryFn: () => getAiTeacherDraft(draftId ?? ''),
    enabled: Boolean(draftId),
  })
}
