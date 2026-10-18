import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { trackEvent } from '@/services/analytics/analyticsClient'
import {
  acceptAiTeacherDraft,
  archiveAiTeacherDraft,
  createAiTeacherExerciseDraft,
  createAiTeacherSummaryDraft,
  regenerateAiTeacherDraft,
  rejectAiTeacherDraft,
} from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useCreateAiTeacherSummaryDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAiTeacherSummaryDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_summary_draft_created', { draftId: draft.draftId, questionId: draft.questionId })
      toast.success(i18n.t('teacher:toasts.summaryCreated'))
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.aiTeacherDrafts() })
    },
    onError: () => toast.error(i18n.t('teacher:toasts.summaryFailed')),
  })
}

export function useCreateAiTeacherExerciseDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAiTeacherExerciseDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_exercise_draft_created', { draftId: draft.draftId, studentId: draft.studentId })
      toast.success(i18n.t('teacher:toasts.exerciseCreated'))
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.aiTeacherDrafts() })
    },
    onError: () => toast.error(i18n.t('teacher:toasts.exerciseFailed')),
  })
}

export function useRegenerateAiTeacherDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateAiTeacherDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_draft_regenerated', { draftId: draft.draftId, previousDraftId: draft.previousDraftId })
      toast.success(i18n.t('teacher:toasts.regenerated'))
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.aiTeacherDrafts() })
    },
    onError: () => toast.error(i18n.t('teacher:toasts.regenerateFailed')),
  })
}

export function useAcceptAiTeacherDraftMutation() {
  return useReviewMutation(acceptAiTeacherDraft, 'accepted')
}

export function useRejectAiTeacherDraftMutation() {
  return useReviewMutation(rejectAiTeacherDraft, 'rejected')
}

export function useArchiveAiTeacherDraftMutation() {
  return useReviewMutation(archiveAiTeacherDraft, 'archived')
}

function useReviewMutation(
  mutationFn: typeof acceptAiTeacherDraft,
  status: 'accepted' | 'rejected' | 'archived',
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_draft_reviewed', { draftId: draft.draftId, status: draft.status })
      toast.success(i18n.t(`teacher:toasts.reviewed.${status}`))
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.aiTeacherDrafts() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.aiTeacherDraft(draft.draftId) })
    },
    onError: () => toast.error(i18n.t(`teacher:toasts.reviewFailed.${status}`)),
  })
}
