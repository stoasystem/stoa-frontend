import { useMutation } from '@tanstack/react-query'
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

export function useCreateAiTeacherSummaryDraftMutation() {
  return useMutation({
    mutationFn: createAiTeacherSummaryDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_summary_draft_created', { draftId: draft.draftId, questionId: draft.questionId })
      toast.success(i18n.t('teacher:toasts.summaryCreated'))
    },
    onError: () => toast.error(i18n.t('teacher:toasts.summaryFailed')),
  })
}

export function useCreateAiTeacherExerciseDraftMutation() {
  return useMutation({
    mutationFn: createAiTeacherExerciseDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_exercise_draft_created', { draftId: draft.draftId, studentId: draft.studentId })
      toast.success(i18n.t('teacher:toasts.exerciseCreated'))
    },
    onError: () => toast.error(i18n.t('teacher:toasts.exerciseFailed')),
  })
}

export function useRegenerateAiTeacherDraftMutation() {
  return useMutation({
    mutationFn: regenerateAiTeacherDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_draft_regenerated', { draftId: draft.draftId, previousDraftId: draft.previousDraftId })
      toast.success(i18n.t('teacher:toasts.regenerated'))
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
  return useMutation({
    mutationFn,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_draft_reviewed', { draftId: draft.draftId, status: draft.status })
      toast.success(i18n.t(`teacher:toasts.reviewed.${status}`))
    },
    onError: () => toast.error(i18n.t(`teacher:toasts.reviewFailed.${status}`)),
  })
}
