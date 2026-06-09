import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import {
  acceptAiTeacherDraft,
  archiveAiTeacherDraft,
  createAiTeacherExerciseDraft,
  createAiTeacherSummaryDraft,
  regenerateAiTeacherDraft,
  rejectAiTeacherDraft,
} from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useCreateAiTeacherSummaryDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAiTeacherSummaryDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_summary_draft_created', { draftId: draft.draftId, questionId: draft.questionId })
      toast.success('Summary draft created')
      void queryClient.invalidateQueries({ queryKey: tutorQueryKeys.aiTeacherDrafts() })
    },
    onError: () => toast.error('Failed to create summary draft'),
  })
}

export function useCreateAiTeacherExerciseDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAiTeacherExerciseDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_exercise_draft_created', { draftId: draft.draftId, studentId: draft.studentId })
      toast.success('Exercise draft created')
      void queryClient.invalidateQueries({ queryKey: tutorQueryKeys.aiTeacherDrafts() })
    },
    onError: () => toast.error('Failed to create exercise draft'),
  })
}

export function useRegenerateAiTeacherDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateAiTeacherDraft,
    onSuccess: (draft) => {
      trackEvent('ai_teacher_draft_regenerated', { draftId: draft.draftId, previousDraftId: draft.previousDraftId })
      toast.success('Draft regenerated')
      void queryClient.invalidateQueries({ queryKey: tutorQueryKeys.aiTeacherDrafts() })
    },
    onError: () => toast.error('Failed to regenerate draft'),
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
      toast.success(`Draft ${status}`)
      void queryClient.invalidateQueries({ queryKey: tutorQueryKeys.aiTeacherDrafts() })
      void queryClient.invalidateQueries({ queryKey: tutorQueryKeys.aiTeacherDraft(draft.draftId) })
    },
    onError: () => toast.error(`Failed to mark draft ${status}`),
  })
}
