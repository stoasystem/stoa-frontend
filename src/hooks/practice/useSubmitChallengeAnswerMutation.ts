import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitChallengeAnswer } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import type { PracticeAnswerRequest } from '@/types/practice'

/**
 * One answer in a lesson. A right one can light the knowledge point and any
 * answer reschedules review, so the sky and the review read again (#342) --
 * not the lesson itself, which is on screen.
 */
export function useSubmitChallengeAnswerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ challengeId, payload }: { challengeId: string; payload: PracticeAnswerRequest }) =>
      submitChallengeAnswer(challengeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...practiceQueryKeys.all, 'knowledge-map'] })
      void queryClient.invalidateQueries({ queryKey: [...practiceQueryKeys.all, 'review-due'] })
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.reviewSummary() })
    },
  })
}
